import pino from "pino";
import path from "path";

const transport = pino.transport({
  targets: [
    {
      level: "info",
      target: "pino/file",
      options: {
        destination: path.join(process.cwd(), "app.log"),
      },
    },
    {
      level: "info",
      target: "pino-pretty",
      options: {},
    },
  ],
});

export const logger = pino(
  {
    base: undefined,
    timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  },
  transport,
);
