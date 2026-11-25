import pino from "pino";
import pretty from "pino-pretty";

const stream = pretty({
  colorize: true,
  ignore: "pid,hostname",
  translateTime: "SYS:HH:MM:ss",
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  stream
);

export default logger;
