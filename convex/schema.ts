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

  logs: defineTable({
    timestamp: v.number(),
    level: v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error")
    ),
    message: v.string(),
    traceId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    component: v.string(),
    metadata: v.optional(v.any()),
    error: v.optional(v.object({
      message: v.string(),
      stack: v.optional(v.string())
    }))
  })
  .index("by_taskId", ["taskId"])
  .index("by_traceId", ["traceId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_level", ["level"])
});
