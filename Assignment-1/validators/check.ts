import { ICheck, IToken } from "../types";

export const withCheckValidator = ({
  check = {},
  errors = {},
}: {
  check?: Partial<ICheck>;
  errors?: Partial<Record<keyof ICheck, string>>;
}) => {
  return new Proxy(check, {
    set: (obj, prop: keyof ICheck & "extend", value: any) => {
      const error = errors[prop] ? new Error(errors[prop]) : null;
      switch (prop) {
        case "id":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`Invalid type for ${prop}`);
          }
          if (value.trim().length !== 20) {
            throw error ?? new RangeError(`Invalid value for ${prop}`);
          }
          value = value.trim();
          break;
        case "protocol":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`Invalid type for ${prop}`);
          }
          if (!['http', 'https'].includes(value)) {
            throw error ?? new Error(`Invalid value for ${prop}`);
          }
          break;
        case "url":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`Invalid type for ${prop}`);
          }
          if (!value.trim().length) {
            throw error ?? new RangeError(`Invalid value for ${prop}`);
          }
          value = value.trim();
          break;
        case "method":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`Invalid type for ${prop}`);
          }
          if (!['GET', 'POST', 'PUT', 'DELETE'].includes(value)) {
            throw error ?? new Error(`Invalid value for ${prop}`);
          }
          break;
        case "successCodes":
          if (!Array.isArray(value)) {
            throw error ?? new TypeError(`Invalid type for ${prop}`);
          }
          if (value.length < 0) {
            throw error ?? new Error(`Invalid value for ${prop}`);
          }
          break;
        case "timeout":
          if (typeof value !== "number") {
            throw error ?? new TypeError(`Invalid type for ${prop}`);
          }
          if (value % 1 !== 0 || value <= 1 || value >= 5) {
            throw error ?? new Error(`Invalid value for ${prop}`);
          }
          break;
        default:
          return false;
      }

      Reflect.set(obj, prop, value);
      return true;
    },
  });
};
