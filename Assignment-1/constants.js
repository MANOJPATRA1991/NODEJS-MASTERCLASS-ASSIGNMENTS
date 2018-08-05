let fs = require('fs');

let CONSTANTS = {};

// Container for all environments
let environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging'
};

// Production environment
environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production'
};

CONSTANTS.environments = environments;

CONSTANTS.httpsServerOptions = {
    'key': fs.readFileSync('https/key.pem'),
    'cert': fs.readFileSync('https/cert.pem')
};

module.exports = CONSTANTS;