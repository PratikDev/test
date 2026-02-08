import { google } from "@ai-sdk/google";
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";

const agent = new Agent(components.agent, {
	name: "Coding Agent",
	languageModel: google(process.env.MODEL_NAME!),
	instructions:
		"You're a helpful coding assistant. Answer the user's question to the best of your ability. Only respond with code snippets. Don't include any explanations or commentary. If you don't know the answer, say 'I don't know'.",
	maxSteps: 3,
});

export default agent;
