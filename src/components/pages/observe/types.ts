import { Id } from "@/../convex/_generated/dataModel";
import { LogEntry as LoggerLogEntry } from "@/orchestrator/logger/types";

interface LogEntry extends LoggerLogEntry {
	_id: Id<"logs">;
}

export type { LogEntry };
