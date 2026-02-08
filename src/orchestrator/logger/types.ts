import { Id } from "@/../convex/_generated/dataModel";

interface LogEntry {
	timestamp: number;
	level: "debug" | "info" | "warn" | "error";
	message: string;
	traceId?: string;
	taskId?: Id<"tasks">;
	component: "orchestrator" | "opencode" | "ai-model" | "tool" | "logger";
	metadata?: Record<string, any>;
	error?: {
		message: string;
		stack?: string;
	};
}

interface LoggerBindings {
	traceId?: string;
	taskId?: Id<"tasks">;
	component?: LogEntry["component"];
	toolName?: string;
}

export type { LogEntry, LoggerBindings };
