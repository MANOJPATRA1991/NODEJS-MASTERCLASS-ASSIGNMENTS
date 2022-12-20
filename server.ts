import urlLib from "url";
import http from "http";
import https from "https";
import { constants } from "http2";
import { StringDecoder } from "string_decoder";
import { isValidRoute, router } from "./routers";
import config from "./config";
import { httpsServerOptions } from "./constants";

import { Response, Request, IResult } from "./types";
import { parseJsonToObject } from "./lib/helpers";
import { logger } from "./lib/logger";

const debugOptions = {
  debugMode: true,
  section: "server",
};

const createResponse = (
  res: Response,
  message: string,
  statusCode: number = constants.HTTP_STATUS_NOT_FOUND
) => {
  // Return the response
  res.setHeader(constants.HTTP2_HEADER_CONTENT_TYPE, "application/json");
  res.writeHead(statusCode);
  res.end(message);
};

// All the server logic for both HTTP and HTTPS server
const requestListener = (req: Request, res: Response) => {
  const { url, method, headers } = req;
  if (!url || !method) {
    router.notFound(null, ({ statusCode }: IResult) => {
      createResponse(res, `Not found`, statusCode);
      logger
        .color("red")
        .log(`${method}/${path} ${statusCode}`)
        .config("reset")
        .display(debugOptions);
    });
    return;
  }

  // Parse the url
  const { pathname, query } = urlLib.parse(url, true);
  // Get the path
  const path = (pathname ?? "").replace(/^\/+|\/+$/g, "");
  const routeHandler = router[isValidRoute(path) ? path : "notFound"];
  const decoder = new StringDecoder("utf-8");

  let buffer = "";

  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const requestData = {
      query,
      path,
      headers,
      method,
      payload: parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the router
    routeHandler(requestData, ({ statusCode, data, error }: IResult) => {
      createResponse(
        res,
        data ? JSON.stringify(data) : error || "",
        statusCode
      );
      logger
        .color(statusCode === 200 ? "green" : "red")
        .log(`${method}/${path} ${statusCode}`)
        .config("reset")
        .display(debugOptions);
    });
  });
};

export const init = () => {
  // Instantiate HTTP server
  const httpServer = http.createServer(requestListener);

  // Instantiate HTTPS server
  const httpsServer = https.createServer(httpsServerOptions, requestListener);

  // Start the HTTP server
  httpServer.listen(config.httpPort, () => {
    logger
      .color("blue")
      .log(`The HTTP server is running on ${config.httpPort}`)
      .config("reset")
      .display();
  });

  // Start the HTTPS server
  httpsServer.listen(config.httpsPort, () => {
    logger
      .color("red")
      .log(`The HTTPS server is running on ${config.httpsPort}`)
      .config("reset")
      .display();
  });
};
