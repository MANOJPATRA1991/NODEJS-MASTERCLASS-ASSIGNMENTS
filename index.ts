/*
 * Primary file for API
 *
 */

// Dependencies
import { worker } from "./lib/workers";
import { init } from "./server";

init();

worker();

