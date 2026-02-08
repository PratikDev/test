import { ConvexHttpClient } from "convex/browser";
import baseLogger from "./base";
import LogBatch from "./log-batch";
import { LogEntry, LoggerBindings } from "./types";
import { sanitizeValue, truncateStack } from "./utils";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const logBatch = new LogBatch(convex);

class Logger {
	private bindings: LoggerBindings;

	constructor(bindings: LoggerBindings = {}) {
		this.bindings = bindings;
	}

	child(bindings: LoggerBindings): Logger {
		return new Logger({
			...this.bindings,
			...bindings,
		});
	}

	private log(
		level: LogEntry["level"],
		obj: Record<string, any>,
		msg: string,
	): void {
		const timestamp = Date.now();
		const traceId = obj.traceId || this.bindings.traceId || crypto.randomUUID();
		const taskId = obj.taskId || this.bindings.taskId;
		const component =
			obj.component || this.bindings.component || "orchestrator";

		const metadata: Record<string, any> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (!["traceId", "taskId", "component", "level", "error"].includes(key)) {
				metadata[key] = sanitizeValue(value, key);
			}
		}

		const logEntry: LogEntry = {
			timestamp,
			level,
			message: msg,
			traceId,
			taskId,
			component,
			metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
		};

		if (obj.error) {
			if (obj.error instanceof Error) {
				logEntry.error = {
					message: obj.error.message,
					stack: truncateStack(obj.error.stack),
				};
			} else if (typeof obj.error === "string") {
				logEntry.error = { message: obj.error };
			} else if (typeof obj.error === "object") {
				logEntry.error = {
					message: String(obj.error.message || obj.error),
					stack: truncateStack(obj.error.stack),
				};
			}
		}

		baseLogger[level](
			{
				traceId,
				taskId,
				component,
				...metadata,
				error: logEntry.error,
			},
			msg,
		);

		if (level !== "debug") {
			logBatch.add(logEntry);
		}
	}

	debug(obj: Record<string, any>, msg: string): void {
		this.log("debug", obj, msg);
	}

	info(obj: Record<string, any>, msg: string): void {
		this.log("info", obj, msg);
	}

	warn(obj: Record<string, any>, msg: string): void {
		this.log("warn", obj, msg);
	}

	error(obj: Record<string, any>, msg: string): void {
		this.log("error", obj, msg);
	}

	async trackAsync<T>(
		operation: string,
		metadata: Record<string, any>,
		fn: () => Promise<T>,
	): Promise<T> {
		const start = Date.now();

		try {
			const result = await fn();
			const duration = Date.now() - start;

			this.info(
				{
					...metadata,
					operation,
					duration,
					success: true,
				},
				`${operation} completed in ${duration}ms`,
			);

			return result;
		} catch (error) {
			const duration = Date.now() - start;

			this.error(
				{
					...metadata,
					operation,
					duration,
					success: false,
					error,
				},
				`${operation} failed after ${duration}ms`,
			);

			throw error;
		}
	}

	async flush(): Promise<void> {
		await logBatch.flush();
	}
}

export const logger = new Logger();
export { Logger };
