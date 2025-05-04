import path from "path";
import { Worker } from "worker_threads";
import { HttpError } from "../../../common/error/HttpError";
import { logger } from "../../logger/logger";

const MAX_WORKERS = 2;
let activeWorkers = 0;

export const runWorker = (fileName: string, data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (activeWorkers >= MAX_WORKERS) {
      reject(new HttpError(503, "Server is busy. Try again later."));
      return;
    }
    activeWorkers++;

    const workerPath = path.resolve(__dirname, fileName); // Reference compiled worker file
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
