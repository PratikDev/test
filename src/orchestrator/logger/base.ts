import pino from "pino";
import { TRANSPORT } from "./loggerConfig";

const baseLogger = pino({
	level: process.env.LOG_LEVEL || "debug",
	transport: TRANSPORT,
	base: undefined,
	timestamp: pino.stdTimeFunctions.isoTime,
});

export default baseLogger;
