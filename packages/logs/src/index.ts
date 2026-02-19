import pino, { stdTimeFunctions } from "pino";

interface LoggerOptions {
  level?: string;
  prettyPrint?: boolean;
}

function createLogger({ level = "info", prettyPrint = false }: LoggerOptions = {}) {
  const options: pino.LoggerOptions = {
    level,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: stdTimeFunctions.isoTime,
  };

  if (prettyPrint) {
    options.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    };
  }

  return pino(options);
}

const logger = createLogger({
  prettyPrint: true,
});

export { createLogger, logger };
