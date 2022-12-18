/*
 * Primary file for API
 *
 */

// Dependencies
import { sendSMS } from "./lib/twilio";
import { worker } from "./lib/workers";
import { init } from "./server";

init();

worker();

