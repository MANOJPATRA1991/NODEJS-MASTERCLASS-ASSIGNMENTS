import path from "path";
import { Errors, FileSystemFlags } from "../types";
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

export const baseDir = path.join(__dirname, "../.data");

export const create = async <T>(
  dir: string,
  file: string,
  data: any
): Promise<T> => {
  const errors = {
    [Errors.READ_ERROR]: "Could not create new file, it may already exist!!",
    [Errors.WRITE_ERROR]: "Error closing new file!!",
  };

  let error = Errors.READ_ERROR;
  try {
    const fileDescriptor = await openFile(
      `${baseDir}/${dir}/${file}.json`,
      FileSystemFlags.WRITE_NEW_FILE
    );
    const stringData = JSON.stringify(data);
    error = Errors.WRITE_ERROR;
    await writeFile(fileDescriptor, stringData);
    return data as T;
  } catch (_) {
    throw {
      code: Errors.WRITE_ERROR,
      message: errors[error],
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
  const errors = {
    [Errors.READ_ERROR]:
      "Could not open the file for updating, it may not exist yet!!",
    [Errors.TRUNCATE_ERROR]: "Error truncating file!!",
    [Errors.WRITE_ERROR]: "Error writing to existing file!!",
    [Errors.CLOSE_ERROR]: "Error closing the file!!",
  };

  let error = Errors.READ_ERROR;
  try {
    // Open the file for writing
    // 'r+' - Open file for reading and writing.
    const fileDescriptor = await openFile(
      `${baseDir}/${dir}/${file}.json`,
      FileSystemFlags.READ_AND_WRITE_EXISTING_FILE
    );
    const stringData = JSON.stringify(data);
    error = Errors.TRUNCATE_ERROR;
    await truncateFile(fileDescriptor as any);
    error = Errors.WRITE_ERROR;
    await writeFile(fileDescriptor, stringData);
    error = Errors.CLOSE_ERROR;
    await closeFile(fileDescriptor);
  } catch (_) {
    throw {
      code: Errors.UPDATE_ERROR,
      message: errors[error],
    };
  }
};

export const remove = async (dir: string, file: string) => {
  try {
    // Unlink the file
    await unlinkFile(`${baseDir}/${dir}/${file}.json`);
  } catch (_) {
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
  } catch (_) {
    throw {
      code: Errors.LS_ERROR,
      message: "Error listing files in directory!!",
    };
  }
};
