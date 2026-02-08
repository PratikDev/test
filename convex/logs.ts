import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const logEntryValidator = v.object({
	timestamp: v.number(),
	level: v.union(
		v.literal("debug"),
		v.literal("info"),
		v.literal("warn"),
		v.literal("error"),
	),
	message: v.string(),
	traceId: v.optional(v.string()),
	taskId: v.optional(v.id("tasks")),
	component: v.string(),
	metadata: v.optional(v.any()),
	error: v.optional(
		v.object({
			message: v.string(),
			stack: v.optional(v.string()),
		}),
	),
});

export const createLogBatch = mutation({
	args: {
		logs: v.array(logEntryValidator),
	},
	handler: async (ctx, args) => {
		const results = [];
		for (const log of args.logs) {
			const logId = await ctx.db.insert("logs", log);
			results.push(logId);
		}
		return results;
	},
});

export const getRecentLogs = query({
	args: {
		limit: v.optional(v.number()),
		level: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("logs")
			.withIndex("by_timestamp")
			.filter((q) => q.eq(q.field("level"), args.level || q.field("level")))
			.order("desc")
			.take(args.limit || 100);
	},
});

export const getTaskLogs = query({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("logs")
			.withIndex("by_taskId")
			.filter((q) => q.eq(q.field("taskId"), args.taskId))
			.order("asc")
			.collect();
	},
});

export const getErrorLogs = query({
	args: {
		limit: v.optional(v.number()),
		since: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("logs")
			.withIndex("by_level")
			.filter((q) => q.eq(q.field("level"), "error"))
			.filter((q) => q.gte(q.field("timestamp"), args.since || 0))
			.order("desc")
			.take(args.limit || 100);
	},
});
