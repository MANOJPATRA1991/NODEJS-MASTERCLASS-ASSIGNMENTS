import { hash } from "../lib/helpers";
import { IUser } from "../types";

export const withUserValidator = ({
  user = {},
  errors = {},
}: {
  user?: Partial<IUser>;
  errors?: Partial<Record<keyof IUser, string>>;
}) => {
  return new Proxy(user, {
    set: (obj, prop: keyof IUser, value: any) => {
      const error = errors[prop] ? new Error(errors[prop]) : '';
      switch (prop) {
        case "firstName":
        case "lastName":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`${prop} is not a string`);
          }
          if (!value.trim().length) {
            throw error ?? new RangeError(`${prop} is invalid`);
          }
        case "phone":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`${prop} is not a string`);
          }
          if (value.trim().length !== 10) {
            throw error ?? new RangeError(`${prop} is invalid`);
          }
        case "password":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`${prop} is not a string`);
          }
          if (!value.trim().length) {
            throw error ?? new RangeError(`${prop} is invalid`);
          }
          value = hash(value);
          break;
        case "tosAgreement":
          if (typeof value !== "boolean") {
            throw error ?? new TypeError(`${prop} is not a boolean`);
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
