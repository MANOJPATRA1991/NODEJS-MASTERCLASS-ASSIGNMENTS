import { constants } from "http2";
import { IResult } from "../types";

export const hello = (data: any, callback: (error: IResult) => void) => {
  callback({ statusCode: constants.HTTP_STATUS_OK });
};
