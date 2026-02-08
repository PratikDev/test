import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTask = mutation({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    return await ctx.db.insert("tasks", {
      prompt,
      status: "pending",
    });
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(v.string()),
  },
  handler: async (ctx, { taskId, status, result }) => {
    await ctx.db.patch(taskId, { status, result });
  },
});

export const addStep = mutation({
  args: {
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("info"),
      v.literal("tool_call"),
      v.literal("tool_result"),
      v.literal("final")
    ),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, { taskId, type, message, data }) => {
    await ctx.db.insert("taskSteps", {
      taskId,
      type,
      message,
      data,
      timestamp: Date.now(),
    });
  },
});

export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId);
    if (!task) return null;

    const steps = await ctx.db
      .query("taskSteps")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .order("asc")
      .collect();

    return { ...task, steps };
  },
});

export const getPendingTask = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .first();
  },
});

export const listTasks = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db.query("tasks").order("desc").take(limit);
  },
});

export const clearAllTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    for (const t of tasks) {
      await ctx.db.delete(t._id);
    }
    const steps = await ctx.db.query("taskSteps").collect();
    for (const s of steps) {
      await ctx.db.delete(s._id);
    }
  },
});
