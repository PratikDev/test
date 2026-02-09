"use client";

import { AlertCircle } from "lucide-react";

import { LogEntry } from "./types";

export default function LogDetailsContent({ log }: { log: LogEntry }) {
	return (
		<div className="space-y-4 pt-4">
			<div className="grid grid-cols-2 gap-4 text-sm">
				<div>
					<span className="text-zinc-500">Timestamp:</span>
					<p className="font-mono text-zinc-300">
						{new Date(log.timestamp).toLocaleString()}
					</p>
				</div>
				<div>
					<span className="text-zinc-500">Component:</span>
					<p className="text-zinc-300 capitalize">{log.component}</p>
				</div>
				<div>
					<span className="text-zinc-500">Trace ID:</span>
					<p className="font-mono text-zinc-300 text-xs break-all">
						{log.traceId || "-"}
					</p>
				</div>
				<div>
					<span className="text-zinc-500">Task ID:</span>
					<p className="font-mono text-zinc-300 text-xs break-all">
						{log.taskId || "-"}
					</p>
				</div>
			</div>

			<div className="border-t border-zinc-800 pt-4">
				<span className="text-zinc-500 text-sm">Message:</span>
				<p className="mt-2 text-zinc-200 whitespace-pre-wrap">{log.message}</p>
			</div>

			{log.metadata && Object.keys(log.metadata).length > 0 && (
				<div className="border-t border-zinc-800 pt-4">
					<span className="text-zinc-500 text-sm">Metadata:</span>
					<pre className="mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-x-auto text-xs text-zinc-300 font-mono">
						{JSON.stringify(log.metadata, null, 2)}
					</pre>
				</div>
			)}

			{log.error && (
				<div className="border-t border-zinc-800 pt-4">
					<span className="text-red-400 text-sm flex items-center gap-2">
						<AlertCircle className="w-4 h-4" />
						Error
					</span>
					<p className="mt-2 text-red-300">{log.error.message}</p>
					{log.error.stack && (
						<pre className="mt-2 p-4 bg-red-950/20 border border-red-900/30 rounded-lg overflow-x-auto text-xs text-red-300 font-mono">
							{log.error.stack}
						</pre>
					)}
				</div>
			)}
		</div>
	);
}