import { api } from "@/../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import baseLogger from "./base";
import { BATCH_SIZE, FLUSH_INTERVAL_MS } from "./loggerConfig";
import { LogEntry } from "./types";

class LogBatch {
	private buffer: LogEntry[] = [];
	private flushTimer: NodeJS.Timeout | null = null;
	private isShuttingDown = false;

	constructor(private convex: ConvexHttpClient) {
		this.setupShutdownHandlers();
	}

	private setupShutdownHandlers() {
		const shutdown = async (signal: string) => {
			if (this.isShuttingDown) return;
			this.isShuttingDown = true;

			baseLogger.info({ signal }, "Received shutdown signal, flushing logs...");
			await this.flush();
			process.exit(0);
		};

		process.on("SIGTERM", () => shutdown("SIGTERM"));
		process.on("SIGINT", () => shutdown("SIGINT"));
	}

	add(log: LogEntry) {
		if (this.isShuttingDown) {
			baseLogger.warn("Log dropped: system is shutting down");
			return;
		}

		this.buffer.push(log);

		if (this.buffer.length >= BATCH_SIZE) {
			this.flush();
		} else if (!this.flushTimer) {
			this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
		}
	}

	async flush(): Promise<void> {
		if (this.buffer.length === 0) return;

		const batch = [...this.buffer];
		this.buffer = [];

		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}

		try {
			await this.convex.mutation(api.logs.createLogBatch, { logs: batch });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			baseLogger.error(
				{
					error: errorMessage,
					batchSize: batch.length,
				},
				"Failed to flush logs to Convex",
			);

			console.error("[LogBatch] Lost logs:", JSON.stringify(batch, null, 2));
		}
	}
}

export default LogBatch;
