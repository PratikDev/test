import { v } from "convex/values";
import { action } from "../_generated/server";
import { TOOLS_NAMESPACE } from "../constants/tools";
import { rag } from "../rag";

/**
 * Search for tools relevant to a task description using semantic search
 */
export const searchTools = action({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { query, limit = 5 }) => {
		const { entries, usage } = await rag.search(ctx, {
			namespace: TOOLS_NAMESPACE,
			query,
			limit,
			vectorScoreThreshold: 0.3,
		});

		// Transform entries to tool format
		const tools = entries.map((entry) => ({
			name: entry.title || entry.key,
			description: entry.text,
			category: entry.metadata?.category,
			parameters: entry.metadata?.parameters
				? JSON.parse(entry.metadata.parameters as string)
				: {},
			implementation: entry.metadata?.implementation,
		}));

		return {
			tools,
			usage,
		};
	},
});
