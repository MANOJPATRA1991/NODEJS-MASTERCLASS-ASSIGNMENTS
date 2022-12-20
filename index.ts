/*
 * Primary file for API
 *
 */

// Dependencies
import { worker } from "./workers";
import { init } from "./server";

init();

worker();

