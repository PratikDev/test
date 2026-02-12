"use client";

import { useMutation, useQuery } from "convex/react";
import {
	CheckCircle2,
	ChevronRight,
	CircleDashed,
	Clock,
	Info,
	PlayIcon,
	Terminal,
	Wrench,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { api } from "@/../convex/_generated/api";
import { SUGGESTED_PROMPTS } from "@/constants/prompts";

export default function Dashboard() {
	const [prompt, setPrompt] = useState("");
	const [activeTaskId, setActiveTaskId] = useState<any>(null);

	const createTask = useMutation(api.tasks.createTask);
	const task = useQuery(
		api.tasks.getTask,
		activeTaskId ? { taskId: activeTaskId } : "skip",
	);
	const recentTasks = useQuery(api.tasks.listTasks, { limit: 5 });

	const handleRunTask = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;
		const taskId = await createTask({ prompt });
		setActiveTaskId(taskId);
		setPrompt("");
	};

	return (
		<div className="min-h-screen bg-[#0a0a0b] text-zinc-100 p-8 font-sans">
			<div className="max-w-5xl mx-auto space-y-8">
				{/* Header */}
				<header className="flex items-center justify-between border-b border-zinc-800 pb-6">
					<div>
						<h1 className="text-3xl font-bold text-white">
							Orchestrator Control
						</h1>
						<p className="text-zinc-500 mt-1">
							Local OpenCode Worker Dashboard
						</p>
					</div>
				</header>

				{/* Task Input */}
				<section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
					<form
						onSubmit={handleRunTask}
						className="space-y-4"
					>
						{/* Suggested Prompts */}
						<div className="overflow-x-auto pb-2 -mx-1 px-1">
							<div className="flex gap-2 min-w-max">
								{SUGGESTED_PROMPTS.map((suggestedPrompt, idx) => (
									<button
										key={idx}
										type="button"
										onClick={() => setPrompt(suggestedPrompt)}
										className="px-3.5 py-1 border border-zinc-600 bg-zinc-900 hover:bg-zinc-800 cursor-pointer text-xs rounded-full transition-all whitespace-nowrap"
									>
										{suggestedPrompt}
									</button>
								))}
							</div>
						</div>

						{/* Input and Button */}
						<div className="flex gap-4">
							<div className="relative flex-1">
								<Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
								<Input
									placeholder="What should the agent do? (e.g., 'Read package.json')"
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									className="pl-12 h-14 bg-zinc-950/50 border-zinc-800 text-lg focus:border-blue-500/50 transition-all rounded-xl"
								/>
							</div>
							<Button
								type="submit"
								size="lg"
								className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20"
							>
								<PlayIcon className="w-5 h-5 mr-2" />
								Run Agent
							</Button>
						</div>
					</form>
				</section>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Execution Log */}
					<div className="lg:col-span-2 space-y-6">
						{!task ? (
							<div className="h-125 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 italic">
								Select a task or run a new one to see progress
							</div>
						) : (
							<div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
								{/* Status Bar */}
								<div className="px-6 py-4 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<span className="text-sm font-medium text-zinc-400">
											ID: {task._id.slice(-8)}
										</span>
										<div
											className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
												task.status === "completed"
													? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
													: task.status === "failed"
														? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
														: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
											}`}
										>
											{task.status}
										</div>
									</div>
								</div>

								{/* Audit Log */}
								<div className="p-6 space-y-6 max-h-150 overflow-y-auto custom-scrollbar">
									{task.steps.map((step: any, idx: number) => (
										<div
											key={idx}
											className="flex gap-4 group"
										>
											<div className="flex flex-col items-center">
												<div
													className={`w-8 h-8 rounded-full flex items-center justify-center border ${
														step.type === "tool_call"
															? "bg-blue-500/10 border-blue-500/30 text-blue-400"
															: step.type === "tool_result"
																? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
																: step.type === "final"
																	? "bg-amber-500/10 border-amber-500/30 text-amber-400"
																	: "bg-zinc-800 border-zinc-700 text-zinc-400"
													}`}
												>
													{step.type === "tool_call" ? (
														<Wrench className="w-4 h-4" />
													) : step.type === "tool_result" ? (
														<CheckCircle2 className="w-4 h-4" />
													) : step.type === "final" ? (
														<Terminal className="w-4 h-4" />
													) : (
														<Info className="w-4 h-4" />
													)}
												</div>
												{idx < task.steps.length - 1 && (
													<div className="w-px flex-1 bg-zinc-800 my-1" />
												)}
											</div>
											<div className="flex-1 pt-1">
												<p className="text-zinc-200 font-medium leading-tight">
													{step.message}
												</p>
												<p className="text-zinc-500 text-xs mt-1">
													{new Date(step.timestamp).toLocaleTimeString()}
												</p>
												{step.data && (
													<pre className="mt-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-[13px] font-mono text-zinc-300 overflow-x-auto">
														{typeof step.data === "string"
															? step.data
															: JSON.stringify(step.data, null, 2)}
													</pre>
												)}
											</div>
										</div>
									))}
									{task.status === "running" && (
										<div className="flex gap-4 animate-pulse">
											<div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
												<CircleDashed className="w-4 h-4 animate-spin text-zinc-500" />
											</div>
											<div className="flex-1 pt-1">
												<div className="h-4 w-32 bg-zinc-800 rounded mt-1" />
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Sidebar: Recent Tasks */}
					<aside className="space-y-6">
						<div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
							<h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center">
								<Clock className="w-4 h-4 mr-2" />
								Audit History
							</h3>
							<div className="space-y-3">
								{recentTasks?.map((t: any) => (
									<button
										key={t._id}
										onClick={() => setActiveTaskId(t._id)}
										className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
											activeTaskId === t._id
												? "bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20"
												: "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
										}`}
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate text-zinc-200 group-hover:text-white transition-colors">
												{t.prompt}
											</p>
											<div className="flex items-center gap-2 mt-1">
												<span
													className={`w-1.5 h-1.5 rounded-full ${
														t.status === "completed"
															? "bg-emerald-500"
															: t.status === "failed"
																? "bg-rose-500"
																: "bg-blue-500 animate-pulse"
													}`}
												/>
												<span className="text-[10px] text-zinc-500 font-mono uppercase">
													{t.status}
												</span>
											</div>
										</div>
										<ChevronRight
											className={`w-4 h-4 transition-transform ${
												activeTaskId === t._id
													? "text-blue-400 translate-x-1"
													: "text-zinc-600 group-hover:text-zinc-400"
											}`}
										/>
									</button>
								))}
							</div>
						</div>
					</aside>
				</div>
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
