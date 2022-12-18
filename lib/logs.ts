import path from "path";
import { Errors } from "../types";
import { appendFile, closeFile, gzip, openFile, readdir, readFile, truncateFile, unzip, writeFile } from "./file";

export const baseDir = path.join(__dirname, "../.logs");

export const append = async (file: string, json: string) => {
  const getError = (type: string) => {
    return {
      open: "Could not open file for appending",
      append: "Error appending to file",
      close: "Error closing file being appended to",
    }[type];
  };

  let error = "open";

  try {
    const fileDescriptor = await openFile(
      `${baseDir}/${file}.log`,
      "a"
    );
    error = "append";
    await appendFile(fileDescriptor, json + '\n');
    await closeFile(fileDescriptor);
  } catch (e) {
    throw {
      code: Errors.WRITE_ERROR,
      message: getError(error),
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
  const getError = (type: string) => {
    return {
      read: "Reading error",
      compress: "Compress error",
      open: "File open error",
      write: "Write error",
      close: "Closing error",
    }[type];
  };

  let error = "read";
  try {
    const sourceFile = `${logId}.log`;
    const destFile = `${newFileId}.gz.b64`;

    const content = await readFile(`${baseDir}/${sourceFile}`, "utf-8");
    if (content) {
      error = "compress";
      const buffer = await gzip(content);
      error = "open";
      const fileDescriptor = await openFile(`${baseDir}/${destFile}`, "wx");
      error = "write"
      await writeFile(fileDescriptor, buffer.toString("base64"));
      error = "close";
      await closeFile(fileDescriptor);
      return { logId, newFileId };
    }
  } catch (e) {
    throw {
      code: Errors.COMPRESS_ERROR,
      message: getError(error),
    };
  }
};

export const decompress = async (fileId: string) => {
  const getError = (type: string) => {
    return {
      read: "Reading error",
      unzip: "Unzipping error",
    }[type];
  };

  let error = "read";
  try {
    const sourceFile = `${fileId}.gz.b64`;

    const content = await readFile(`${baseDir}/${sourceFile}`, "utf-8");
    if (content) {
      error = "unzip";
      const buffer = Buffer.from(content, "base64");
      const output = await unzip(buffer);
      return output.toString();
    }
  } catch (e) {
    throw {
      code: Errors.COMPRESS_ERROR,
      message: getError(error),
    };
  }
};

export const truncate = async (logId: string) => {
  try {
    const fileDescriptor = await openFile(
      `${baseDir}/${logId}.log`,
      "r+"
    );
    await truncateFile(fileDescriptor as any, 0);
    return { logId };
  } catch (e) {
    console.log(e);
    throw {
      code: Errors.TRUNCATE_ERROR,
      message: "Truncate error",
    };
  }
};
