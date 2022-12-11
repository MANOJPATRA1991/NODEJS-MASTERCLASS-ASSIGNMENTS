import http from 'http';
import { IncomingHttpHeaders } from 'http2';
import { ParsedUrlQuery } from 'querystring';

export enum Environments {
  PRODUCTION = 'production',
  STAGING = 'staging'
}

export interface IEnvironment {
  httpPort: number;
  httpsPort: number;
  envName: Environments;
  hashingSecret: string;
}

export type Response = http.ServerResponse<http.IncomingMessage> & {
	req: http.IncomingMessage;
}

export type Request = http.IncomingMessage;

export interface IResult<T = unknown> {
  statusCode: number;
  message?: string;
  data?: T;
}

export interface IUser {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  tosAgreement: boolean;
}

export interface IToken {
  phone: string;
  id: string;
  expires: number;
}

export enum Errors {
  READ_ERROR = "READ",
  WRITE_ERROR = "WRITE",
  UPDATE_ERROR = "UPDATE",
  DELETE_ERROR = "DELETE",
  TOKEN_EXPIRED_ERROR = "TOKEN_EXPIRED",
  PASSWORD_MISMATCH_ERROR = "PASSWORD_MISMATCH",
  INVALID_TOKEN_ERROR = "INVALID_TOKEN",
}

export interface IError {
  code: Errors;
  message?: string;
}

export interface IRequest<T, Q = {}> {
  query: Q;
  path: string;
  headers: IncomingHttpHeaders;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload: Partial<T>;
}