import url from "url";
import { constants, IncomingHttpHeaders } from 'http2';
import { StringDecoder } from "string_decoder";
import { isValidRoute, router } from "./routers";

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
export const unifiedServer = (req: Request, res: Response) => {
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
    chosenHandler(data, ({ statusCode, data, message }: IResult) => {
      createResponse(res, data ? JSON.stringify(data) : message || '', statusCode);
    });
  });
};
