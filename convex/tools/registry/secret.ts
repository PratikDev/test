import { query } from "@/../convex/_generated/server";

export const getWebhookSecret = query({
	args: {},
	handler: async () => {
		return {
			success: true,
			data: "pomfret",
		};
	},
});
