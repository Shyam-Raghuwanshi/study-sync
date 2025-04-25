import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveAIInteraction = mutation({
  args: {
    sessionId: v.id("studySessions"),
    userId: v.string(),
    interactionType: v.string(),
    content: v.string(),
    response: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Save the interaction to the aiInteractions table
    return await ctx.db.insert("aiInteractions", {
      sessionId: args.sessionId,
      userId: args.userId,
      //@ts-ignore
      interactionType: args.interactionType,
      timestamp: args.timestamp,
      content: args.content,
      response: args.response,
    });
  },
});