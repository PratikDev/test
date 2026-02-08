import { action } from "../_generated/server";
import { TOOLS_NAMESPACE } from "../constants/tools";
import { INITIAL_TOOLS } from "../data/tools";
import { rag } from "../rag";

/**
 * Seed the tool registry with initial tools
 */
export const seedTools = action({
	args: {},
	handler: async (ctx) => {
		const results = [];

		for (const tool of INITIAL_TOOLS) {
			const searchableText = `${tool.name}: ${tool.description}`;

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

			results.push({ name: tool.name, status: "added" });
		}

		return {
			success: true,
			toolsAdded: results.length,
			tools: results,
		};
	},
});
