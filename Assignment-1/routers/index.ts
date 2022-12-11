import { hello } from "./hello";
import { notFound } from "./notFound";
import { user } from "./user";

// Define the request router
export const router = {
  hello,
  notFound,
  user,
};

type RouterKeys = keyof typeof router;

export const isValidRoute = (route: string): route is RouterKeys  => {
  return Object.keys(router).includes(route);
}