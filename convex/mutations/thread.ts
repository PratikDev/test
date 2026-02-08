import { mutation } from "../_generated/server";
import agent from "../agent";

export const createThread = mutation({
	args: {},
	handler: async (ctx) => {
		const { threadId } = await agent.createThread(ctx);
		return threadId;
	},
});
