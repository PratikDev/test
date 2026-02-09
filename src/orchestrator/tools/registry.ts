import { OpencodeClient } from "@opencode-ai/sdk";
import { JsonValue } from "../tools";

type ToolExecutor = (
	client: OpencodeClient,
	args: Record<string, JsonValue>,
	sessionId: string,
) => Promise<{ data: any }>;

const toolRegistry = new Map<string, ToolExecutor>();

toolRegistry.set("opencode:readFile", async (client, args) => {
	return await client.file.read({
		query: { path: String(args.path) },
	});
});

toolRegistry.set("opencode:runCommand", async (client, args, sessionId) => {
	const result = await client.session.shell({
		path: { id: sessionId },
		body: {
			agent: "orchestrator",
			command: String(args.command),
		},
	});

	console.log({ result });

	return result;
});

toolRegistry.set("opencode:searchCode", async (client, args) => {
	return await client.find.text({
		query: { pattern: String(args.pattern) },
	});
});

toolRegistry.set("opencode:listDirectory", async (client, args) => {
	return await client.file.list({
		query: { path: String(args.path || ".") },
	});
});

export { toolRegistry };
