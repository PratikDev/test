"use client";

import { Activity, Info, Layers, Terminal } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import LogDetailsContent from "./LogDetailsContent";
import LogLevelBadge from "./LogLevelBadge";

import { LogEntry } from "./types";

const componentIcons: Record<string, React.ReactNode> = {
	orchestrator: <Activity className="size-4 text-white" />,
	opencode: <Terminal className="size-4 text-white" />,
	"ai-model": <Layers className="size-4 text-white" />,
	tool: <Terminal className="size-4 text-white" />,
	logger: <Info className="size-4 text-white" />,
};

export default function LogRow({ log }: { log: LogEntry }) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<TableRow className="cursor-pointer hover:bg-zinc-800/50 transition-colors">
					<TableCell className="font-mono text-xs text-zinc-500">
						{new Date(log.timestamp).toLocaleTimeString()}
					</TableCell>
					<TableCell>
						<LogLevelBadge level={log.level} />
					</TableCell>
					<TableCell>
						<div className="flex items-center gap-2">
							{componentIcons[log.component] || (
								<Info className="size-4 text-white" />
							)}
							<span className="text-zinc-300 capitalize">{log.component}</span>
						</div>
					</TableCell>
					<TableCell className="text-zinc-200 max-w-md truncate">
						{log.message}
					</TableCell>
					<TableCell className="font-mono text-xs text-zinc-500">
						{log.taskId ? log.taskId.slice(-8) : "-"}
					</TableCell>
				</TableRow>
			</DialogTrigger>

			<DialogContent className="sm:max-w-7xl w-auto min-w-xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<LogLevelBadge level={log.level} />
						<DialogTitle className="text-lg text-zinc-100">
							Log Details
						</DialogTitle>
					</div>
				</DialogHeader>
				<LogDetailsContent log={log} />
			</DialogContent>
		</Dialog>
	);
}
