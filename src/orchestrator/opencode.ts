import {
	createOpencodeClient,
	createOpencodeServer,
	OpencodeClient,
} from "@opencode-ai/sdk";
import { Logger, logger } from "./logger";

export interface OpencodeInit {
	client: OpencodeClient;
	server: {
		url: string;
		close(): void;
	};
}

async function initOpencode(parentLogger?: Logger): Promise<OpencodeInit> {
	const logger = parentLogger?.child({ component: "opencode" }) || console;

	const logInfo = (msg: string, meta?: any) => {
		if (logger instanceof Logger) {
			logger.info(meta || {}, msg);
		} else {
			console.log(msg);
		}
	};

	logInfo("Starting local server...");
	const startTime = Date.now();
	const server = await createOpencodeServer();
	const startupTime = Date.now() - startTime;

	const baseUrl = server.url.replace("127.0.0.1", "localhost");
	logInfo(`Server running at: ${baseUrl}`, {
		startupTime,
		port: baseUrl.split(":")[2],
	});

	const username = process.env.OPENCODE_SERVER_USERNAME!;
	const password = process.env.OPENCODE_SERVER_PASSWORD!;
	const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

	logInfo(`Applying Basic Auth`, { username, authEnabled: true });

	const client = createOpencodeClient({
		baseUrl,
		directory: process.cwd(),
		headers: {
			Authorization: authHeader,
		},
	});

	logInfo(`Session running for ${process.cwd()}`);

	return { client, server: { ...server, url: baseUrl } };
}

let opencodeInstance: OpencodeInit | null = null;

async function getOpencode() {
	if (!opencodeInstance) {
		logger.info(
			{ component: "opencode" },
			"Initializing OpenCode for the first time...",
		);
		return await initOpencode();
	}

	return opencodeInstance;
}

export const { client, server } = await getOpencode();
