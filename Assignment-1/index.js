/*
 * Primary file for API
 *
 */

// Dependencies
let http = require('http');
let https = require('https');
let config = require('./config');
let httpsServerOptions = require('./constants').httpsServerOptions;
let unifiedServer = require('./callbacks').unifiedServer;

// Instantiate HTTP server
let httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
    console.log(`The HTTP server is running on ${config.httpPort}`);
});

// Instantiate HTTPS server
let httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
    console.log(`The HTTPS server is running on ${config.httpsPort}`);
});


