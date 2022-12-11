import { constants } from "http2";
import { IResult } from "../types";

export const notFound = (data: any, callback: (error: IResult) => void) => {
  callback({ statusCode: constants.HTTP_STATUS_NOT_FOUND });
};
