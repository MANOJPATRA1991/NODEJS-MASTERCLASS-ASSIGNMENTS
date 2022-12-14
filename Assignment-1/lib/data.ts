import fs from "fs";
import path from "path";
import util from "util";
import { Errors } from "../types";
import { parseJsonToObject } from "./helpers";

export const baseDir = path.join(__dirname, "../../Assignment-1/.data");

const openFile = util.promisify(fs.open);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const truncateFile = util.promisify(fs.ftruncate);
const closeFile = util.promisify(fs.close);
const unlinkFile = util.promisify(fs.unlink);

export const create = async <T>(dir: string, file: string, data: any): Promise<T> => {
  const getError = (type: string) => {
    return {
      open: "Could not create new file, it may already exist",
      write: "Error closing new file",
    }[type];
  };

  let error = "open";
  try {
    const fileDescriptor = await openFile(
      `${baseDir}/${dir}/${file}.json`,
      "wx"
    );
    const stringData = JSON.stringify(data);
    error = "write";
    await writeFile(fileDescriptor, stringData);
    return data as T;
  } catch (e) {
    throw {
      code: Errors.WRITE_ERROR,
      message: getError(error),
    };
  }
};

export const read = async <T>(dir: string, file: string): Promise<T> => {
  try {
    const data = await readFile(`${baseDir}/${dir}/${file}.json`, "utf8");
    return parseJsonToObject(data);
  } catch (err) {
    throw {
      code: Errors.READ_ERROR,
    };
  }
};

export const update = async (dir: string, file: string, data: any) => {
  const getError = (type: string) => {
    return {
      open: "Could not open the file for updating, it may not exist yet!!",
      truncate: "Error truncating file!!",
      write: "Error writing to existing file!!",
      close: "Error closing the file!!",
    }[type];
  };

  let error = "open";
  try {
    // Open the file for writing
    // 'r+' - Open file for reading and writing.
    const fileDescriptor = await openFile(
      `${baseDir}/${dir}/${file}.json`,
      "r+"
    );
    const stringData = JSON.stringify(data);
    error = "truncate";
    await truncateFile(fileDescriptor as any);
    error = "write";
    await writeFile(fileDescriptor, stringData);
    error = "close";
    await closeFile(fileDescriptor);
  } catch (e) {
    throw {
      code: Errors.UPDATE_ERROR,
      message: getError(error),
    };
  }
};

export const remove = async (dir: string, file: string) => {
  try {
    // Unlink the file
    await unlinkFile(`${baseDir}/${dir}/${file}.json`);
  } catch (e) {
    throw {
      code: Errors.DELETE_ERROR,
      message: "Error deleting file!!",
    };
  }
};
