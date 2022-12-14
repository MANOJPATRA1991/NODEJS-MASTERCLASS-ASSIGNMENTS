import { IToken } from "../types";

export const withTokenValidator = ({
  token = {},
  errors = {},
}: {
  token?: Partial<IToken & { extend: boolean }>;
  errors?: Partial<Record<keyof IToken, string>>;
}) => {
  return new Proxy(token, {
    set: (obj, prop: keyof IToken & "extend", value: any) => {
      const error = errors[prop] ? new Error(errors[prop]) : null;
      switch (prop) {
        case "id":
          if (typeof value !== "string") {
            throw error ?? new TypeError(`Invalid type for ${prop}`);
          }
          if (value.length !== 20) {
            throw error ?? new RangeError(`Invalid value for ${prop}`);
          }
          break;
        case "extend":
          if (typeof value !== "boolean") {
            throw error ?? new TypeError(`Invalid type for ${prop}`);
          }
          if (value === false) {
            throw error ?? new Error(`Invalid value for field ${prop}`);
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
