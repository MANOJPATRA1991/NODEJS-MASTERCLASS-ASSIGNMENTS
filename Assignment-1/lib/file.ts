import fs from "fs";
import util from "util";
import zlib from "zlib";

export const openFile = util.promisify(fs.open);
export const writeFile = util.promisify(fs.writeFile);
export const readFile = util.promisify(fs.readFile);
export const truncateFile = util.promisify(fs.ftruncate);
export const closeFile = util.promisify(fs.close);
export const unlinkFile = util.promisify(fs.unlink);
export const readdir = util.promisify(fs.readdir);
export const appendFile = util.promisify(fs.appendFile);
export const gzip = util.promisify(zlib.gzip);
export const unzip = util.promisify(zlib.unzip);
