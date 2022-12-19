import * as https from "https";
import { constants } from "http2";
import * as querystring from "querystring";
import config from "../config";
import { withSMSValidator } from "../validators/twilio";

export const sendSMS = async (phone: string, message: string) => {
  const validator = withSMSValidator({});
  let error = '';
  try {
    validator.message = message;
    validator.phone = phone;
  } catch (e) {
    error = (e as Error).message;
  }

  const payload = querystring.stringify({
    From: config.twilio.fromPhone,
    To: `+1${phone}`,
    Body: message,
  });

  const requestOptions = {
    protocol: "https:",
    hostname: "api.twilio.com",
    method: "POST",
    path: `/2010-04-01/Accounts/${config.twilio.accountSID}/Messages.json`,
    auth: `${config.twilio.accountSID}:${config.twilio.authToken}`,
    headers: {
      [constants.HTTP2_HEADER_CONTENT_TYPE]: "application/x-www-form-urlencoded",
      [constants.HTTP2_HEADER_CONTENT_LENGTH]: Buffer.byteLength(payload),
    },
  };

  const req = https.request(requestOptions, ({ statusCode }) => {
    if (![200, 201].includes(statusCode!)) {
      error = `Status code returned was ${statusCode}`;
    }
  });

  req.on("error", (e: Error) => {
    error = e.message;
  });

  req.write(payload);

  req.end();

  if (error) {
    throw new Error(error);
  }
};
