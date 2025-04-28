import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    attachments: v.optional(v.array(v.string())),
    content: v.string(),
    isAIGenerated: v.boolean(),
    sessionId: v.optional(v.id("studySessions")),
    timestamp: v.float64(),
    userId: v.string(),
    userName: v.optional(v.string()), // Add userName field
    groupId: v.optional(v.string()),
    type: v.optional(v.string()), // "text", "image", "file", "code", "ai-response"
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    replyToId: v.optional(v.string()),
    reactions: v.optional(v.array(v.object({
      userId: v.string(),
      reaction: v.string()
    }))),
    isEdited: v.optional(v.boolean()),
    threadId: v.optional(v.string()) // For threaded conversations
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
    createdByName: v.string(), // Add the name of the creator
    description: v.string(),
    isPublic: v.boolean(),
    lastActive: v.float64(),
    members: v.array(v.string()),
    memberRoles: v.record(v.string(), v.union(v.literal("admin"), v.literal("member"))),
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
    sessionId: v.id("studySessions"),
    elements: v.any(),
  })
    .index("by_session", ["sessionId"]),
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
  aiInteractions: defineTable({
    sessionId: v.id("studySessions"),
    userId: v.string(),
    interactionType: v.union(v.literal("problemGeneration"), v.literal("feedback"), v.literal("progressAnalysis"), v.literal("conceptExplanation"), v.literal("ask")),
    timestamp: v.number(),
    content: v.string(),
    response: v.string(),
  }),

  // Only adding the thread and typing tables from the chat schema
  chatThreads: defineTable({
    parentMessageId: v.string(),
    sessionId: v.string(),
    title: v.optional(v.string()),
    participantIds: v.array(v.string()),
    lastActivityTimestamp: v.number()
  }),

  chatTyping: defineTable({
    userId: v.string(),
    sessionId: v.optional(v.string()),
    groupId: v.optional(v.id("studyGroups")),
    isTyping: v.boolean(),
    lastTypingTimestamp: v.number()
  }).index("by_session", ["sessionId"]).index("by_group", ["groupId"]),

  // Voice-related tables
  voiceChannels: defineTable({
    sessionId: v.id("studySessions"),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    createdBy: v.string()
  }).index("by_session", ["sessionId"]),

  voiceParticipants: defineTable({
    channelId: v.id("voiceChannels"),
    userId: v.string(),
    joinedAt: v.number(),
    isMuted: v.boolean(),
    isDeafened: v.boolean(),
    isSpeaking: v.boolean(),
    lastActiveTimestamp: v.number(),
    deviceInfo: v.object({
      hasMicrophone: v.boolean(),
      hasCamera: v.boolean(),
      hasAudioOutput: v.boolean()
    })
  }).index("by_channel", ["channelId"]).index("by_user", ["userId"]),

  voiceSignaling: defineTable({
    channelId: v.id("voiceChannels"),
    fromUserId: v.string(),
    toUserId: v.string(),
    type: v.string(), // "offer", "answer", "ice-candidate"
    payload: v.string(), // JSON stringified signal data
    timestamp: v.number()
  }).index("by_channel", ["channelId"]),

  // Screen sharing table
  screenSharing: defineTable({
    sessionId: v.id("studySessions"),
    userId: v.string(), // User who is sharing their screen
    isActive: v.boolean(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    screenType: v.string(), // "entire_screen", "window", "tab"
    title: v.optional(v.string()) // Title/name of what's being shared
  }).index("by_session", ["sessionId"]).index("by_user", ["userId"]),
  rooms: defineTable({
    name: v.string(),
    hostId: v.string(),
    hostName: v.optional(v.string()), // Add optional hostName field
    participants: v.array(v.string()),
    isActive: v.boolean(),
    sessionId: v.id("studySessions"),
    creationTime: v.number(),
    type: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),
  participants: defineTable({
    userId: v.string(),
    roomId: v.id("rooms"),
    isHost: v.boolean(),
    hasCamera: v.boolean(),
    hasMic: v.boolean(),
  }).index("by_room", ["roomId"]),
  
  // Notifications table
  notifications: defineTable({
    userId: v.string(),
    sessionId: v.optional(v.id("studySessions")),
    groupId: v.optional(v.id("studyGroups")),
    type: v.string(), // "session_reminder", "group_update", "resource_added", etc.
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    isEmailSent: v.boolean(),
    createdAt: v.number(),
    metadata: v.optional(v.object({
      sessionStartTime: v.optional(v.number()),
      resourceId: v.optional(v.string()),
      actorId: v.optional(v.string()),
      actorName: v.optional(v.string()),
      userEmail: v.optional(v.string()), // Added userEmail field for email notifications
    })),
  })
    .index("by_user", ["userId"])
    .index("by_read_status", ["userId", "isRead"])
    .index("by_session", ["sessionId"])
    .index("by_group", ["groupId"]),
    
  // User notification preferences
  notificationPreferences: defineTable({
    userId: v.string(),
    emailNotifications: v.boolean(),
    webNotifications: v.boolean(),
    sessionReminders: v.boolean(),
    groupUpdates: v.boolean(),
    resourceAdditions: v.boolean(),
    lastUpdated: v.number(),
  }).index("by_user", ["userId"]),
});