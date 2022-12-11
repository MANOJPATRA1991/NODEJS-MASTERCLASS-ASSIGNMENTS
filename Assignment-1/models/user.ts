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
      switch (prop) {
        case "firstName":
        case "lastName":
          if (typeof value !== "string") {
            throw errors[prop]
              ? new Error(errors[prop])
              : new TypeError(`${prop} is not a string`);
          }
          if (!value.trim().length) {
            throw errors[prop]
              ? new Error(errors[prop])
              : new RangeError(`${prop} is invalid`);
          }
          Reflect.set(obj, prop, value);
          return true;
        case "phone":
          if (typeof value !== "string") {
            throw errors[prop]
              ? new Error(errors[prop])
              : new TypeError(`${prop} is not a string`);
          }
          if (value.trim().length !== 10) {
            throw errors[prop]
              ? new Error(errors[prop])
              : new RangeError(`${prop} is invalid`);
          }
          Reflect.set(obj, prop, value);
          return true;
        case "password":
          if (typeof value !== "string") {
            throw errors[prop]
              ? new Error(errors[prop])
              : new TypeError(`${prop} is not a string`);
          }
          if (!value.trim().length) {
            throw errors[prop]
              ? new Error(errors[prop])
              : new RangeError(`${prop} is invalid`);
          }
          Reflect.set(obj, prop, hash(value));
          return true;
        case "tosAgreement":
          if (typeof value !== "boolean") {
            throw errors[prop]
              ? new Error(errors[prop])
              : new TypeError(`${prop} is not a boolean`);
          }
          Reflect.set(obj, prop, value);
          return true;
        default:
          return false;
      }
    },
  });
};
