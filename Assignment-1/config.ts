/**
 * Create and export configuration variables
 */
import { environments } from './constants';
import { IEnvironment, Environments } from './types';

// Determine which environment was passed as a command-line argument
const currentEnvironment: Environments =
  !!process.env.NODE_ENV && process.env.NODE_ENV in Environments
    ? process.env.NODE_ENV as Environments
    : Environments.STAGING;

// Check that the current environment is one of the environments above, if not default to staging
const environmentToExport: IEnvironment =
  environments[currentEnvironment] || environments.staging;

// Export the module
export default environmentToExport;
