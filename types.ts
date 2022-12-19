import http from "http";
import { IncomingHttpHeaders } from "http2";

export enum Environments {
  PRODUCTION = "production",
  STAGING = "staging",
}

export interface IEnvironment {
  httpPort: number;
  httpsPort: number;
  envName: Environments;
  hashingSecret: string;
  maxChecks: number;
  twilio: {
    fromPhone: string;
    accountSID: string;
    authToken: string;
  };
}

export type Response = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};

export type Request = http.IncomingMessage;

export interface IResult<T = unknown> {
  statusCode: number;
  error?: string;
  data?: T;
}

export interface IUser {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  tosAgreement: boolean;
  checks?: string[];
}

export interface IToken {
  phone: string;
  id: string;
  expires: number;
}

export enum ProcessState {
  UP = "UP",
  DOWN = "DOWN",
}

export interface ICheck {
  id: string;
  userPhone: string;
  protocol: "http" | "https";
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  successCodes: number[];
  timeout: number;
  state: ProcessState;
  lastChecked: number;
}

export enum Errors {
  READ_ERROR = "READ",
  WRITE_ERROR = "WRITE",
  UPDATE_ERROR = "UPDATE",
  DELETE_ERROR = "DELETE",
  OPEN_ERROR = "OPEN",
  TOKEN_EXPIRED_ERROR = "TOKEN_EXPIRED",
  PASSWORD_MISMATCH_ERROR = "PASSWORD_MISMATCH",
  INVALID_TOKEN_ERROR = "INVALID_TOKEN",
  MAX_CHECKS_EXCEEDED = "MAX_CHECKS_EXCEEDED",
  LS_ERROR = "LS_ERROR",
  COMPRESS_ERROR = "COMPRESS_ERROR",
  DECOMPRESS_ERROR = "DECOMPRESS_ERROR",
  TRUNCATE_ERROR = "TRUNCATE_ERROR",
  CLOSE_ERROR = "CLOSE_ERROR",
}

export interface IError {
  code: Errors;
  message?: string;
}

export interface IRequest<T, Q = {}> {
  query: Q;
  path: string;
  headers: IncomingHttpHeaders;
  method: "GET" | "POST" | "PUT" | "DELETE";
  payload: Partial<T>;
}

export enum FileSystemFlags {
  READ_EXISTING_FILE = "r",
  READ_AND_WRITE_EXISTING_FILE = "r+",
  SYNC_READ_AND_WRITE = "rs+",
  WRITE_ANY_FILE = "w",
  WRITE_NEW_FILE = "wx",
  READ_AND_WRITE_ANY_FILE = "w+",
  READ_AND_WRITE_NEW_FILE = "wx+",
  APPEND_ANY_FILE = "a",
  APPEND_NEW_FILE = "ax",
  READ_AND_APPEND_ANY_FILE = "a+",
  READ_AND_APPEND_NEW_FILE = "ax+",
}
