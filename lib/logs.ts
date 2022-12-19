import path from "path";
import { Errors, FileSystemFlags } from "../types";
import {
  appendFile,
  closeFile,
  gzip,
  openFile,
  readdir,
  readFile,
  truncateFile,
  unzip,
  writeFile,
} from "./file";

export const baseDir = path.join(__dirname, "../.logs");

export const append = async (file: string, json: string) => {
  const errors = {
    [Errors.READ_ERROR]: "Could not open file for appending",
    [Errors.WRITE_ERROR]: "Error appending to file",
    [Errors.CLOSE_ERROR]: "Error closing file being appended to",
  };

  let error = Errors.READ_ERROR;

  try {
    const fileDescriptor = await openFile(
      `${baseDir}/${file}.log`,
      FileSystemFlags.APPEND_ANY_FILE
    );
    error = Errors.WRITE_ERROR;
    await appendFile(fileDescriptor, json + "\n");
    error = Errors.CLOSE_ERROR;
    await closeFile(fileDescriptor);
  } catch (_) {
    throw {
      code: Errors.WRITE_ERROR,
      message: errors[error],
    };
  }
};

export const list = async (includeCompressed = true) => {
  try {
    const data = await readdir(baseDir);
    const trimmedFileNames: string[] = [];
    if (data && data.length) {
      for (let fileName of data) {
        if (fileName.includes(".log")) {
          trimmedFileNames.push(fileName.replace(".log", ""));
        }

        if (fileName.includes(".gz.b64") && includeCompressed) {
          trimmedFileNames.push(fileName.replace(".gz.b64", ""));
        }
      }
    }

    return trimmedFileNames;
  } catch (e) {
    throw {
      code: Errors.READ_ERROR,
      message: "Reading error",
    };
  }
};

export const compress = async (logId: string, newFileId: string) => {
  const errors = {
    [Errors.READ_ERROR]: "Reading error",
    [Errors.COMPRESS_ERROR]: "Compress error",
    [Errors.OPEN_ERROR]: "File open error",
    [Errors.WRITE_ERROR]: "Write error",
    [Errors.CLOSE_ERROR]: "Closing error",
  };

  let error = Errors.READ_ERROR;
  try {
    const sourceFile = `${logId}.log`;
    const destFile = `${newFileId}.gz.b64`;

    const content = await readFile(`${baseDir}/${sourceFile}`, "utf-8");
    if (content) {
      error = Errors.COMPRESS_ERROR;
      const buffer = await gzip(content);
      error = Errors.OPEN_ERROR;
      const fileDescriptor = await openFile(
        `${baseDir}/${destFile}`,
        FileSystemFlags.WRITE_NEW_FILE
      );
      error = Errors.WRITE_ERROR;
      await writeFile(fileDescriptor, buffer.toString("base64"));
      error = Errors.CLOSE_ERROR;
      await closeFile(fileDescriptor);
      return { logId, newFileId };
    }
  } catch (e) {
    throw {
      code: Errors.COMPRESS_ERROR,
      message: errors[error],
    };
  }
};

export const decompress = async (fileId: string) => {
  const errors = {
    [Errors.READ_ERROR]: "Reading error",
    [Errors.DECOMPRESS_ERROR]: "Unzipping error",
  };

  let error = Errors.READ_ERROR;
  try {
    const sourceFile = `${fileId}.gz.b64`;

    const content = await readFile(`${baseDir}/${sourceFile}`, "utf-8");
    if (content) {
      error = Errors.DECOMPRESS_ERROR;
      const buffer = Buffer.from(content, "base64");
      const output = await unzip(buffer);
      return output.toString();
    }
  } catch (_) {
    throw {
      code: Errors.COMPRESS_ERROR,
      message: errors[error],
    };
  }
};

export const truncate = async (logId: string) => {
  try {
    const fileDescriptor = await openFile(
      `${baseDir}/${logId}.log`,
      FileSystemFlags.READ_AND_WRITE_EXISTING_FILE
    );
    await truncateFile(fileDescriptor as any);
    return { logId };
  } catch (_) {
    throw {
      code: Errors.TRUNCATE_ERROR,
      message: "Truncate error",
    };
  }
};
