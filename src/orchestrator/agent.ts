import { google } from "@ai-sdk/google";
import { generateText, jsonSchema, ModelMessage, tool, Tool } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { convertToSdkTool, convexSearchTool, initOpencode, OpencodeInit, RemoteTool } from "./tools";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Singleton OpenCode instance
let opencodeInstance: OpencodeInit | null = null;

async function getOpencode(): Promise<OpencodeInit> {
    if (!opencodeInstance) {
        console.log("[OpenCode] Initializing for the first time...");
        opencodeInstance = await initOpencode();
    }
    return opencodeInstance;
}

async function runTask(taskId: Id<"tasks">, prompt: string) {
    console.log(`\n--- [ Processing Task: ${taskId} ] ---`);
    console.log(`Goal: ${prompt}\n`);

    const { client, server } = await getOpencode();

    try {
        await convex.mutation(api.tasks.updateTaskStatus, { taskId, status: "running" });
        await convex.mutation(api.tasks.addStep, { 
            taskId, 
            type: "info", 
            message: "Initializing OpenCode session..." 
        });

        const projectResponse = await client.project.current();
        const sessionResponse = await client.session.create({
            body: { title: `Orchestrator Session: ${prompt.slice(0, 30)}...` } 
        });

        if (sessionResponse.error) {
            throw new Error(`Failed to create session: ${sessionResponse.error}`);
        }
        const sessionId = sessionResponse.data.id;

        const model = google(process.env.MODEL_NAME!);

        const activeTools: Record<string, Tool<any, any>> = {
            search_remote_tools: tool({
                description: convexSearchTool.description,
                inputSchema: jsonSchema(convexSearchTool.parameters as any),
                execute: async ({ query }: { query: string }) => {
                    await convex.mutation(api.tasks.addStep, { 
                        taskId, 
                        type: "info", 
                        message: `Searching for tools: "${query}"` 
                    });

                    const searchResult = await convexSearchTool.execute({ query });

                    if (searchResult.tools && searchResult.tools.length > 0) {
                        for (const remoteTool of searchResult.tools) {
                            if (!activeTools[remoteTool.name]) {
                                activeTools[remoteTool.name] = convertToSdkTool(client, sessionId, remoteTool as RemoteTool);
                                await convex.mutation(api.tasks.addStep, { 
                                    taskId, 
                                    type: "info", 
                                    message: `Registered new tool: ${remoteTool.name}` 
                                });
                            }
                        }
                    }
                    return searchResult;
                }
            })
        };

        const messages: ModelMessage[] = [{ role: 'user', content: prompt }];
        let step = 0;
        const maxSteps = 10;

        while (step < maxSteps) {
            step++;
            await convex.mutation(api.tasks.addStep, { 
                taskId, 
                type: "info", 
                message: `Step ${step}: Generating response...` 
            });
            
            const result = await generateText({
                model,
                system: `You are a Local Orchestrator Agent. Complete the task using available tools.
If you lack a tool, use 'search_remote_tools' to find it. Once found, the tool will be 
immediately available for you to call by its name in the next turn.`,
                messages,
                tools: activeTools,
                onStepFinish: async ({ toolCalls, toolResults }) => {
                    for (const toolCall of toolCalls) {
                        await convex.mutation(api.tasks.addStep, { 
                            taskId, 
                            type: "tool_call", 
                            message: `Calling ${toolCall.toolName}...`,
                            data: (toolCall as any).args || (toolCall as any).input
                        });
                    }
                    for (const toolResult of toolResults) {
                        await convex.mutation(api.tasks.addStep, { 
                            taskId, 
                            type: "tool_result", 
                            message: `Result from ${toolResult.toolName}`,
                            data: (toolResult as any).result || (toolResult as any).output
                        });
                    }
                }
            });

            messages.push(...result.response.messages);

            if (result.toolCalls.length === 0) {
                await convex.mutation(api.tasks.addStep, {
                    taskId, 
                    type: "final", 
                    message: "Final response generated",
                    data: result.text
                });
                await (convex.mutation)(api.tasks.updateTaskStatus, { 
                    taskId, 
                    status: "completed", 
                    result: result.text 
                });
                break;
            }
        }
    } catch (error: any) {
        console.error("Task failed:", error);
        await convex.mutation(api.tasks.updateTaskStatus, { 
            taskId, 
            status: "failed", 
            result: error.message 
        });
        await convex.mutation(api.tasks.addStep, { 
            taskId, 
            type: "info", 
            message: `Error: ${error.message}` 
        });
    }
    // Note: We keep the OpenCode server running across tasks
}

async function worker() {
    console.log("--- [ Orchestrator Worker Started ] ---");
    console.log("Polling for tasks...");

    while (true) {
        const pendingTask = await convex.query(api.tasks.getPendingTask);
        if (pendingTask) {
            await runTask(pendingTask._id, pendingTask.prompt);
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}

worker().catch(console.error);
