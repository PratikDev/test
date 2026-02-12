import { action } from "@/../convex/_generated/server";
import { INITIAL_TOOLS } from "@/../convex/data/tools";
import { ragAddTool } from "./ragAddTool";

/**
 * Seed the tool registry with initial tools
 */
export const seedTools = action({
	args: {},
	handler: async (ctx) => {
		const results = [];

		for (const tool of INITIAL_TOOLS) {
			await ragAddTool(ctx, tool);
			results.push({ name: tool.name, status: "added" });
		}

		return {
			success: true,
			toolsAdded: results.length,
			tools: results,
		};
	},
});
