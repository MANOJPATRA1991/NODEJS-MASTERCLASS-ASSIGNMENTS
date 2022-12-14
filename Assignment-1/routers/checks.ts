import { constants } from "http2";
import {
  Errors,
  ICheck,
  IError,
  IRequest,
  IResult,
  IToken,
  IUser,
} from "../types";
import { withCheckValidator } from "../validators/check";
import * as db from "../lib/data";
import config from "../config";
import { createRandomString } from "../lib/helpers";
import { verifyToken } from "./tokens";

const handler: any = {};

handler.post = (
  { headers, payload }: IRequest<ICheck>,
  callback: (result: IResult) => void
) => {
  const validator = withCheckValidator({});
  try {
    validator.protocol = payload.protocol;
    validator.method = payload.method;
    validator.successCodes = payload.successCodes;
    validator.timeout = payload.timeout;
    validator.url = payload.url;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  const { token = "" } = headers;
  db.read<IToken>("tokens", token as string)
    .then((token) => {
      return db.read<IUser>("users", token.phone);
    })
    .then((user) => {
      user.checks = Array.isArray(user.checks) ? user.checks : [];
      if (user.checks.length < config.maxChecks) {
        const checkId = createRandomString(20);

        const checkObject: ICheck = {
          id: checkId,
          userPhone: user.phone,
          protocol: validator.protocol!,
          url: validator.url!,
          method: validator.method!,
          successCodes: validator.successCodes!,
          timeout: validator.timeout!,
        };

        return Promise.all([
          db.create<ICheck>("checks", checkId, checkObject),
          user,
        ]);
      } else {
        throw {
          code: Errors.MAX_CHECKS_EXCEEDED,
        };
      }
    })
    .then(([check, user]) => {
      user.checks?.push(check.id);
      return Promise.all([db.update("users", user.phone, user), check]);
    })
    .then(([, check]) => {
      callback({
        statusCode: constants.HTTP_STATUS_OK,
        data: check,
      });
    })
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
          });
          break;
        case Errors.WRITE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Could not create the new check",
          });
          break;
        case Errors.UPDATE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Could not update the user with the new check",
          });
          break;
        case Errors.MAX_CHECKS_EXCEEDED:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: `The user already has the maximum number of checks: ${config.maxChecks}`,
          });
      }
    });
};

handler.get = (
  { query, headers }: IRequest<ICheck, { id: string }>,
  callback: (result: IResult) => void
) => {
  const validator = withCheckValidator({
    errors: {
      id: "Missing required field [id]",
    },
  });

  try {
    validator.id = query.id;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  db.read<ICheck>("checks", validator.id)
    .then((check) => {
      const { token = "" } = headers;
      return Promise.all([
        verifyToken(token as string, check.userPhone),
        check,
      ]);
    })
    .then(([, check]) => {
      callback({
        statusCode: constants.HTTP_STATUS_OK,
        data: check,
      });
    })
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_NOT_FOUND,
          });
          break;
        case Errors.INVALID_TOKEN_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            message: e.message,
          });
      }
    });
};

handler.put = (
  { payload, headers }: IRequest<ICheck, { id: string }>,
  callback: (result: IResult) => void
) => {
  const validator = withCheckValidator({});
  try {
    if (payload.protocol) validator.protocol = payload.protocol;
    if (payload.method) validator.method = payload.method;
    if (payload.successCodes) validator.successCodes = payload.successCodes;
    if (payload.timeout) validator.timeout = payload.timeout;
    if (payload.url) validator.url = payload.url;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  if (payload.id) {
    if (
      validator.protocol ||
      validator.url ||
      validator.method ||
      validator.successCodes ||
      validator.timeout
    ) {
      db.read<ICheck>("checks", payload.id)
      .then((check) => {
        const { token = "" } = headers;
        return Promise.all([
          verifyToken(token as string, check.userPhone),
          check,
        ]);
      })
      .then(([ , check ]) => {
        check.protocol = validator.protocol || check.protocol;
        check.url = validator.url || check.url;
        check.method = validator.method || check.method;
        check.successCodes = validator.successCodes || check.successCodes;
        check.timeout = validator.timeout || check.timeout;

        return db.update("checks", check.id, check);
      })
      .then(() => {
        callback({
          statusCode: constants.HTTP_STATUS_OK,
        });
      })
      .catch((e: IError) => {
        switch(e.code) {
          case Errors.UPDATE_ERROR:
            callback({
              statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
              message: "Could not update the check",
            });
            break;
          case Errors.READ_ERROR:
            callback({
              statusCode: constants.HTTP_STATUS_BAD_REQUEST,
              message: "Check ID does not exist",
            });
            break;
          case Errors.INVALID_TOKEN_ERROR:
            callback({
              statusCode: constants.HTTP_STATUS_FORBIDDEN,
              message: e.message,
            });
        }
      });
    }
  } else {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: "Missing fields to update",
    });
  }
};

handler.delete = (
  { query, headers }: IRequest<IUser, { id: string }>,
  callback: (result: IResult) => void
) => {
  const validator = withCheckValidator({});

  try {
    validator.id = query.id;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  const { token = "" } = headers;

  db.read<ICheck>("checks", validator.id)
  .then((check) => {
    return Promise.all([
      verifyToken(token as string, check.userPhone),
      { id: check.id, phone: check.userPhone },
    ]);
  })
  .then(([ , { id, phone } ]) => {
    return Promise.all([
      db.remove("checks", id),
      phone
    ]);
  })
  .then(([ , phone ]) => {
    return db.read<IUser>("users", phone);
  })
  .then((user) => {
    user.checks = Array.isArray(user.checks) ? user.checks : [];
    const checkIndex = user.checks.indexOf(validator.id!);
    if (checkIndex > -1) {
      user.checks.splice(checkIndex, 1);
    }
    return db.update("users", user.phone, user);
  })
  .then(() => {
    callback({
      statusCode: constants.HTTP_STATUS_OK,
    });
  })
  .catch((e) => {
    switch (e.code) {
      case Errors.UPDATE_ERROR:
        callback({
          statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
          message: "Could not update the user",
        });
        break;
      case Errors.READ_ERROR:
        callback({
          statusCode: constants.HTTP_STATUS_BAD_REQUEST,
          message: "Could not read the specified data",
        });
        break;
      case Errors.DELETE_ERROR:
        callback({
          statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
          message: "Could not delete the specified data",
        });
        break;
      case Errors.INVALID_TOKEN_ERROR:
        callback({
          statusCode: constants.HTTP_STATUS_FORBIDDEN,
          message: e.message,
        });
    }
  });
};

export const checks = (data: any, callback: (result: IResult) => void) => {
  const method = data.method.toLowerCase();
  if (data.method && handler[method]) {
    handler[method](data, callback);
  } else {
    callback({
      statusCode: constants.HTTP_STATUS_METHOD_NOT_ALLOWED,
    });
  }
};

// checkId: muzk6bytj7nd0mz7a480
