import { ActionCtx } from "@/../convex/_generated/server";
import { TOOLS_NAMESPACE } from "@/../convex/constants/tools";
import { rag } from "@/../convex/rag";
import { Tool, ToolSchema } from "./types";

export async function ragAddTool(ctx: ActionCtx, tool: Tool | ToolSchema) {
	// Create searchable text from tool name and description
	const searchableText = `${tool.name}: ${tool.description}`;

	// Add to RAG with tool metadata
	return await rag.add(ctx, {
		namespace: TOOLS_NAMESPACE,
		key: tool.name,
		title: tool.name,
		text: searchableText,
		metadata: {
			parameters: JSON.stringify(tool.parameters),
			type: tool.type,
			implementation: tool.implementation,
		},
	});
}
