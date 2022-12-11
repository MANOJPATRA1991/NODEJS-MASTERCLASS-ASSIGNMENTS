/*
 * Helpers for various tasks
 *
 */

// Dependencies
import config from "../config";
import crypto from "crypto";

// Parse a JSON string to an object in all cases, without throwing
export const parseJsonToObject = function (str: string) {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

// Create a SHA256 hash
export const hash = function (str: string) {
  const hash = crypto
    .createHmac("sha256", config.hashingSecret)
    .update(str)
    .digest("hex");
  return hash;
};
