import { hash } from "../lib/helpers";
import { IUser } from "../types";

export const withUserValidator = (user: Partial<IUser>) => {
  return new Proxy(user, {
    set: (obj, prop: keyof IUser, value: any) => {
      switch (prop) {
        case "firstName":
        case "lastName":
          if (typeof value !== "string") {
            throw new TypeError(`${prop} is not a string`);
          }
          if (!value.trim().length) {
            throw new RangeError(`${prop} is invalid`);
          }
          Reflect.set(obj, prop, value);
          return true;
        case "phone":
          if (typeof value !== "string") {
            throw new TypeError(`${prop} is not a string`);
          }
          if (value.trim().length !== 10) {
            throw new RangeError(`${prop} is invalid`);
          }
          Reflect.set(obj, prop, value);
          return true;
        case "password":
          if (typeof value !== "string") {
            throw new TypeError(`${prop} is not a string`);
          }
          if (!value.trim().length) {
            throw new RangeError(`${prop} is invalid`);
          }
          Reflect.set(obj, prop, hash(value));
          return true;
        case "tosAgreement":
          if (typeof value !== "boolean") {
            throw new TypeError(`${prop} is not a boolean`);
          }
          Reflect.set(obj, prop, value);
          return true;
        default:
          return false;
      }
    },
  });
}
