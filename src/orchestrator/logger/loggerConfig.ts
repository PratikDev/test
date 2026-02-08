const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 5000;

const TRANSPORT =
	process.env.NODE_ENV !== "production"
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "HH:MM:ss",
					ignore: "pid,hostname",
				},
			}
		: undefined;

export { BATCH_SIZE, FLUSH_INTERVAL_MS, TRANSPORT };
