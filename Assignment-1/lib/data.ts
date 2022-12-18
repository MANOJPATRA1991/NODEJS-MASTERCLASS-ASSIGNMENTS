import path from "path";
import { Errors } from "../types";
import {
  closeFile,
  openFile,
  readdir,
  readFile,
  truncateFile,
  unlinkFile,
  writeFile,
} from "./file";
import { parseJsonToObject } from "./helpers";

export const baseDir = path.join(__dirname, "../../Assignment-1/.data");

export const create = async <T>(
  dir: string,
  file: string,
  data: any
): Promise<T> => {
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

export const list = async (dir: string) => {
  try {
    const data = await readdir(`${baseDir}/${dir}/`);
    if (data && data.length > 0) {
      return data.map((fileName) => fileName.replace(".json", ""));
    }
    return [];
  } catch (e) {
    throw {
      code: Errors.LS_ERROR,
      message: "Error listing files in directory!!",
    };
  }
};
