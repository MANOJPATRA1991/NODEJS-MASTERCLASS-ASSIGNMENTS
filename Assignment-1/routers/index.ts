import { hello } from "./hello";
import { notFound } from "./notFound";
import { users } from "./user";
import { tokens } from "./tokens";

// Define the request router
export const router = {
  hello,
  notFound,
  users,
  tokens,
};

type RouterKeys = keyof typeof router;

export const isValidRoute = (route: string): route is RouterKeys  => {
  return Object.keys(router).includes(route);
}