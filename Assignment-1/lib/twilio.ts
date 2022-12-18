import * as https from "https";
import * as querystring from "querystring";
import config from "../config";
import { withSMSValidator } from "../validators/twilio";

export const sendSMS = async (phone: string, message: string) => {
  const validator = withSMSValidator({});
  let error = '';
  try {
    validator.message = message;
    validator.phone = phone;
  } catch (e) {
    error = "Given parameters are missing or invalid";
  }

  const payload = querystring.stringify({
    From: config.twilio.fromPhone,
    To: `+1${phone}`,
    Body: message,
  });

  const requestDetails = {
    protocol: "https:",
    hostname: "api.twilio.com",
    method: "POST",
    path: `/2010-04-01/Accounts/${config.twilio.accountSID}/Messages.json`,
    auth: `${config.twilio.accountSID}:${config.twilio.authToken}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const req = https.request(requestDetails, ({ statusCode: status }) => {
    if (![200, 201].includes(status!)) {
      error = `Status code returned was ${status}`;
    }
  });

  req.on("error", (e: Error) => {
    error = e.message;
  });

  req.write(payload);

  req.end();

  throw new Error(error);
};
