import { hash } from "../lib/helpers";
import { IUser } from "../types";

type T = Parameters<typeof withUserValidator>[0];

export const withUserValidator = ({
  data = {},
  errors = {},
}: {
  data?: Partial<IUser>;
  errors?: Partial<Record<keyof IUser, string>>;
}) => {
  return new Proxy(data, {
    set: (obj, prop: keyof IUser, value: any) => {
      const error = errors[prop] ? new Error(errors[prop]) : null;
      switch (prop) {
        case "firstName":
        case "lastName":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`${prop} is not a string`);
          }
          if (!value.trim().length) {
            throw error ?? new RangeError(`${prop} is invalid`);
          }
          break;
        case "phone":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`${prop} is not a string`);
          }
          if (value.trim().length !== 10) {
            throw error ?? new RangeError(`${prop} is invalid`);
          }
          break;
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
