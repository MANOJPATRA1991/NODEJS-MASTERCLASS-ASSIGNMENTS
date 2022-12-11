/*
 * Primary file for API
 *
 */

// Dependencies
import http from "http";
import https from "https";
import config from "./config";
import { httpsServerOptions } from "./constants";
import { unifiedServer } from "./server";

import * as _data from "./lib/data";

_data
  .create("test", "newFile", { foo: "bar" })
  .then(() => console.log("File created"))
  .catch((err) => console.log("This was the error", err));

// Instantiate HTTP server
const httpServer = http.createServer(unifiedServer);

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log(`The HTTP server is running on ${config.httpPort}`);
});

// Instantiate HTTPS server
const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`The HTTPS server is running on ${config.httpsPort}`);
});
