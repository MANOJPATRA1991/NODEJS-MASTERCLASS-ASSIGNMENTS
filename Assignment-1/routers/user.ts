import { constants } from "http2";
import { Errors, IRequest, IResult, IUser } from "../types";

import * as _data from "../lib/data";
import { withUserValidator } from "../models/user";
import { verifyToken } from "./tokens";

const handler: any = {};

handler.get = (
  { query, headers }: IRequest<IUser, { phone: string }>,
  callback: (result: IResult) => void
) => {
  const validQuery = withUserValidator({
    errors: {
      phone:
        "[phone]: is a required field and should have a length of 10 characters",
    },
  });

  try {
    validQuery.phone = query.phone;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  const { token = "" } = headers;
  verifyToken(token as string, validQuery.phone)
    .then(() => {
      return _data.read<IUser>("users", validQuery.phone!);
    })
    .then(({ password, ...data }) => {
      callback({
        statusCode: constants.HTTP_STATUS_OK,
        data,
      });
    })
    .catch((e) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          callback({ statusCode: constants.HTTP_STATUS_NOT_FOUND });
          break;
        case Errors.INVALID_TOKEN_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            message: e.message,
          });
      }
    });
};

handler.post = (
  { payload }: IRequest<IUser>,
  callback: (result: IResult) => void
) => {
  const userProxy = withUserValidator({ user: payload });
  try {
    userProxy.firstName = payload.firstName;
    userProxy.lastName = payload.lastName;
    userProxy.phone = payload.phone;
    userProxy.password = payload.password;
    userProxy.tosAgreement = payload.tosAgreement;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  _data
    .read<IUser>("users", userProxy.phone!)
    .then(() =>
      callback({
        statusCode: constants.HTTP_STATUS_BAD_REQUEST,
        message: "A user with that phone number already exists",
      })
    )
    .catch((_) => {
      return _data.create("users", userProxy.phone!, payload);
    })
    .then(() => {
      callback({ statusCode: constants.HTTP_STATUS_OK });
    })
    .catch((e) => {
      callback({
        statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        message: "Could not create the new user",
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
  const validQuery = withUserValidator({
    errors: {
      phone:
        "[phone]: is a required field and should have a length of 10 characters",
    },
  });

  try {
    validQuery.phone = query.phone;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  const { token = "" } = headers;

  verifyToken(token as string, validQuery.phone!)
    .then(() => {
      return _data.read<IUser>("users", validQuery.phone!);
    })
    .then((user) => {
      const userProxy = withUserValidator({ user });
      if (payload.firstName) userProxy.firstName = payload.firstName;
      if (payload.lastName) userProxy.lastName = payload.lastName;
      if (payload.password) userProxy.password = payload.password;
      return _data.update("users", user.phone, user);
    })
    .then(() => callback({ statusCode: constants.HTTP_STATUS_OK }))
    .catch((e) => {
      switch (e.code) {
        case Errors.UPDATE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Could not update the user.",
          });
          break;
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: "Specified user with does not exist.",
          });
        case Errors.INVALID_TOKEN_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_FORBIDDEN,
            message: e.message,
          });
      }
    });
};

handler.delete = (
  { query, headers }: IRequest<IUser, { phone: string }>,
  callback: (result: IResult) => void
) => {
  const validQuery = withUserValidator({
    errors: {
      phone:
        "[phone]: is a required field and should have a length of 10 characters",
    },
  });

  try {
    validQuery.phone = query.phone;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  const { token = "" } = headers;

  verifyToken(token as string, validQuery.phone)
    .then(() => {
      return _data.read<IUser>("users", validQuery.phone!);
    })
    .then((user) => _data.remove("users", user.phone))
    .then(() => {
      callback({ statusCode: constants.HTTP_STATUS_OK });
    })
    .catch((e) => {
      switch (e.code) {
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: "Could not find the specified user.",
          });
          break;
        case Errors.DELETE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Could not delete the specified user",
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
