import { constants } from "http2";
import { withUserValidator } from "../validators/user";
import * as db from "../lib/data";
import { Errors, IError, IRequest, IResult, IToken, IUser } from "../types";
import { createRandomString } from "../lib/helpers";
import { withTokenValidator } from "../validators/token";

const post = (
  { payload }: IRequest<Pick<IUser, "password" | "phone">>,
  next: (result: IResult<IToken>) => void
) => {
  const validator = withUserValidator({
    errors: {
      phone: "[phone]: required field",
      password: "[password]: required field",
    },
  });
  try {
    validator.password = payload.password;
    validator.phone = payload.phone;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  db.read<IUser>("users", validator.phone!)
    .then((user) => {
      if (user.password === validator.password) {
        const tokenId = createRandomString(20);
        const expires = Date.now() + 1000 * 60 * 60;
        const tokenObject: IToken = {
          phone: validator.phone!,
          id: tokenId,
          expires: expires,
        };
        return db.create<IToken>("tokens", tokenId, tokenObject);
      } else {
        throw {
          code: Errors.PASSWORD_MISMATCH_ERROR,
        };
      }
    })
    .then((data) =>
      next({
        statusCode: constants.HTTP_STATUS_OK,
        data,
      })
    )
    .catch((e: IError) => {
      switch (e.code) {
        case Errors.WRITE_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not create the new token",
          });
          break;
        case Errors.READ_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "Could not find the specified user.",
          });
          break;
        case Errors.PASSWORD_MISMATCH_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error:
              "Password did not match the specified user's stored password",
          });
      }
    });
};

const get = (
  { query }: IRequest<IUser, { id: string }>,
  next: (result: IResult<IToken>) => void
) => {
  const validator = withTokenValidator({});

  try {
    validator.id = query.id;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  db.read<IToken>("tokens", validator.id)
    .then((token) => {
      next({
        statusCode: constants.HTTP_STATUS_OK,
        data: token,
      });
    })
    .catch((e) => {
      next({
        statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      });
    });
};

const put = (
  { query }: IRequest<IUser, { id: string; extend?: boolean }>,
  next: (result: IResult) => void
) => {
  const validator = withTokenValidator({});

  try {
    validator.id = query.id;
    validator.extend = query.extend;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  db.read<IToken>("tokens", validator.id)
    .then((token) => {
      if (token.expires > Date.now()) {
        token.expires = Date.now() + 1000 * 60 * 60;
        return db.update("tokens", token.id, token);
      } else {
        throw {
          code: Errors.TOKEN_EXPIRED_ERROR,
        };
      }
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
            error: "Could not update the token's expiration.",
          });
          break;
        case Errors.READ_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "Could not find the specified token.",
          });
          break;
        case Errors.TOKEN_EXPIRED_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "The token has already expired, and cannot be extended.",
          });
      }
    });
};

const remove = (
  { query }: IRequest<IUser, { id: string }>,
  next: (result: IResult) => void
) => {
  const validator = withTokenValidator({});

  try {
    validator.id = query.id;
  } catch (e) {
    next({
      statusCode: constants.HTTP_STATUS_BAD_REQUEST,
      error: (e as Error).message,
    });
    return;
  }

  db.read<IToken>("tokens", validator.id)
    .then((data) => {
      return db.remove("tokens", data.id);
    })
    .then(() => {
      next({
        statusCode: constants.HTTP_STATUS_OK,
      });
    })
    .catch((e) => {
      switch (e.code) {
        case Errors.DELETE_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            error: "Could not delete the specified token",
          });
          break;
        case Errors.READ_ERROR:
          next({
            statusCode: constants.HTTP_STATUS_BAD_REQUEST,
            error: "Could not find the specified token.",
          });
      }
    });
};

export const verifyToken = (id: string, phone: string) => {
  return db
    .read<IToken>("tokens", id)
    .then((token) => {
      if (token.phone === phone && token.expires > Date.now()) {
        return true;
      } else {
        throw new Error();
      }
    })
    .catch((_) => {
      throw {
        code: Errors.INVALID_TOKEN_ERROR,
        message: "Missing required token in header, or token is invalid.",
      };
    });
};

const handler = {
  get,
  post,
  put,
  delete: remove,
};

export const tokens = (data: any, next: (result: IResult) => void) => {
  const method = data.method.toLowerCase();
  if (data.method && handler[method]) {
    handler[method](data, next);
  } else {
    next({
      statusCode: constants.HTTP_STATUS_METHOD_NOT_ALLOWED,
    });
  }
};
