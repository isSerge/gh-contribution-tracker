import { pino } from "pino";

const logLevel = process.env.LOG_LEVEL || 'info';
const logColorize = process.env.LOG_COLORIZE === 'true' || true;
const logTranslateTime = process.env.LOG_TRANSLATE_TIME || 'yyyy-mm-dd HH:MM:ss';
const logIgnore = process.env.LOG_IGNORE || 'hostname,pid';

export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: logColorize,
      translateTime: logTranslateTime,
      ignore: logIgnore,
    },
  },
});
