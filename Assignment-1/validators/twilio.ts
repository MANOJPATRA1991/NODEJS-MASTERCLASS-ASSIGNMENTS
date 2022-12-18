import { ICheck, IToken } from "../types";

export const withSMSValidator = ({
  data = {} as any,
}: {
  data?: { phone: string; message: string };
}) => {
  return new Proxy(data, {
    set: (obj, prop: keyof ICheck & "extend", value: any) => {
      switch (prop) {
        case "phone":
          if (typeof value !== "string") {
            throw new TypeError(`Invalid type for ${prop}`);
          }
          if (value.trim().length !== 10) {
            throw new RangeError(`Invalid value for ${prop}`);
          }
          break;
        case "message":
          if (typeof value !== "string") {
            throw new TypeError(`Invalid type for ${prop}`);
          }
          if (value.trim().length <= 0 || value.trim().length > 1600) {
            throw new Error(`Invalid value for ${prop}`);
          }
          break;
        default:
          return false;
      }

      Reflect.set(obj, prop, value.trim());
      return true;
    },
  });
};
