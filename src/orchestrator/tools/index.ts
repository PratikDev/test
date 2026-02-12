import { jsonSchema, tool } from "ai";
import { makeFunctionReference } from "convex/server";

import { api } from "@/../convex/_generated/api";
import { client as convexClient } from "@/orchestrator/convex";
import { Logger } from "@/orchestrator/logger";
import { JsonValue, RemoteTool, StatusAwareResponse } from "@/types";

export async function searchTools(
	query: string,
): Promise<StatusAwareResponse<RemoteTool[]>> {
	const result = await convexClient.action(api.tools.utils.search.searchTools, {
		query,
	});

	if (!result.tools || result.tools.length === 0) {
		return {
			success: false,
			message: "No matching remote tools found.",
		};
	}

	return {
		success: true,
		data: result.tools.map((t): RemoteTool => {
			const nameOutput = t.name ? String(t.name) : "unnamed";
			const implOutput = t.implementation
				? String(t.implementation)
				: "unknown";

			return {
				name: nameOutput,
				description: t.description,
				parameters: t.parameters,
				type: t.type,
				implementation: implOutput,
			};
		}),
	};
}

export function convertToSdkTool(
	remoteTool: RemoteTool,
	parentLogger?: Logger,
) {
	const logger = parentLogger?.child({
		component: "tool",
		toolName: remoteTool.name,
	});

	return tool({
		description: remoteTool.description,
		inputSchema: jsonSchema(remoteTool.parameters),
		execute: async (args: any) => {
			if (logger) {
				return await logger.trackAsync(
					`tool.${remoteTool.name}`,
					{ implementation: remoteTool.implementation, args },
					async () => {
						const result = await executeRemoteTool(remoteTool, args);
						return result.data;
					},
				);
			} else {
				const result = await executeRemoteTool(remoteTool, args);
				return result.data;
			}
		},
	});
}

async function executeRemoteTool(
	tool: RemoteTool,
	args: Record<string, JsonValue>,
) {
	const { implementation, name: toolName, type } = tool;

	if (!implementation.startsWith("convex:")) {
		throw new Error(`Unsupported implementation: ${implementation}`);
	}

	const actionName = implementation.replace("convex:", "");
	const executionObject = {
		action: () =>
			convexClient.action(makeFunctionReference<"action">(actionName), args),
		query: () =>
			convexClient.query(makeFunctionReference<"query">(actionName), args),
		mutation: () =>
			convexClient.mutation(
				makeFunctionReference<"mutation">(actionName),
				args,
			),
	};
	const result = (await executionObject[type]()) as StatusAwareResponse;
	if (!result.success) {
		throw new Error(
			`Execution for ${implementation} (requested by tool ${toolName}) failed: ${result.message}`,
		);
	}
	return result;
}
