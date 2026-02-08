import { google } from "@ai-sdk/google";
import { generateText, jsonSchema, LanguageModel, stepCountIs, tool, zodSchema } from "ai";
import { z } from "zod";
import { convexSearchTool, executeRemoteTool, getRemoteTool, initOpencode, JsonValue, RemoteTool } from "./tools";

/**
 * Local Orchestrator Agent
 * 
 * This script demonstrates the main Phase 2 objective:
 * 1. Initialize local OpenCode server/session.
 * 2. Connect to Convex Registry for tool discovery.
 * 3. Execute remote-discovered tools locally via the OpenCode bridge.
 */
async function main() {
	const task = process.argv[2];
	if (!task) {
		console.error("Please provide a task description.");
		process.exit(1);
	}

	console.log(`\n--- [ Orchestrator Agent Started ] ---`);
	console.log(`Goal: ${task}\n`);

    // 1. Initialize OpenCode
    const initResult = await initOpencode();
    const { client, server } = initResult;
    
    console.log("Initializing OpenCode session...");
    const projectResponse = await client.project.current();
    if (projectResponse.error) {
        console.warn("[OpenCode] Warning: Failed to get current project metadata (continuing anyway):", projectResponse.error);
    }
    
    
    // session.create body only takes parentID and title
    const sessionResponse = await client.session.create({
        body: { title: `Orchestrator Session: ${task.slice(0, 30)}...` } 
    });
    if (sessionResponse.error) {
        console.error("[OpenCode] Failed to create session:", sessionResponse.error);
        process.exit(1);
    }
    const session = sessionResponse.data;
    const sessionId = session.id;

	console.log("Processing task with dynamic tool discovery...");
    
    // Correct type name for model in AI SDK 6.x
    const model = google(process.env.MODEL_NAME!) as LanguageModel;

	const result = await generateText({
		model,
		prompt: task,
		system: `
            You are a Local Orchestrator Agent. 
            You must complete the user's task using available tools.
            If you lack a tool (e.g., file system access), use 'search_remote_tools' to find it in the Convex registry.
            Once a tool is found, use 'execute_remote_tool' to run it.
        `,
		tools: {
            search_remote_tools: tool({
                description: "Search the remote Convex tool registry for tools.",
                inputSchema: zodSchema(z.object({
                    query: z.string().describe("Tool search query"),
                })),
                execute: async ({ query }: { query: string }) => {
                    return await convexSearchTool.execute({ query });
                }
            }),
            execute_remote_tool: tool({
                description: "Executes a discovered tool locally via the OpenCode bridge.",
                inputSchema: jsonSchema({
                    type: "object",
                    properties: {
                        toolName: { type: "string", description: "The name of the discovered tool" },
                        args: { type: "object", description: "Arguments for the tool" }
                    },
                    required: ["toolName", "args"]
                }),
                execute: async ({ toolName, args }: { toolName: string, args: Record<string, JsonValue> }) => {
                    const foundTool: RemoteTool | null = await getRemoteTool(toolName);
                    if (!foundTool) return { error: `Tool ${toolName} not found in registry.` };
                    
                    try {
                        const executionResult = await executeRemoteTool(client, foundTool.name, foundTool.implementation, args, sessionId);
                        return { result: executionResult.data as JsonValue };
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        return { error: errorMessage };
                    }
                }
            })
        },
        stopWhen: stepCountIs(10),
	});

	console.log("\n--- [ Agent Response ] ---");
	console.log(result.text);

    // Cleanup
    server.close();
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack || error.message : String(error);
	console.error("\n[Fatal Error]:", message);
	process.exit(1);
});
