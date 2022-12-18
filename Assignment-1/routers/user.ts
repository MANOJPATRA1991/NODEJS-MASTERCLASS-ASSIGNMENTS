import { constants } from "http2";
import { Errors, IError, IRequest, IResult, IUser } from "../types";

import * as db from "../lib/data";
import { withUserValidator } from "../validators/user";
import { verifyToken } from "./tokens";

const handler: any = {};

handler.get = (
  { query, headers }: IRequest<IUser, { phone: string }>,
  callback: (result: IResult) => void
) => {
  const validator = withUserValidator({
    errors: {
      phone:
        "[phone] is a required field and should have a length of 10 characters",
    },
  });

  try {
    validator.phone = query.phone;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  const { token = "" } = headers;
  verifyToken(token as string, validator.phone)
    .then(() => {
      return db.read<IUser>("users", validator.phone!);
    })
    .then(({ password, ...data }) => {
      callback({
        statusCode: constants.HTTP_STATUS_OK,
        data,
      });
    })
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          callback({ statusCode: constants.HTTP_STATUS_NOT_FOUND });
          break;
        case Errors.INVALID_TOKEN_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            error: e.message,
          });
      }
    });
};

handler.post = (
  { payload }: IRequest<IUser>,
  callback: (result: IResult) => void
) => {
  const validator = withUserValidator({ user: payload });
  try {
    validator.firstName = payload.firstName;
    validator.lastName = payload.lastName;
    validator.phone = payload.phone;
    validator.password = payload.password;
    validator.tosAgreement = payload.tosAgreement;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  db.read<IUser>("users", validator.phone!)
    .then(() => {
      callback({
        statusCode: constants.HTTP_STATUS_BAD_REQUEST,
        error: "A user with that phone number already exists",
      });
    })
    .catch((_) => {
      return db.create("users", validator.phone!, payload);
    })
    .then(() => {
      callback({ statusCode: constants.HTTP_STATUS_OK });
    })
    .catch((e) => {
      callback({
        statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        error: "Could not create the new user",
      });
    });
};

handler.put = (
  {
    query,
    payload,
    headers,
  }: IRequest<
    Partial<Pick<IUser, "firstName" | "lastName" | "password">>,
    { phone: string }
  >,
  callback: (result: IResult) => void
) => {
  const validator = withUserValidator({
    errors: {
      phone:
        "[phone]: is a required field and should have a length of 10 characters",
    },
  });

  try {
    validator.phone = query.phone;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  const { token = "" } = headers;

  verifyToken(token as string, validator.phone!)
    .then(() => {
      return db.read<IUser>("users", validator.phone!);
    })
    .then((user) => {
      const userProxy = withUserValidator({ user });
      if (payload.firstName) userProxy.firstName = payload.firstName;
      if (payload.lastName) userProxy.lastName = payload.lastName;
      if (payload.password) userProxy.password = payload.password;
      return db.update("users", user.phone, user);
    })
    .then(() => callback({ statusCode: constants.HTTP_STATUS_OK }))
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.UPDATE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not update the user.",
          });
          break;
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "Specified user with does not exist.",
          });
        case Errors.INVALID_TOKEN_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            error: e.message,
          });
        default:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: e.message,
          });
      }
    });
};

handler.delete = (
  { query, headers }: IRequest<IUser, { phone: string }>,
  callback: (result: IResult) => void
) => {
  const validator = withUserValidator({
    errors: {
      phone:
        "[phone]: is a required field and should have a length of 10 characters",
    },
  });

  try {
    validator.phone = query.phone;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  const { token = "" } = headers;

  verifyToken(token as string, validator.phone)
    .then(() => {
      return db.read<IUser>("users", validator.phone!);
    })
    .then((user) => {
      user.checks = Array.isArray(user.checks) ? user.checks : [];
      return Promise.all([
        ...user.checks.map((checkId) => db.remove("checks", checkId)),
        db.remove("users", user.phone),
      ]);
    })
    .then(() => {
      callback({ statusCode: constants.HTTP_STATUS_OK });
    })
    .catch((e) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "Could not find the specified user.",
          });
          break;
        case Errors.DELETE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not perform delete successfully",
          });
          break;
        case Errors.INVALID_TOKEN_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            error: e.message,
          });
      }
    });
};

export const users = (data: any, callback: (result: IResult) => void) => {
  const method = data.method.toLowerCase();
  if (data.method && handler[method]) {
    handler[method](data, callback);
  } else {
    callback({
      statusCode: constants.HTTP_STATUS_METHOD_NOT_ALLOWED,
    });
  }
};
