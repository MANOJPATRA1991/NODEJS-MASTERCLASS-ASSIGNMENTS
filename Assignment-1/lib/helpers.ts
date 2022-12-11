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

export const createRandomString = (strLength: number): string => {
  // Define all the possible characters that could go into a string
  const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

  // Start the final string
  let str = "";
  for (let i = 1; i <= strLength; i++) {
    // Get a random charactert from the possibleCharacters string
    const randomCharacter = possibleCharacters.charAt(
      Math.floor(Math.random() * possibleCharacters.length)
    );
    // Append this character to the string
    str += randomCharacter;
  }
  // Return the final string
  return str;
};
