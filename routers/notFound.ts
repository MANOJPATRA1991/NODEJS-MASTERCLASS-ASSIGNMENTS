import { constants } from "http2";
import { IResult } from "../types";

export const notFound = (data: any, next: (result: IResult) => void) => {
  next({ statusCode: constants.HTTP_STATUS_NOT_FOUND });
};
