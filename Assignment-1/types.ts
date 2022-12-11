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

export enum DataErrors {
  READ_ERROR = "READ",
  WRITE_ERROR = "WRITE",
  UPDATE_ERROR = "UPDATE",
  DELETE_ERROR = "DELETE",
}

export interface IDataError {
  code: DataErrors;
  message?: string;
}

export interface IRequest<T, Q = {}> {
  query: Q;
  path: string;
  headers: IncomingHttpHeaders;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload: Partial<T>;
}