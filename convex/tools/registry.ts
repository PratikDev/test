import { v } from "convex/values";
import { action } from "../_generated/server";
import { TOOLS_NAMESPACE } from "../constants/tools";
import { rag } from "../rag";
import { type Tool, toolSchema } from "./types";

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

/**
 * Get a specific tool by name
 */
export const getToolByName = action({
	args: { name: v.string() },
	handler: async (ctx, { name }) => {
		const { entries } = await rag.search(ctx, {
			namespace: TOOLS_NAMESPACE,
			query: name,
			limit: 1,
		});

		if (entries.length === 0) {
			return null;
		}

		const entry = entries[0];
		return {
			name: entry.title || entry.key,
			description: entry.text,
			category: entry.metadata?.category,
			parameters: entry.metadata?.parameters
				? JSON.parse(entry.metadata.parameters as string)
				: {},
			implementation: entry.metadata?.implementation,
		} as Tool;
	},
});
