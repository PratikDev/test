import { v } from "convex/values";
import { action } from "./_generated/server";
import agent from "./agent";

export const sendMessageToAgent = action({
	args: {
		threadId: v.string(),
		prompt: v.string(),
	},
	handler: async (ctx, args) => {
		const { thread } = await agent.continueThread(ctx, {
			threadId: args.threadId,
		});
		const result = await thread.generateText({
			prompt: args.prompt,
		} as any);
		return result.text;
	},
});
