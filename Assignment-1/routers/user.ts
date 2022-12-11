import { constants } from "http2";
import {
  DataErrors,
  IDataError,
  IRequest,
  IResult,
  IUser,
  Request,
} from "../types";

import * as _data from "../lib/data";
import { withUserValidator } from "../models/user";

const handler: any = {};

handler.get = (
  { query }: IRequest<IUser>,
  callback: (result: IResult) => void
) => {
  const phone =
    typeof query.phone === "string" && query.phone.trim().length === 10
      ? query.phone.trim()
      : null;

  if (!phone) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: "Missing required field: [phone]",
    });
    return;
  }

  _data
    .read<IUser>("user", phone)
    .then(({ password, ...data }) => {
      callback({
        statusCode: constants.HTTP_STATUS_OK,
        data,
      });
    })
    .catch((_) => {
      callback({ statusCode: constants.HTTP_STATUS_NOT_FOUND });
    });
};

handler.post = (
  { payload }: IRequest<IUser>,
  callback: (result: IResult) => void
) => {
  const userProxy = withUserValidator(payload);
  try {
    userProxy.firstName = payload.firstName;
    userProxy.lastName = payload.lastName;
    userProxy.phone = payload.phone;
    userProxy.password = payload.password;
    userProxy.tosAgreement = payload.tosAgreement;

    _data
      .read<IUser>("users", userProxy.phone!)
      .then(() =>
        callback({
          statusCode: constants.HTTP_STATUS_BAD_REQUEST,
          message: "A user with that phone number already exists",
        })
      )
      .catch((_) => {
        return _data.create("user", userProxy.phone!, user);
      })
      .then(() => callback({ statusCode: constants.HTTP_STATUS_OK }))
      .catch((_) =>
        callback({
          statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
          message: "Could not create the new user",
        })
      );
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
  }
};

handler.put = (
  { payload }: IRequest<IUser>,
  callback: (result: IResult) => void
) => {
  const phone =
    typeof payload.phone === "string" && payload.phone.trim().length === 10
      ? payload.phone.trim()
      : "";

  if (!phone) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: "Missing required field: [phone]",
    });
    return;
  }

  _data
    .read<IUser>("user", phone)
    .then((user) => {
      const userProxy = withUserValidator(user);
      if (payload.firstName) userProxy.firstName = payload.firstName;
      if (payload.lastName) userProxy.lastName = payload.lastName;
      if (payload.password) userProxy.password = payload.password;
      return _data.update("user", phone, user);
    })
    .then(() => callback({ statusCode: constants.HTTP_STATUS_OK }))
    .catch((e: IDataError) => {
      switch (e.code) {
        case DataErrors.UPDATE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Could not update the user.",
          });
          break;
        case DataErrors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: "Specified user does not exist.",
          });
      }
    });
};

handler.delete = (
  { query }: IRequest<IUser>,
  callback: (result: IResult) => void
) => {
  const phone =
    typeof query.phone === "string" && query.phone.trim().length === 10
      ? query.phone.trim()
      : null;

  if (!phone) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: "Missing required field: [phone]",
    });
    return;
  }

  _data
    .read<IUser>("user", phone)
    .then(() => _data.remove("user", phone))
    .then(() => {
      callback({ statusCode: constants.HTTP_STATUS_OK });
    })
    .catch((e: IDataError) => {
      switch (e.code) {
        case DataErrors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: "Could not find the specified user.",
          });
          break;
        case DataErrors.DELETE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Could not delete the specified user",
          });
      }
    });
};

export const user = (data: Request, callback: any) => {
  if (data.method && handler[data.method]) {
    handler[data.method.toLowerCase()](data, callback);
  } else {
    callback(constants.HTTP_STATUS_METHOD_NOT_ALLOWED);
  }
};
