import urllib from "url";
import http from "http";
import https from "https";
import * as db from "./data";
import * as logLib from "./logs";
import { ICheck, IError, IResult, ProcessState } from "../types";
import { withCheckValidator } from "../validators/check";
import { sendSMS } from "./twilio";

const alertUserToStatusChange = (check: ICheck) => {
  const message = `Your check for ${check.method} ${check.protocol}://${check.url} is currently ${check.state}`;
  sendSMS(check.userPhone, message)
    .then(() => console.log("Success! User is alerted"))
    .catch(() => console.log("Couldn't send user alert!"));
};

const processCheckOutcome = (check: ICheck, checkOutcome: IResult) => {
  const state =
    !checkOutcome.error &&
    checkOutcome.statusCode &&
    check.successCodes.includes(checkOutcome.statusCode)
      ? ProcessState.UP
      : ProcessState.DOWN;

  const alert = Boolean(check.lastChecked && state !== check.state);

  check.state = state;
  check.lastChecked = Date.now();

  logLib
    .append(
      check.id,
      JSON.stringify({
        check,
        checkOutcome,
        state,
        alert,
        time: Date.now(),
      })
    )
    .then(() => console.log("Logging to file succeeded"))
    .catch(() => console.log("Logging to file failed"));

  db.update("checks", check.id, check)
    .then(() => {
      if (alert) {
        alertUserToStatusChange(check);
      } else {
        console.log("Check outcome has not changed, no alert needed");
      }
    })
    .catch(() => {
      console.log("Error trying to save updates to one of the checks");
    });
};

const performCheck = (check: ICheck) => {
  const { protocol, url, method, timeout } = check;
  let checkOutcome: IResult | any = {};

  const { path, hostname } = urllib.parse(`${protocol}://${url}`, true);

  const requestOptions = {
    protocol: `${protocol}:`,
    hostname,
    method,
    path,
    timeout: timeout * 1000,
  };

  const moduleProtocol = protocol === "http" ? http : https;

  const request = moduleProtocol.request(requestOptions, (res) => {
    checkOutcome.statusCode = res.statusCode as number;
    processCheckOutcome(check, checkOutcome);
  });

  const errorHandler = (e: Error) => {
    checkOutcome.error = e.message;
    processCheckOutcome(check, checkOutcome);
  };

  request.on("error", (e) => errorHandler(e));

  request.on("timeout", () => errorHandler(new Error("Timeout")));

  request.end();
};

function validateCheckData(check: ICheck) {
  const validator = withCheckValidator({});

  try {
    validator.userPhone = check.userPhone;
    validator.id = check.id;
    validator.method = check.method;
    validator.protocol = check.protocol;
    validator.url = check.url;
    validator.successCodes = check.successCodes;
    validator.timeout = check.timeout;
    validator.state = check.state;
    validator.lastChecked = check.lastChecked;

    performCheck(check);
  } catch (e) {
    console.log("One of the checks is not properly formatted. Skipping it.");
  }
}

function gatherAllChecks() {
  db.list("checks")
    .then((checks) => {
      if (checks.length > 0) {
        return Promise.allSettled([
          ...checks.map((check) => db.read<ICheck>("checks", check)),
        ]);
      } else {
        throw Error("Could not find any checks to process");
      }
    })
    .then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.log("Error reading one of the check's data");
        } else {
          validateCheckData(result.value);
        }
      });
    })
    .catch((e) => {
      console.log(e);
    });
}

function loop() {
  setInterval(() => {
    gatherAllChecks();
  }, 1000 * 60);
}

function rotateLogs() {
  let promises: Promise<{ logId: string; newFileId: string } | undefined>[] =
    [];
  logLib
    .list(false)
    .then((logs) => {
      if (logs && logs.length) {
        promises = logs.map((log) => {
          const logId = log.replace(".log", "");
          const newFileId = `${logId}-${Date.now()}`;
          return logLib.compress(logId, newFileId);
        });
      } else {
        console.log("Could not find any logs to rotate");
      }
      return Promise.allSettled(promises);
    })
    .then((results: PromiseSettledResult<any>[]) => {
      const promises: Promise<{ logId: string }>[] = [];
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.log("Error compressing one of the log files", result.reason);
        } else {
          promises.push(logLib.truncate(result.value.logId));
        }
      });
      return Promise.allSettled(promises);
    })
    .then((results: PromiseSettledResult<any>[]) => {
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.log("Error truncating logfile");
        } else {
          console.log("Success truncating logfile");
        }
      });
    })
    .catch((e: IError) => {
      console.log(e.message);
    });
}

function rotateLogsLoop() {
  setInterval(() => {
    rotateLogs();
  }, 1000 * 60 * 60 * 24);
}

export const worker = () => {
  gatherAllChecks();

  loop();

  rotateLogs();

  rotateLogsLoop();
};
