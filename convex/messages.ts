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
        userId: v.string(), // The user deleting the message
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.id);
        if (!message) {
            throw new Error("Message not found");
        }

        // Check if user is the message author
        if (message.userId !== args.userId) {
            // If not author, check if user is a participant in the session
            const session = await ctx.db.get(message.sessionId);
            if (!session || !session.participants.includes(args.userId)) {
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
