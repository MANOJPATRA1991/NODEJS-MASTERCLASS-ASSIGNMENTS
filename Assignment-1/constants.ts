import fs from "fs";
import { IEnvironment, Environments } from "./types";

// Container for all environments
export const environments: { [x in Environments]: IEnvironment } = {
  // Staging (default) environment
  [Environments.STAGING]: {
    httpPort: 3000,
    httpsPort: 3001,
    envName: Environments.STAGING,
    hashingSecret: "thisIsASecret",
    maxChecks: 5,
    twilio: {
      accountSID: "ACb32d411ad7fe886aac54c665d25e5c5d",
      authToken: "9455e3eb3109edc12e3d8c92768f7a67",
      fromPhone: "+15005550006",
    },
  },
  // Production environment
  [Environments.PRODUCTION]: {
    httpPort: 5000,
    httpsPort: 5001,
    envName: Environments.PRODUCTION,
    hashingSecret: "thisIsAlsoASecret",
    maxChecks: 5,
    twilio: {
      fromPhone: "",
      accountSID: "",
      authToken: "",
    },
  },
};

export const httpsServerOptions = {
  key: fs.readFileSync("https/key.pem"),
  cert: fs.readFileSync("https/cert.pem"),
};

export const statusCodes = {
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORATIVE_INFORMATION: 203,
};

// export const
