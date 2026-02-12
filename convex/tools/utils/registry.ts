import { action } from "@/../convex/_generated/server";
import { ragAddTool } from "./ragAddTool";
import { ToolSchema } from "./types";

/**
 * Register a new tool in the registry
 */
export const registerTool = action({
	args: ToolSchema,
	handler: async (ctx, tool) => {
		await ragAddTool(ctx, tool);
		return { success: true, toolName: tool.name };
	},
});
