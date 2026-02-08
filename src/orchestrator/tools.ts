import { createOpencodeClient, createOpencodeServer } from "@opencode-ai/sdk";
import { OpencodeClient } from "@opencode-ai/sdk/client";
import { jsonSchema, tool } from "ai";
import { api } from "../../convex/_generated/api";
import { client as convexClient } from "./convex";

/**
 * Result of initializing OpenCode.
 */
export interface OpencodeInit {
    client: OpencodeClient;
    server: {
        url: string;
        close(): void;
    };
}

/**
 * Initialize OpenCode server and client.
 */
export async function initOpencode(): Promise<OpencodeInit> {
    console.log("[OpenCode] Starting local server...");
    const server = await createOpencodeServer();

    const baseUrl = server.url.replace("127.0.0.1", "localhost");
    console.log(`[OpenCode] Server running at: ${baseUrl}`);

    // Use Basic Auth from .env.local as verified by diagnostics
    const username = process.env.OPENCODE_SERVER_USERNAME!;
    const password = process.env.OPENCODE_SERVER_PASSWORD!;
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

    console.log(`[OpenCode] Applying Basic Auth for user: ${username}`);

    const client = createOpencodeClient({
        baseUrl,
        directory: process.cwd(),
        headers: {
            'Authorization': authHeader
        }
    });

    console.log(`[OpenCode] Session running for ${process.cwd()}`);

    return { client, server: { ...server, url: baseUrl } };
}

/**
 * Recursive type for JSON data to avoid 'any' or 'unknown'.
 */
export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

/**
 * Remote tool metadata from Convex.
 */
export interface RemoteTool {
    name: string;
    description: string;
    parameters: Record<string, JsonValue>;
    implementation: string;
}

/**
 * A local tool that allows the agent to search the Convex Registry for more tools.
 */
export const convexSearchTool = {
	description: "Search the remote Convex tool registry for tools that can help with the current task. Use this if you don't have the necessary local tools.",
	parameters: {
		type: "object",
		properties: {
			query: {
				type: "string",
				description: "A description of the tools you are looking for (e.g., 'read file', 'run shell command')",
			},
		},
		required: ["query"],
	},
	execute: async ({ query }: { query: string }) => {
		console.log(`[Remote Search] Finding tools for: "${query}"...`);
		const result = await convexClient.action(api.tools.search.searchTools, { query });
		
		if (!result.tools || result.tools.length === 0) {
			return { message: "No matching remote tools found." };
		}
		
		return {
			message: `Found ${result.tools.length} potential tools in the registry. You can use 'execute_remote_tool' to run them.`,
			tools: result.tools.map((t): RemoteTool => {
                const nameOutput = t.name ? String(t.name) : "unnamed";
                const implOutput = t.implementation ? String(t.implementation) : "unknown";
                
                return {
                    name: nameOutput,
                    description: t.description,
                    parameters: t.parameters as Record<string, JsonValue>,
                    implementation: implOutput
                };
            })
		};
	}
};

/**
 * Helper to get a tool by name from Convex
 */
export async function getRemoteTool(name: string): Promise<RemoteTool | null> {
    const tool = await convexClient.action(api.tools.registry.getToolByName, { name });
    if (!tool || !tool.name || !tool.implementation) return null;
    return {
        name: String(tool.name),
        description: tool.description,
        parameters: tool.parameters as Record<string, JsonValue>,
        implementation: String(tool.implementation),
    };
}

/**
 * Converts a RemoteTool definition into a functional AI SDK tool.
 */
export function convertToSdkTool(
    client: OpencodeClient,
    sessionId: string,
    remoteTool: RemoteTool
) {
    return tool({
        description: remoteTool.description,
        inputSchema: jsonSchema(remoteTool.parameters as any),
        execute: async (args: any) => {
            console.log(`[Bridge] Executing ${remoteTool.name} locally via ${remoteTool.implementation}...`);
            const result = await executeRemoteTool(
                client,
                remoteTool.name,
                remoteTool.implementation,
                args,
                sessionId
            );
            return result.data as JsonValue;
        },
    });
}

/**
 * Type for functions that execute tool logic locally.
 */
export type ToolExecutor = (
    client: OpencodeClient,
    args: Record<string, JsonValue>,
    sessionId: string
) => Promise<any>;

/**
 * Registry mapping implementation IDs to local executors.
 */
const toolRegistry = new Map<string, ToolExecutor>();

// --- Registry Initialization ---

toolRegistry.set("opencode:readFile", async (client, args) => {
    return await client.file.read({
        query: { path: String(args.path) }
    });
});

toolRegistry.set("opencode:runCommand", async (client, args, sessionId) => {
    return await client.session.shell({
        path: { id: sessionId },
        body: { 
            agent: "orchestrator",
            command: String(args.command)
        }
    });
});

toolRegistry.set("opencode:searchCode", async (client, args) => {
    return await client.find.text({
        query: { pattern: String(args.pattern) }
    });
});

toolRegistry.set("opencode:listDirectory", async (client, args) => {
    return await client.file.list({
        query: { path: String(args.path || ".") }
    });
});

/**
 * Executes a tool locally via OpenCode using the modular registry.
 */
export async function executeRemoteTool(
    client: OpencodeClient,
    toolName: string,
    implementation: string,
    args: Record<string, JsonValue>,
    sessionId: string
) {
    const executor = toolRegistry.get(implementation);

    if (executor) {
        return await executor(client, args, sessionId);
    }

    // Default: try to call as a generic command if implementation starts with 'opencode:'
    if (implementation.startsWith("opencode:")) {
        const cmd = implementation.replace("opencode:", "");
        return await client.session.shell({
            path: { id: sessionId },
            body: { 
                agent: "orchestrator",
                command: `${cmd} ${Object.values(args).join(" ")}`
            }
        });
    }

    throw new Error(`Execution for ${implementation} (requested by ${toolName}) is not implemented in any registry.`);
}