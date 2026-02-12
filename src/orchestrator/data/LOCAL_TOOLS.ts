import { tool, Tool } from "ai";
import z from "zod";

import { client } from "@/orchestrator/opencode";
import { StatusAwareResponse } from "@/types";

type ToolCollection = Record<string, Tool<any, StatusAwareResponse>>;

export const LOCAL_TOOLS: ToolCollection = {
	read_file: tool({
		description:
			"Read the contents of a file from the filesystem. Returns the file content as a string.",
		inputSchema: z.object({
			path: z.string().describe("Absolute path to the file to read"),
		}),
		execute: async ({ path }) => {
			const result = await client.file.read({
				query: { path: String(path) },
			});
			if (result.error) {
				return {
					success: false,
					message: `File read failed: ${result.error || "Unknown error"}`,
				};
			}

			return {
				success: true,
				data: result.data,
			};
		},
	}),
	list_directory: tool({
		description:
			"List all files and subdirectories in a directory. Returns names and types of entries.",
		inputSchema: z.object({
			path: z.string().describe("Absolute path to the directory").optional(),
		}),
		execute: async ({ path }) => {
			const result = await client.file.list({
				query: { path: String(path || ".") },
			});
			if (result.error) {
				return {
					success: false,
					message: `Directory listing failed: ${result.error || "Unknown error"}`,
				};
			}

			return {
				success: true,
				data: result.data,
			};
		},
	}),
	search_code: tool({
		description:
			"Search for patterns in code files using grep or ripgrep. Useful for finding functions, classes, or text.",
		inputSchema: z.object({
			pattern: z.string().describe("Search pattern (regex)"),
			directory: z.string().describe("Directory to search within").optional(),
		}),
		execute: async ({ pattern, directory }) => {
			const result = await client.find.text({
				query: {
					pattern: String(pattern),
					directory: String(directory || "."),
				},
			});
			if (result.error) {
				return {
					success: false,
					message: `Code search failed: ${result.error || "Unknown error"}`,
				};
			}

			return {
				success: true,
				data: result.data,
			};
		},
	}),
	run_command: tool({
		description:
			"Execute a shell command and return the output. Use for running scripts, git commands, etc.",
		inputSchema: z.object({
			sessionId: z
				.string()
				.describe("Session ID for command execution context"),
			command: z.string().describe("Shell command to execute"),
		}),
		execute: async ({ sessionId, command }) => {
			const result = await client.session.shell({
				path: { id: sessionId },
				body: {
					agent: "orchestrator",
					command: String(command),
				},
			});
			if (result.error) {
				return {
					success: false,
					message: `Command execution failed: ${result.error.data || "Unknown error"}`,
				};
			}

			return {
				success: true,
				data: result.data,
			};
		},
	}),
};
