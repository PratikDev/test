import { v } from "convex/values";

// Tool definition schema for Convex validators
export const toolSchema = {
	name: v.string(),
	description: v.string(),
	category: v.string(),
	parameters: v.any(), // JSON Schema for tool parameters
	implementation: v.string(), // Code or reference
};

// TypeScript interface for type safety
export interface Tool {
	name: string;
	description: string;
	category: string;
	parameters: Record<string, unknown>;
	implementation: string;
}

// Tool categories
export const TOOL_CATEGORIES = {
	FILESYSTEM: "filesystem",
	CODE: "code",
	SHELL: "shell",
	WEB: "web",
} as const;
