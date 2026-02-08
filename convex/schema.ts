import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    prompt: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(v.string()),
  }).index("by_status", ["status"]),

  taskSteps: defineTable({
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("info"),
      v.literal("tool_call"),
      v.literal("tool_result"),
      v.literal("final")
    ),
    message: v.string(),
    data: v.optional(v.any()), // Can store tool arguments or results
    timestamp: v.number(),
  }).index("by_taskId", ["taskId"]),
});
