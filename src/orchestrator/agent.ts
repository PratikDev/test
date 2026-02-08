import { google } from "@ai-sdk/google";
import { generateText, jsonSchema, ModelMessage, tool, Tool } from "ai";
import { convertToSdkTool, convexSearchTool, initOpencode, RemoteTool } from "./tools";

async function main() {
	const task = process.argv[2];
	if (!task) {
		console.error("Please provide a task description.");
		process.exit(1);
	}

	console.log(`\n--- [ Orchestrator Agent Started ] ---`);
	console.log(`Goal: ${task}\n`);

    const initResult = await initOpencode();
    const { client, server } = initResult;
    
    console.log("Initializing OpenCode session...");
    const projectResponse = await client.project.current();
    if (projectResponse.error) {
        console.warn("[OpenCode] Warning: Failed to get current project metadata (continuing anyway):", projectResponse.error);
    }
    
    const sessionResponse = await client.session.create({
        body: { title: `Orchestrator Session: ${task.slice(0, 30)}...` } 
    });
    if (sessionResponse.error) {
        console.error("[OpenCode] Failed to create session:", sessionResponse.error);
        process.exit(1);
    }
    const sessionId = sessionResponse.data.id;

	console.log("Processing task with dynamic tool injection...");
    
    const model = google(process.env.MODEL_NAME!);
    
    // Start with core tools
    const activeTools: Record<string, Tool<any, any>> = {
        search_remote_tools: tool({
            description: convexSearchTool.description,
            inputSchema: jsonSchema(convexSearchTool.parameters as any),
            execute: async ({ query }: { query: string }) => {
                const searchResult = await convexSearchTool.execute({ query });
                
                if (searchResult.tools && searchResult.tools.length > 0) {
                    console.log(`[Discovery] Learning ${searchResult.tools.length} new tools...`);
                    for (const remoteTool of searchResult.tools) {
                        if (!activeTools[remoteTool.name]) {
                            activeTools[remoteTool.name] = convertToSdkTool(client, sessionId, remoteTool as RemoteTool);
                            console.log(`  + Registered: ${remoteTool.name}`);
                        }
                    }
                }
                return searchResult;
            }
        })
    };

    const messages: ModelMessage[] = [{ role: 'user', content: task }];
    let step = 0;
    const maxSteps = 10;

    while (step < maxSteps) {
        step++;
        console.log(`\n[Step ${step}] Generating response...`);
        
        const result = await generateText({
            model,
            system: `You are a Local Orchestrator Agent. Complete the task using available tools.
If you lack a tool, use 'search_remote_tools' to find it. Once found, the tool will be 
immediately available for you to call by its name in the next turn.`,
            messages,
            tools: activeTools,
        });

        // Add assistant response to history
        messages.push(...result.response.messages);

        if (result.toolCalls.length === 0) {
            console.log("\n--- [ Agent Response ] ---");
            console.log(result.text);
            break;
        }
    }

    server.close();
}

main().catch(console.error);
