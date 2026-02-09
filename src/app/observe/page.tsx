"use client";

import { useQuery } from "convex/react";
import { Activity, AlertCircle, Clock, Search } from "lucide-react";
import { useState } from "react";

import LogRow from "@/components/pages/observe/LogRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { api } from "@/../convex/_generated/api";
import { LogEntry } from "@/components/pages/observe/types";
import { cn } from "@/lib/utils";

export default function ObservePage() {
	const [levelFilter, setLevelFilter] = useState<string>("all");
	const [activeTab, setActiveTab] = useState<"recent" | "errors">("recent");

	const recentLogs = useQuery(api.logs.getRecentLogs, { limit: 100 }) as
		| LogEntry[]
		| undefined;
	const errorLogs = useQuery(api.logs.getErrorLogs, { limit: 100 }) as
		| LogEntry[]
		| undefined;

	const logs = activeTab === "recent" ? recentLogs : errorLogs;

	const filteredLogs = logs?.filter((log) => {
		if (levelFilter === "all") return true;
		return log.level === levelFilter;
	});

	const stats = {
		total: logs?.length || 0,
		errors: logs?.filter((l) => l.level === "error").length || 0,
		warnings: logs?.filter((l) => l.level === "warn").length || 0,
		info: logs?.filter((l) => l.level === "info").length || 0,
	};

	return (
		<div className="min-h-screen bg-[#0a0a0b] text-zinc-100 p-8 font-sans">
			<div className="max-w-7xl mx-auto space-y-8">
				{/* Header */}
				<header className="flex items-center justify-between border-b border-zinc-800 pb-6">
					<div>
						<h1 className="text-3xl font-bold text-white">Observability</h1>
						<p className="text-zinc-500 mt-1">System logs and metrics</p>
					</div>
					<div className="flex items-center gap-2">
						<Clock className="w-4 h-4 text-zinc-500" />
						<span className="text-sm text-zinc-400">
							Last updated: {new Date().toLocaleTimeString()}
						</span>
					</div>
				</header>

				{/* Stats Cards */}
				<div className="grid grid-cols-4 gap-4">
					<Card className="bg-zinc-900/50 border-zinc-800">
						<CardContent className="p-4">
							<p className="text-zinc-500 text-sm">Total Logs</p>
							<p className="text-2xl font-bold text-white">{stats.total}</p>
						</CardContent>
					</Card>
					<Card className="bg-zinc-900/50 border-zinc-800">
						<CardContent className="p-4">
							<p className="text-zinc-500 text-sm">Errors</p>
							<p className="text-2xl font-bold text-red-400">{stats.errors}</p>
						</CardContent>
					</Card>
					<Card className="bg-zinc-900/50 border-zinc-800">
						<CardContent className="p-4">
							<p className="text-zinc-500 text-sm">Warnings</p>
							<p className="text-2xl font-bold text-yellow-400">
								{stats.warnings}
							</p>
						</CardContent>
					</Card>
					<Card className="bg-zinc-900/50 border-zinc-800">
						<CardContent className="p-4">
							<p className="text-zinc-500 text-sm">Info</p>
							<p className="text-2xl font-bold text-blue-400">{stats.info}</p>
						</CardContent>
					</Card>
				</div>

				{/* Controls */}
				<div className="flex items-center justify-between">
					<div className="flex gap-2">
						<Button
							variant={activeTab === "recent" ? "default" : "outline"}
							size="sm"
							onClick={() => setActiveTab("recent")}
							className={cn({
								"bg-blue-600 hover:bg-blue-500": activeTab === "recent",
								"border-zinc-700 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200":
									activeTab !== "recent",
							})}
						>
							<Activity className="w-4 h-4 mr-2" />
							Recent Logs
						</Button>

						<Button
							variant={activeTab === "errors" ? "default" : "outline"}
							size="sm"
							onClick={() => setActiveTab("errors")}
							className={cn({
								"bg-red-600 hover:bg-red-500": activeTab === "errors",
								"border-zinc-700 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200":
									activeTab !== "errors",
							})}
						>
							<AlertCircle className="w-4 h-4 mr-2" />
							Errors Only
						</Button>
					</div>

					<div className="flex items-center gap-2">
						<Search className="w-4 h-4 text-zinc-500" />

						<Select
							value={levelFilter}
							onValueChange={setLevelFilter}
						>
							<SelectTrigger className="w-35 bg-zinc-900 border-zinc-800 text-zinc-200">
								<SelectValue placeholder="Filter by level" />
							</SelectTrigger>

							<SelectContent className="bg-zinc-900 border-zinc-800 text-gray-400">
								<SelectItem value="all">All Levels</SelectItem>
								<SelectItem value="error">Error</SelectItem>
								<SelectItem value="warn">Warning</SelectItem>
								<SelectItem value="info">Info</SelectItem>
								<SelectItem value="debug">Debug</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Logs Table */}
				<Card className="bg-zinc-900/50 border-zinc-800">
					<CardHeader className="border-b border-zinc-800">
						<CardTitle className="text-lg text-zinc-200">
							{activeTab === "recent" ? "Recent Logs" : "Error Logs"}
						</CardTitle>
					</CardHeader>

					<CardContent className="p-0">
						<div className="max-h-150 overflow-auto custom-scrollbar">
							<Table>
								<TableHeader className="sticky top-0 bg-zinc-900 z-10">
									<TableRow className="border-zinc-800 hover:bg-transparent">
										<TableHead className="text-zinc-400">Time</TableHead>
										<TableHead className="text-zinc-400">Level</TableHead>
										<TableHead className="text-zinc-400">Component</TableHead>
										<TableHead className="text-zinc-400">Message</TableHead>
										<TableHead className="text-zinc-400">Task</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{!filteredLogs ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center text-zinc-500 py-8"
											>
												Loading logs...
											</TableCell>
										</TableRow>
									) : filteredLogs.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center text-zinc-500 py-8"
											>
												No logs found
											</TableCell>
										</TableRow>
									) : (
										filteredLogs.map((log) => (
											<LogRow
												key={log._id}
												log={log}
											/>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>

			<style
				jsx
				global
			>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 6px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #27272a;
					border-radius: 10px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #3f3f46;
				}
			`}</style>
		</div>
	);
}
