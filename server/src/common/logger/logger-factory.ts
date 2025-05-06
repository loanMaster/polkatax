import pino from "pino";
import path from "path";

export const createLogger = (context: string) => {
  const transport = pino.transport({
    targets: [
      {
        level: "info",
        target: "pino/file",
        options: {
          destination: path.join(process.cwd(), context + ".log"),
        },
      },
      {
        level: "info",
        target: "pino-pretty",
        options: {},
      },
    ],
  });

  return pino(
    {
      base: undefined,
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    },
    transport,
  );
};
