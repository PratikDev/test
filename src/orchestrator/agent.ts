import { google } from "@ai-sdk/google";
import { generateText, ModelMessage, tool, Tool } from "ai";
import z from "zod";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { httpClient } from "./convex";
import { LOCAL_TOOLS } from "./data/LOCAL_TOOLS";
import { logger } from "./logger";
import { client } from "./opencode";
import { SYSTEM_PROMPT } from "./prompts";
import { convertToSdkTool, searchTools } from "./tools";

async function runTask(taskId: Id<"tasks">, prompt: string) {
	const taskLogger = logger.child({
		taskId,
		traceId: crypto.randomUUID(),
		component: "orchestrator",
	});

	const taskStartTime = Date.now();
	let step = 0;

	taskLogger.info({ goal: prompt }, `Starting task: ${prompt.slice(0, 50)}...`);

	try {
		await httpClient.mutation(api.tasks.updateTaskStatus, {
			taskId,
			status: "running",
		});
		await httpClient.mutation(api.tasks.addStep, {
			taskId,
			type: "info",
			message: "Initializing OpenCode session...",
		});

		const sessionResponse = await taskLogger.trackAsync(
			"opencode.session.create",
			{},
			async () => {
				const response = await client.session.create({
					body: { title: `Orchestrator Session: ${prompt.slice(0, 30)}...` },
				});
				if (response.error) {
					throw new Error(`Failed to create session: ${response.error}`);
				}
				return response;
			},
		);

		const sessionId = sessionResponse.data.id;

		const model = google(process.env.MODEL_NAME!);

		const activeTools: Record<string, Tool<any, any>> = {
			search_remote_tools: tool({
				description:
					"Search the remote Convex tool registry for tools that can help with the current task. Use this if you don't have the necessary local tools.",
				inputSchema: z.object({
					query: z
						.string()
						.describe(
							"A description of the tools you are looking for (e.g., 'web search', 'telegram bot')",
						),
				}),
				execute: async ({ query }) => {
					await httpClient.mutation(api.tasks.addStep, {
						taskId,
						type: "info",
						message: `Searching for tools: "${query}"`,
					});

					const searchResult = await taskLogger.trackAsync(
						"tool.search",
						{ query },
						async () => await searchTools(query),
					);
					if (!searchResult.success) {
						return {
							success: false,
							message: searchResult.message,
						};
					}

					if (searchResult.data.length > 0) {
						for (const remoteTool of searchResult.data) {
							if (!activeTools[remoteTool.name]) {
								activeTools[remoteTool.name] = convertToSdkTool(
									remoteTool,
									taskLogger,
								);
								taskLogger.info(
									{ toolName: remoteTool.name },
									`Registered new tool: ${remoteTool.name}`,
								);
								await httpClient.mutation(api.tasks.addStep, {
									taskId,
									type: "info",
									message: `Registered new tool: ${remoteTool.name}`,
								});
							}
						}
					}
					return searchResult;
				},
			}),
			...LOCAL_TOOLS,
		};

		const messages: ModelMessage[] = [{ role: "user", content: prompt }];
		const maxSteps = 10;

		while (step < maxSteps) {
			step++;
			await httpClient.mutation(api.tasks.addStep, {
				taskId,
				type: "info",
				message: `Step ${step}: Generating response...`,
			});

			taskLogger.debug({ step }, `Starting step ${step}`);

			// 			const result = await taskLogger.trackAsync(
			// 				"ai.generateText",
			// 				{
			// 					step,
			// 					model: process.env.MODEL_NAME,
			// 					toolsCount: Object.keys(activeTools).length,
			// 				},
			// 				async () => {
			// 					const generationResult = await generateText({
			// 						model,
			// 						system: `You are a Local Orchestrator Agent. Complete the task using available tools.
			// If you lack a tool, use 'search_remote_tools' to find it. Once found, the tool will be
			// immediately available for you to call by its name in the next turn.`,
			// 						messages,
			// 						tools: activeTools,
			// 						onStepFinish: async ({ toolCalls, toolResults }) => {
			// 							for (const toolCall of toolCalls) {
			// 								await convex.mutation(api.tasks.addStep, {
			// 									taskId,
			// 									type: "tool_call",
			// 									message: `Calling ${toolCall.toolName}...`,
			// 									data: (toolCall as any).args || (toolCall as any).input,
			// 								});
			// 							}
			// 							for (const toolResult of toolResults) {
			// 								await convex.mutation(api.tasks.addStep, {
			// 									taskId,
			// 									type: "tool_result",
			// 									message: `Result from ${toolResult.toolName}`,
			// 									data:
			// 										(toolResult as any).result || (toolResult as any).output,
			// 								});
			// 							}
			// 						},
			// 					});

			// 					return {
			// 						...generationResult,
			// 						metadata: {
			// 							inputTokens: generationResult.usage?.inputTokens,
			// 							outputTokens: generationResult.usage?.outputTokens,
			// 							totalTokens: generationResult.usage?.totalTokens,
			// 						},
			// 					};
			// 				},
			// 			);

			const result = await generateText({
				model,
				system: SYSTEM_PROMPT,
				messages,
				tools: activeTools,
				onStepFinish: async ({ toolCalls, toolResults }) => {
					for (const toolCall of toolCalls) {
						await httpClient.mutation(api.tasks.addStep, {
							taskId,
							type: "tool_call",
							message: `Calling ${toolCall.toolName}...`,
							data: (toolCall as any).args || (toolCall as any).input,
						});
					}
					for (const toolResult of toolResults) {
						await httpClient.mutation(api.tasks.addStep, {
							taskId,
							type: "tool_result",
							message: `Result from ${toolResult.toolName}`,
							data: (toolResult as any).result || (toolResult as any).output,
						});
					}
				},
			});

			messages.push(...result.response.messages);

			if (result.toolCalls.length === 0) {
				const totalDuration = Date.now() - taskStartTime;

				await httpClient.mutation(api.tasks.addStep, {
					taskId,
					type: "final",
					message: "Final response generated",
					data: result.text,
				});

				await httpClient.mutation(api.tasks.updateTaskStatus, {
					taskId,
					status: "completed",
					result: result.text,
				});

				taskLogger.info(
					{
						totalDuration,
						totalSteps: step,
						// totalTokens: result.metadata?.totalTokens,
						// inputTokens: result.metadata?.inputTokens,
						// outputTokens: result.metadata?.outputTokens,
					},
					`Task completed in ${totalDuration}ms (${step} steps)`,
				);

				break;
			}
		}

		if (step >= maxSteps) {
			const totalDuration = Date.now() - taskStartTime;
			taskLogger.warn(
				{ totalSteps: step, totalDuration },
				`Task reached max steps (${maxSteps})`,
			);
		}
	} catch (error: any) {
		const totalDuration = Date.now() - taskStartTime;

		taskLogger.error(
			{
				error,
				totalDuration,
				currentStep: step,
			},
			`Task failed after ${totalDuration}ms`,
		);

		await httpClient.mutation(api.tasks.updateTaskStatus, {
			taskId,
			status: "failed",
			result: error.message,
		});
		await httpClient.mutation(api.tasks.addStep, {
			taskId,
			type: "info",
			message: `Error: ${error.message}`,
		});
	}
}

async function worker() {
	logger.info(
		{ component: "orchestrator" },
		"--- [ Orchestrator Worker Started ] ---",
	);
	logger.info({ component: "orchestrator" }, "Polling for tasks...");

	while (true) {
		try {
			const pendingTask = await httpClient.query(api.tasks.getPendingTask);
			if (pendingTask) {
				logger.info(
					{ taskId: pendingTask._id },
					`Found pending task: ${pendingTask._id}`,
				);
				await runTask(pendingTask._id, pendingTask.prompt);
			}
		} catch (error) {
			logger.error(
				{ error, component: "orchestrator" },
				"Error in worker loop",
			);
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
}

worker().catch((error) => {
	logger.error({ error, component: "orchestrator" }, "Worker crashed");
	process.exit(1);
});
