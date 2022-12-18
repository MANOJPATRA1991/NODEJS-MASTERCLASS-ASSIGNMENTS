import url from "url";
import http from "http";
import https from "https";
import { constants } from 'http2';
import { StringDecoder } from "string_decoder";
import { isValidRoute, router } from "./routers";
import config from "./config";
import { httpsServerOptions } from "./constants";

import { Response, Request, IResult } from "./types";
import { parseJsonToObject } from "./lib/helpers";

function createResponse(res: Response, message: string, statusCode?: number) {
  statusCode = statusCode || constants.HTTP_STATUS_NOT_FOUND;

  // Return the response
  res.setHeader(constants.HTTP2_HEADER_CONTENT_TYPE, "application/json");
  res.writeHead(statusCode);
  res.end(message);
}

// All the server logic for both HTTP and HTTPS server
const unifiedServer = (req: Request, res: Response) => {
  if (!req.url || !req.method) {
    router.notFound(null, ({ statusCode }: IResult) => {
      createResponse(res, `Not found`, statusCode);
    });
    return;
  }

  // Parse the url
  const { pathname, query } = url.parse(req.url, true);

  // Get the path
  const trimmedPath = (pathname ?? "").replace(/^\/+|\/+$/g, "");
  
  const chosenHandler = isValidRoute(trimmedPath)
    ? router[trimmedPath]
    : router.notFound;

  const decoder = new StringDecoder("utf-8");

  let buffer = "";

  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const data = {
      query,
      path: trimmedPath,
      headers: req.headers,
      method: req.method,
      payload: parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, ({ statusCode, data, error }: IResult) => {
      createResponse(res, data ? JSON.stringify(data) : error || '', statusCode);
    });
  });
};

// Instantiate HTTP server
export const httpServer = http.createServer(unifiedServer);

// Instantiate HTTPS server
export const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

export const init = () => {
  // Start the HTTP server
  httpServer.listen(config.httpPort, () => {
    console.log(`The HTTP server is running on ${config.httpPort}`);
  });

  // Start the HTTPS server
  httpsServer.listen(config.httpsPort, () => {
    console.log(`The HTTPS server is running on ${config.httpsPort}`);
  });
}
