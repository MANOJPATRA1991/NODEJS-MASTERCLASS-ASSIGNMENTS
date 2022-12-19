import { constants } from "http2";
import {
  Errors,
  ICheck,
  IError,
  IRequest,
  IResult,
  IToken,
  IUser,
  ProcessState,
} from "../types";
import { withCheckValidator } from "../validators/check";
import * as db from "../lib/data";
import config from "../config";
import { createRandomString } from "../lib/helpers";
import { verifyToken } from "./tokens";

const post = (
  { headers: { token = "" }, payload }: IRequest<ICheck>,
  next: (result: IResult) => void
) => {
  const validator = withCheckValidator({});
  try {
    validator.protocol = payload.protocol;
    validator.method = payload.method;
    validator.successCodes = payload.successCodes;
    validator.timeout = payload.timeout;
    validator.url = payload.url;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

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
          state: ProcessState.DOWN,
          lastChecked: 0,
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
      next({
        statusCode: constants.HTTP_STATUS_OK,
        data: check,
      });
    })
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
          });
          break;
        case Errors.WRITE_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not create the new check",
          });
          break;
        case Errors.UPDATE_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not update the user with the new check",
          });
          break;
        case Errors.MAX_CHECKS_EXCEEDED:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: `The user already has the maximum number of checks: ${config.maxChecks}`,
          });
      }
    });
};

const get = (
  { query, headers: { token = "" } }: IRequest<ICheck, { id: string }>,
  next: (result: IResult) => void
) => {
  const validator = withCheckValidator({
    errors: {
      id: "[id]: required field",
    },
  });

  try {
    validator.id = query.id;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  db.read<ICheck>("checks", validator.id)
    .then((check) => {
      return Promise.all([
        verifyToken(token as string, check.userPhone),
        check,
      ]);
    })
    .then(([, check]) => {
      next({
        statusCode: constants.HTTP_STATUS_OK,
        data: check,
      });
    })
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_NOT_FOUND,
          });
          break;
        case Errors.INVALID_TOKEN_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            error: e.message,
          });
      }
    });
};

const put = (
  { payload, headers }: IRequest<ICheck, { id: string }>,
  next: (result: IResult) => void
) => {
  const validator = withCheckValidator({});
  try {
    if (payload.protocol) validator.protocol = payload.protocol;
    if (payload.method) validator.method = payload.method;
    if (payload.successCodes) validator.successCodes = payload.successCodes;
    if (payload.timeout) validator.timeout = payload.timeout;
    if (payload.url) validator.url = payload.url;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
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
        .then(([, check]) => {
          check.protocol = validator.protocol ?? check.protocol;
          check.url = validator.url ?? check.url;
          check.method = validator.method ?? check.method;
          check.successCodes = validator.successCodes ?? check.successCodes;
          check.timeout = validator.timeout ?? check.timeout;

          return db.update("checks", check.id, check);
        })
        .then(() => {
          next({
            statusCode: constants.HTTP_STATUS_OK,
          });
        })
        .catch((e: IError) => {
          switch (e.code) {
            case Errors.UPDATE_ERROR:
              next({
                statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
                error: "Could not update the check",
              });
              break;
            case Errors.READ_ERROR:
              next({
                statusCode: constants.HTTP_STATUS_BAD_REQUEST,
                error: "Check ID does not exist",
              });
              break;
            case Errors.INVALID_TOKEN_ERROR:
              next({
                statusCode: constants.HTTP_STATUS_FORBIDDEN,
                error: e.message,
              });
          }
        });
    }
  } else {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: "Missing fields to update",
    });
  }
};

const remove = (
  { query, headers }: IRequest<IUser, { id: string }>,
  next: (result: IResult) => void
) => {
  const validator = withCheckValidator({});

  try {
    validator.id = query.id;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
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
    .then(([, { id, phone }]) => {
      return Promise.all([db.remove("checks", id), phone]);
    })
    .then(([, phone]) => {
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
      next({
        statusCode: constants.HTTP_STATUS_OK,
      });
    })
    .catch((e) => {
      switch (e.code) {
        case Errors.UPDATE_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not update the user",
          });
          break;
        case Errors.READ_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "Could not read the specified data",
          });
          break;
        case Errors.DELETE_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not delete the specified data",
          });
          break;
        case Errors.INVALID_TOKEN_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            error: e.message,
          });
      }
    });
};

const handler = {
  get,
  post,
  put,
  delete: remove,
};

export const checks = (data: any, next: (result: IResult) => void) => {
  const method = data.method.toLowerCase();
  if (data.method && handler[method]) {
    handler[method](data, next);
  } else {
    next({
      statusCode: constants.HTTP_STATUS_METHOD_NOT_ALLOWED,
    });
  }
};
