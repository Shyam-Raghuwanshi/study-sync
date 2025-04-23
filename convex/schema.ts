import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    attachments: v.optional(v.array(v.string())),
    content: v.string(),
    isAIGenerated: v.boolean(),
    sessionId: v.id("studySessions"),
    timestamp: v.float64(),
    userId: v.string(),
  }).index("by_session", ["sessionId"]),
  problems: defineTable({
    attempts: v.record(
      v.string(),
      v.object({
        attempts: v.float64(),
        lastAttempt: v.float64(),
        solved: v.boolean(),
      })
    ),
    content: v.string(),
    difficulty: v.float64(),
    generatedBy: v.union(v.string(), v.literal("AI")),
    sessionId: v.id("studySessions"),
    solution: v.string(),
    tags: v.array(v.string()),
  }).index("by_session", ["sessionId"]),
  progress: defineTable({
    groupId: v.id("studyGroups"),
    lastUpdated: v.float64(),
    problemsSolved: v.float64(),
    subject: v.string(),
    timeSpent: v.float64(),
    topics: v.record(v.string(), v.float64()),
    userId: v.string(),
    weakAreas: v.array(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"]),
  studyGroups: defineTable({
    createdAt: v.float64(),
    createdBy: v.string(),
    description: v.string(),
    isPublic: v.boolean(),
    lastActive: v.float64(),
    members: v.array(v.string()),
    name: v.string(),
    subject: v.string(),
  })
    .index("by_member", ["members"])
    .index("by_subject", ["subject"]),
  studySessions: defineTable({
    description: v.string(),
    endTime: v.optional(v.float64()),
    groupId: v.id("studyGroups"),
    isActive: v.boolean(),
    status: v.string(),
    name: v.string(),
    participants: v.array(v.string()),
    startTime: v.float64(),
    createdBy: v.string(),
  })
    .index("by_active", ["isActive"])
    .index("by_group", ["groupId"]),
  whiteboards: defineTable({
    elements: v.array(v.any()),
    lastUpdated: v.float64(),
    name: v.string(),
    sessionId: v.id("studySessions"),
    snapshots: v.array(v.any()),
  }).index("by_session", ["sessionId"]),
  resources: defineTable({
    name: v.string(),
    storageId: v.id("_storage"),
    createdBy: v.string(),
    groupId: v.id("studyGroups"),
    sessionId: v.optional(v.id("studySessions")),
    type: v.string(),
    description: v.optional(v.string()),
    lastUpdated: v.number(),
    version: v.number(),
    contributorIds: v.array(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_session", ["sessionId"])
    .index("by_creator", ["createdBy"]),
});