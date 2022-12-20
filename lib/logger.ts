import util from "util";

enum Levels {
  SUCCESS = "SUCCESS",
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DISABLE = "DISABLE",
}

enum Config {
  reset = "\x1b[0m",
  bright = "\x1b[1m",
  dim = "\x1b[2m",
  underscore = "\x1b[4m",
  blink = "\x1b[5m",
  reverse = "\x1b[7m",
  hidden = "\x1b[8m",
}

enum Color {
  black = "\x1b[30m",
  red = "\x1b[31m",
  green = "\x1b[32m",
  yellow = "\x1b[33m",
  blue = "\x1b[34m",
  magenta = "\x1b[35m",
  cyan = "\x1b[36m",
  white = "\x1b[37m",
}

enum BgColor {
  black = "\x1b[40m",
  red = "\x1b[41m",
  green = "\x1b[42m",
  yellow = "\x1b[43m",
  blue = "\x1b[44m",
  magenta = "\x1b[45m",
  cyan = "\x1b[46m",
  white = "\x1b[47m",
}

interface Logger {
  color: (color: keyof typeof Color) => Logger;
  bgColor: (bgColor: keyof typeof BgColor) => Logger;
  config: (config: keyof typeof Config) => Logger;
  level: (level: keyof typeof Levels) => Logger;
  log: (message: string) => Logger;
  display: (debugOptions?: { debugMode?: boolean; section?: string; }) => void;
  space: () => Logger;
}

function Logger() {
  this._color = "";
  this._messages = [];
  this._level = "";
}

Logger.prototype.color = function (color: keyof typeof Color) {
  this._color += Color[color];
  return this;
};

Logger.prototype.bgColor = function (bgColor: keyof typeof BgColor) {
  this._color += BgColor[bgColor];
  return this;
};

Logger.prototype.config = function (config: keyof typeof Config) {
  this._color += Config[config];
  return this;
};

Logger.prototype.level = function (level: keyof typeof Levels) {
  this._color = `%s ${this._color}`;
  this._level = `${new Date().toLocaleDateString()} [${Levels[level]}]:`;
  return this;
};

Logger.prototype.log = function (message: string) {
  this._color += "%s";
  this._messages.push(message);
  return this;
};

Logger.prototype.display = function ({
  debugMode = false,
  section = "",
} = {}) {
  const debug = util.debuglog(section);
  const log = debugMode ? debug : console.log;
  log(
    this._color,
    ...[...(this._level ? [this._level] : []), ...this._messages]
  );
  this._level = "";
  this._color = "";
  this._messages = [];
};

export const logger: Logger = new Logger();
