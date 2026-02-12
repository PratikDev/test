import { Infer, v } from "convex/values";

// Tool definition schema for Convex validators
export const ToolSchema = v.object({
	name: v.string(),
	description: v.string(),
	type: v.union(v.literal("query"), v.literal("action"), v.literal("mutation")),
	parameters: v.any(), // JSON Schema for tool parameters
	implementation: v.string(), // Code or reference
});
export type ToolSchema = Infer<typeof ToolSchema>;

// TypeScript interface for type safety
export interface Tool extends Omit<ToolSchema, "implementation"> {
	implementation: `convex:tools/registry/${string}:${string}`;
}
