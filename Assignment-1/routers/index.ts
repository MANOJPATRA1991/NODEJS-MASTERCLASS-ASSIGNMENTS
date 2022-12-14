import { hello } from "./hello";
import { notFound } from "./notFound";
import { users } from "./user";
import { tokens } from "./tokens";
import { checks } from "./checks";

// Define the request router
export const router = {
  hello,
  notFound,
  users,
  tokens,
  checks
};

type RouterKeys = keyof typeof router;

export const isValidRoute = (route: string): route is RouterKeys  => {
  return Object.keys(router).includes(route);
}