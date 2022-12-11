import { constants } from "http2";
import { withUserValidator } from "../models/user";
import * as _data from "../lib/data";
import { Errors, IRequest, IResult, IToken, IUser } from "../types";
import { createRandomString } from "../lib/helpers";
import { withTokenValidator } from "../models/token";

const handler: any = {};

handler.post = (
  { payload }: IRequest<Pick<IUser, "password" | "phone">>,
  callback: (result: IResult) => void
) => {
  const validPayload = withUserValidator({
    errors: {
      phone: "Missing required field: [phone]",
      password: "Missing required field: [password]",
    },
  });
  try {
    validPayload.password = payload.password;
    validPayload.phone = payload.phone;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  _data
    .read<IUser>("users", validPayload.phone!)
    .then((user) => {
      if (user.password === validPayload.password) {
        const tokenId = createRandomString(20);
        const expires = Date.now() + 1000 * 60 * 60;
        const tokenObject: IToken = {
          phone: validPayload.phone!,
          id: tokenId,
          expires: expires,
        };
        return _data.create("tokens", tokenId, tokenObject);
      } else {
        throw {
          code: Errors.PASSWORD_MISMATCH_ERROR,
        };
      }
    })
    .then(data =>
      callback({
        statusCode: constants.HTTP_STATUS_OK,
        data,
      })
    )
    .catch((e) => {
      let message = (e as Error).message;
      switch (e.code) {
        case Errors.WRITE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Could not create the new token",
          });
          break;
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: "Could not find the specified user.",
          });
          break;
        case Errors.PASSWORD_MISMATCH_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message:
              "Password did not match the specified user's stored password",
          });
      }
    });
};

handler.get = (
  { query }: IRequest<IUser, { id: string }>,
  callback: (result: IResult) => void
) => {
  const validQuery = withTokenValidator({});

  try {
    validQuery.id = query.id;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  _data
    .read<IToken>("tokens", validQuery.id)
    .then((token) => {
      callback({
        statusCode: constants.HTTP_STATUS_OK,
        data: token,
      });
    })
    .catch((e) => {
      callback({
        statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      });
    });
};

handler.put = (
  { query }: IRequest<IUser, { id: string; extend?: boolean }>,
  callback: (result: IResult) => void
) => {
  const validQuery = withTokenValidator({});

  try {
    validQuery.id = query.id;
    validQuery.extend = query.extend;
  } catch (e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  _data
    .read<IToken>("tokens", validQuery.id)
    .then((token) => {
      if (token.expires > Date.now()) {
        token.expires = Date.now() + 1000 * 60 * 60;
        return _data.update("tokens", token.id, token);
      } else {
        throw {
          code: Errors.TOKEN_EXPIRED_ERROR,
        };
      }
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
            message: "Could not update the token's expiration.",
          });
          break;
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: "Specified user does not exist.",
          });
          break;
        case Errors.TOKEN_EXPIRED_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: "The token has already expired, and cannot be extended.",
          });
      }
    });
};

handler.delete = (
  { query }: IRequest<IUser, { id: string; }>,
  callback: (result: IResult) => void
) => {
  const validQuery = withTokenValidator({});

  try {
    validQuery.id = query.id;
  } catch(e) {
    callback({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      message: (e as Error).message,
    });
    return;
  }

  _data.read<IToken>('tokens', validQuery.id)
    .then(data => {
      return _data.remove('tokens', data.id);
    })
    .then(() => {
      callback({
        statusCode: constants.HTTP_STATUS_OK,
      });
    })
    .catch(e => {
      switch(e.code) {
        case Errors.DELETE_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: 'Could not delete the specified token',
          });
          break;
        case Errors.READ_ERROR:
          callback({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            message: 'Could not find the specified token.',
          });
      }
    });
};

export const verifyToken = (
  id: string,
  phone: string,
) => {
  return _data.read<IToken>("tokens", id)
    .then(token => {
      if (token.phone === phone && token.expires > Date.now()) {
        return true;
      } else {
        throw new Error();
      }
    })
    .catch(e => {
      throw {
        code: Errors.INVALID_TOKEN_ERROR,
        message: "Missing required token in header, or token is invalid.",
      };
    });
};

export const tokens = (data: any, callback: (result: IResult) => void) => {
  const method = data.method.toLowerCase();
  if (data.method && handler[method]) {
    handler[method](data, callback);
  } else {
    callback({
      statusCode: constants.HTTP_STATUS_METHOD_NOT_ALLOWED,
    });
  }
};
