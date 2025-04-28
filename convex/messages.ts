import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: {
    sessionId: v.id("studySessions"),
    userId: v.string(),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
    isAIGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Ensure the session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Study session not found");
    }

    // Ensure user is a participant in the session
    if (!session.participants.includes(args.userId) && !args.isAIGenerated) {
      throw new Error("User is not a participant in this session");
    }

    const messageId = await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      userId: args.userId,
      content: args.content,
      timestamp: Date.now(),
      attachments: args.attachments || [],
      isAIGenerated: args.isAIGenerated || false,
    });

    return messageId;
  },
});

// Get messages for a session
export const getBySession = query({
  args: {
    sessionId: v.id("studySessions"),
    limit: v.optional(v.number()),
    beforeTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let query = ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId));

    if (args.beforeTimestamp) {
      query = query.filter((q) => q.lt(q.field("timestamp"), args.beforeTimestamp || 0));
    }

    return await query.order("asc").take(limit);
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    id: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is the message author
    if (message.userId !== args.userId) {
      // If not author, check if user is a participant in the session
      const session = await ctx.db.get(message.sessionId as any);
      if (!session || 'participants' in session && !session.participants.includes(args.userId as any)) {
        throw new Error("Not authorized to delete this message");
      }
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

// Get a specific message by ID
export const getMessageById = query({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update a message
export const update = mutation({
  args: {
    id: v.id("messages"),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);
    if (!message) {
      throw new Error("Message not found");
    }

    // Update the message content
    await ctx.db.patch(args.id, {
      content: args.content,
      ...(args.attachments && { attachments: args.attachments }),
    });

    return true;
  },
});

// Send a message with additional chat features
export const sendMessage = mutation({
  args: {
    sessionId: v.id("studySessions"),
    groupId: v.optional(v.string()),
    content: v.string(),
    type: v.optional(v.string()),
    replyToId: v.optional(v.string()),
    threadId: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ensure the session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Study session not found");
    }

    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;

    // Ensure user is a participant in the session
    if (!session.participants.includes(userId)) {
      throw new Error("User is not a participant in this session");
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      groupId: args.groupId,
      userId: userId,
      content: args.content,
      timestamp: Date.now(),
      type: args.type || "text",
      replyToId: args.replyToId,
      threadId: args.threadId,
      attachmentUrl: args.attachmentUrl,
      attachmentType: args.attachmentType,
      reactions: [],
      isEdited: false,
      isAIGenerated: false,
      attachments: [], // Empty array to match schema requirements
    });

    // Update thread if applicable
    if (args.threadId) {
      const thread = await ctx.db
        .query("chatThreads")
        .filter(q => q.eq(q.field("_id"), args.threadId))
        .first();

      if (thread) {
        await ctx.db.patch(thread._id, {
          lastActivityTimestamp: Date.now()
        });
      }
    }

    return messageId;
  }
});

export const setTypingStatus = mutation({
  args: {
    sessionId: v.id("studySessions"),
    isTyping: v.boolean()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;

    // Ensure the session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Study session not found");
    }

    // Upsert typing status
    const existingStatus = await ctx.db
      .query("chatTyping")
      .filter(q => q.eq(q.field("userId"), userId))
      .filter(q => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    if (existingStatus) {
      await ctx.db.patch(existingStatus._id, {
        isTyping: args.isTyping,
        lastTypingTimestamp: Date.now()
      });
    } else {
      await ctx.db.insert("chatTyping", {
        userId: userId,
        sessionId: args.sessionId,
        isTyping: args.isTyping,
        lastTypingTimestamp: Date.now()
      });
    }

    return true;
  }
});

export const getSessionMessages = query({
  args: {
    sessionId: v.id("studySessions"),
    limit: v.optional(v.number()),
    beforeMessageId: v.optional(v.id("messages"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Ensure the session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Study session not found");
    }

    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .filter(q => q.eq(q.field("threadId"), null)) // Only root messages, not thread replies
      .order("desc");

    if (args.beforeMessageId) {
      const beforeMsg = await ctx.db.get(args.beforeMessageId);
      if (beforeMsg) {
        messagesQuery = messagesQuery.filter(q =>
          q.lt(q.field("timestamp"), beforeMsg.timestamp)
        );
      }
    }

    const limit = args.limit || 50;
    const messages = await messagesQuery.take(limit);

    // Return messages in chronological order
    return messages.reverse();
  }
});

export const getActiveTypers = query({
  args: {
    sessionId: v.id("studySessions")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;

    // Get typing statuses from last 5 seconds
    const fiveSecondsAgo = Date.now() - 5000;
    const typingStatuses = await ctx.db
      .query("chatTyping")
      .filter(q => q.eq(q.field("sessionId"), args.sessionId))
      .filter(q => q.eq(q.field("isTyping"), true))
      .filter(q => q.gt(q.field("lastTypingTimestamp"), fiveSecondsAgo))
      .collect();

    // Filter out current user
    return typingStatuses.filter(status => status.userId !== userId);
  }
});

// Group Chat Functions

// Send a message to a group
export const sendGroupMessage = mutation({
  args: {
    groupId: v.id("studyGroups"),
    content: v.string(),
    type: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;
    const userName = identity.name || "Unknown User";

    // Ensure the group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Study group not found");
    }

    // Ensure user is a member of the group
    if (!group.members.includes(userId)) {
      throw new Error("User is not a member of this group");
      // return false
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      groupId: args.groupId,
      userId: userId,
      userName: userName, // Include the user's name
      content: args.content,
      timestamp: Date.now(),
      type: args.type || "text",
      attachmentUrl: args.attachmentUrl,
      attachmentType: args.attachmentType,
      reactions: [],
      isEdited: false,
      isAIGenerated: false,
      attachments: [], // Empty array to match schema requirements
    });

    return messageId;
  }
});

export const getGroupMessages = query({
  args: {
    groupId: v.id("studyGroups"),
    limit: v.optional(v.number()),
    beforeMessageId: v.optional(v.id("messages"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []
    }

    const userId = identity.subject;

    // Ensure the group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Study group not found");
    }

    // Ensure user is a member of the group
    if (!group.members.includes(userId)) {
      // throw new Error("User is not a member of this group");
      return []
    }

    let messagesQuery = ctx.db
      .query("messages")
      .filter(q => q.eq(q.field("groupId"), args.groupId)) // Convert ID to string
      .filter(q => q.eq(q.field("threadId"), undefined))
      .order("desc");
    
      
      if (args.beforeMessageId) {
        const beforeMsg = await ctx.db.get(args.beforeMessageId);
        if (beforeMsg) {
          messagesQuery = messagesQuery.filter(q =>
            q.lt(q.field("timestamp"), beforeMsg.timestamp)
          );
        }
      }
      
      const limit = args.limit || 50;
      const messages = await messagesQuery.take(limit);

    // Return messages in chronological order
    return messages.reverse();
  }
});

// Set typing status for group chat
export const setGroupTypingStatus = mutation({
  args: {
    groupId: v.id("studyGroups"),
    isTyping: v.boolean()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;

    // Ensure the group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Study group not found");
    }

    // Upsert typing status
    const existingStatus = await ctx.db
      .query("chatTyping")
      .filter(q => q.eq(q.field("userId"), userId))
      .filter(q => q.eq(q.field("groupId"), args.groupId))
      .first();

    if (existingStatus) {
      await ctx.db.patch(existingStatus._id, {
        isTyping: args.isTyping,
        lastTypingTimestamp: Date.now()
      });
    } else {
      await ctx.db.insert("chatTyping", {
        userId: userId,
        groupId: args.groupId,
        isTyping: args.isTyping,
        lastTypingTimestamp: Date.now()
      });
    }

    return true;
  }
});

// Get active typers in a group chat
export const getGroupActiveTypers = query({
  args: {
    groupId: v.id("studyGroups")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;

    // Get typing statuses from last 5 seconds
    const fiveSecondsAgo = Date.now() - 5000;
    const typingStatuses = await ctx.db
      .query("chatTyping")
      .filter(q => q.eq(q.field("groupId"), args.groupId))
      .filter(q => q.eq(q.field("isTyping"), true))
      .filter(q => q.gt(q.field("lastTypingTimestamp"), fiveSecondsAgo))
      .collect();

    // Filter out current user
    return typingStatuses.filter(status => status.userId !== userId);
  }
});

// Pin a message in a group
export const pinGroupMessage = mutation({
  args: {
    messageId: v.id("messages"),
    isPinned: v.boolean()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false
    }

    const userId = identity.subject;

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Ensure message is from the correct group
    if (!message.groupId) throw new Error("Not a group message");

    // Ensure user is a member of the group
    const group: any = await ctx.db.get(message.groupId as any);
    if (!group?.members.includes(userId)) {
      // throw new Error("User is not a member of this group");
      return false
    }

    // Update pinned status
    await ctx.db.patch(args.messageId, {
      // isPinned: args.isPinned

    });

    return true;
  }
});

// React to a group message
export const reactToGroupMessage = mutation({
  args: {
    messageId: v.id("messages"),
    reaction: v.string(),
    add: v.boolean() // true to add reaction, false to remove
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Ensure message has reactions array
    const reactions = message.reactions || [];

    if (args.add) {
      // Add reaction if it doesn't exist for this user
      if (!reactions.some(r => r.userId === userId && r.reaction === args.reaction)) {
        reactions.push({
          userId: userId,
          reaction: args.reaction
        });
      }
    } else {
      // Remove reaction
      const index = reactions.findIndex(r => r.userId === userId && r.reaction === args.reaction);
      if (index !== -1) {
        reactions.splice(index, 1);
      }
    }

    await ctx.db.patch(args.messageId, { reactions });

    return true;
  }
});
