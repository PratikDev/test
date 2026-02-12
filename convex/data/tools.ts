import { type Tool } from "@/../convex/tools/utils/types";

export const INITIAL_TOOLS: Tool[] = [
	{
		name: "getWebhookSecret",
		description: "Tool to retrieve a webhook secret value from the server.",
		parameters: {},
		type: "query",
		implementation: "convex:tools/registry/secret:getWebhookSecret",
	},
];
