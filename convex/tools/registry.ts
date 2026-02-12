import { action } from "@/../convex/_generated/server";
import { TOOLS_NAMESPACE } from "@/../convex/constants/tools";
import { rag } from "@/../convex/rag";
import { toolSchema } from "@/../convex/tools/types";

/**
 * Register a new tool in the registry
 */
export const registerTool = action({
	args: toolSchema,
	handler: async (ctx, tool) => {
		// Create searchable text from tool name and description
		const searchableText = `${tool.name}: ${tool.description}`;

		// Add to RAG with tool metadata
		await rag.add(ctx, {
			namespace: TOOLS_NAMESPACE,
			key: tool.name,
			title: tool.name,
			text: searchableText,
			metadata: {
				category: tool.category,
				parameters: JSON.stringify(tool.parameters),
				implementation: tool.implementation,
			},
		});

		return { success: true, toolName: tool.name };
	},
});
