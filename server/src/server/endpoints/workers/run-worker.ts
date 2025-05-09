import path from "path";
import { Worker } from "worker_threads";
import { HttpError } from "../../../common/error/HttpError";
import { logger } from "../../logger/logger";
import * as fs from "fs";

const MAX_WORKERS = 1;
let activeWorkers = 0;

export const runWorker = (fileName: string, data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (activeWorkers >= MAX_WORKERS) {
      reject(new HttpError(503, "Server is busy. Try again later."));
      return;
    }
    activeWorkers++;

    const tsPath = path.resolve(__dirname, fileName + ".ts");
    const jsPath = path.resolve(__dirname, fileName + ".js");
    const workerPath = fs.existsSync(jsPath) ? jsPath : tsPath;
    const worker = new Worker(workerPath, {
      workerData: data,
      execArgv: ["-r", "ts-node/register"], // This allows TS execution
    });

    worker.on("message", (data) => {
      activeWorkers--;
      resolve(data);
    });
    worker.on("error", (err) => {
      activeWorkers--;
      logger.error(err);
      reject(err);
    });
    worker.on("exit", (code) => {
      activeWorkers--;
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
};
