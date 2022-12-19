import { constants } from "http2";
import { IResult } from "../types";

export const hello = (data: any, next: (result: IResult) => void) => {
  next({ statusCode: constants.HTTP_STATUS_OK });
};
