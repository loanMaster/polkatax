import pino from "pino";

export const createLogger = () => {
  const transport = pino.transport({
    targets: [
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
