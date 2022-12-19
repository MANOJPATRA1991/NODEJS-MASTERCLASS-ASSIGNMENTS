import { constants } from "http2";
import { Errors, IError, IRequest, IResult, IUser } from "../types";

import * as db from "../lib/data";
import { withUserValidator } from "../validators/user";
import { verifyToken } from "./tokens";

const get = (
  { query, headers: { token = "" } }: IRequest<IUser, { phone: string }>,
  next: (result: IResult<Omit<IUser, "password">>) => void
) => {
  const validator = withUserValidator({
    errors: {
      phone:
        "[phone]: required field and should have a length of 10 characters",
    },
  });

  try {
    validator.phone = query.phone;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  verifyToken(token as string, validator.phone)
    .then(() => {
      return db.read<IUser>("users", validator.phone!);
    })
    .then(({ password, ...data }) => {
      next({
        statusCode: constants.HTTP_STATUS_OK,
        data,
      });
    })
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          next({ statusCode: constants.HTTP_STATUS_NOT_FOUND });
          break;
        case Errors.INVALID_TOKEN_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            error: e.message,
          });
      }
    });
};

const post = (
  { payload }: IRequest<IUser>,
  next: (result: IResult) => void
) => {
  const validator = withUserValidator({ data: payload });
  try {
    validator.firstName = payload.firstName;
    validator.lastName = payload.lastName;
    validator.phone = payload.phone;
    validator.password = payload.password;
    validator.tosAgreement = payload.tosAgreement;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  db.read<IUser>("users", validator.phone!)
    .then(() => {
      next({
        statusCode: constants.HTTP_STATUS_BAD_REQUEST,
        error: "A user with that phone number already exists",
      });
    })
    .catch((_) => {
      return db.create("users", validator.phone!, payload);
    })
    .then(() => {
      next({ statusCode: constants.HTTP_STATUS_OK });
    })
    .catch((e) => {
      next({
        statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        error: "Could not create the new user",
      });
    });
};

const put = (
  {
    query,
    payload,
    headers,
  }: IRequest<
    Partial<Pick<IUser, "firstName" | "lastName" | "password">>,
    { phone: string }
  >,
  next: (result: IResult) => void
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
    next({
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
      const userProxy = withUserValidator({ data: user });
      userProxy.firstName = payload.firstName ?? userProxy.firstName;
      userProxy.lastName = payload.lastName ?? userProxy.lastName;
      userProxy.password = payload.password ?? userProxy.password;
      return db.update("users", user.phone, user);
    })
    .then(() => next({ statusCode: constants.HTTP_STATUS_OK }))
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.UPDATE_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not update the user.",
          });
          break;
        case Errors.READ_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "Specified user with does not exist.",
          });
        case Errors.INVALID_TOKEN_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            error: e.message,
          });
        default:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: e.message,
          });
      }
    });
};

const remove = (
  { query, headers }: IRequest<IUser, { phone: string }>,
  next: (result: IResult) => void
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
    next({
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
      next({ statusCode: constants.HTTP_STATUS_OK });
    })
    .catch((e) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "Could not find the specified user.",
          });
          break;
        case Errors.DELETE_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not perform delete successfully",
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
  put,
  post,
  delete: remove,
};

export const users = (data: any, next: (result: IResult) => void) => {
  const method = data.method.toLowerCase();
  if (data.method && handler[method]) {
    handler[method](data, next);
  } else {
    next({
      statusCode: constants.HTTP_STATUS_METHOD_NOT_ALLOWED,
    });
  }
};
