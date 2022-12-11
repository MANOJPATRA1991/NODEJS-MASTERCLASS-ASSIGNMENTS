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
      if (prop === "id") {
        if (typeof value !== "string") {
          throw new TypeError(`Invalid type for ${prop}`);
        }
        if (value.length !== 20) {
          throw new RangeError(`Invalid value for ${prop}`);
        }

        Reflect.set(obj, prop, value);
        return true;
      }

      if (prop === "extend") {
        if (typeof value !== "boolean") {
          throw new TypeError(`Invalid type for ${prop}`);
        }
        if (value === false) {
          throw new Error(`Invalid value for field ${prop}`);
        }

        Reflect.set(obj, prop, value);
        return true;
      }

      return false;
    },
  });
};
