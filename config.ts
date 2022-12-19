/**
 * Create and export configuration variables
 */
import { environments } from "./constants";
import { Environments, IEnvironment } from "./types";

// Determine which environment was passed as a command-line argument
const env: IEnvironment =
  !!process.env.NODE_ENV && process.env.NODE_ENV in Environments
    ? environments[process.env.NODE_ENV]
    : environments[Environments.STAGING];

// Export the module
export default env;
