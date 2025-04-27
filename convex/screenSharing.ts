import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Start screen sharing
export const startSharing = mutation({
  args: {
    sessionId: v.id("studySessions"),
    screenType: v.string(), // "entire_screen", "window", "tab"
    title: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    // Check if the session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Study session not found");
    }

    // Ensure user is a participant in the session
    if (!session.participants.includes(userId)) {
      throw new Error("User is not a participant in this session");
    }

    // Check if someone else is already sharing their screen
    const activeSharing = await ctx.db
      .query("screenSharing")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .filter(q => q.eq(q.field("isActive"), true))
      .first();

    if (activeSharing && activeSharing.userId !== userId) {
      throw new Error("Another user is already sharing their screen");
    }

    // If current user is already sharing, update the existing record
    if (activeSharing && activeSharing.userId === userId) {
      await ctx.db.patch(activeSharing._id, {
        screenType: args.screenType,
        title: args.title,
        startTime: Date.now()
      });
      return activeSharing._id;
    }

    // Create new screen sharing record
    const sharingId = await ctx.db.insert("screenSharing", {
      sessionId: args.sessionId,
      userId: userId,
      isActive: true,
      startTime: Date.now(),
      screenType: args.screenType,
      title: args.title
    });

    // Send a system message notifying about screen sharing
    await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      userId: "System",
      content: `${identity.name || userId} started screen sharing`,
      timestamp: Date.now(),
      isAIGenerated: false,
      attachments: []
    });

    return sharingId;
  }
});

// Stop screen sharing
export const stopSharing = mutation({
  args: {
    sessionId: v.id("studySessions")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    // Find active sharing by this user
    const activeSharing = await ctx.db
      .query("screenSharing")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .filter(q => q.eq(q.field("userId"), userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .first();

    if (!activeSharing) {
      throw new Error("No active screen sharing found for this user");
    }

    // Update the sharing record
    await ctx.db.patch(activeSharing._id, {
      isActive: false,
      endTime: Date.now()
    });

    // Send a system message notifying about screen sharing ended
    await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      userId: "System",
      content: `${identity.name || userId} stopped screen sharing`,
      timestamp: Date.now(),
      isAIGenerated: false,
      attachments: []
    });

    return true;
  }
});

// Get current active screen sharing info for a session
export const getActiveSharing = query({
  args: {
    sessionId: v.id("studySessions")
  },
  handler: async (ctx, args) => {
    // Find active sharing for this session
    const activeSharing = await ctx.db
      .query("screenSharing")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .filter(q => q.eq(q.field("isActive"), true))
      .first();

    return activeSharing;
  }
});

// Send screen sharing signaling data (for WebRTC connection)
export const sendSignal = mutation({
  args: {
    sessionId: v.id("studySessions"),
    toUserId: v.string(),
    type: v.string(), // "offer", "answer", "ice-candidate"
    payload: v.string() // Stringified signal data
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const fromUserId = identity.subject;
    
    // Insert the signal into the database
    // We're reusing the voiceSignaling table since the structure is the same
    // First get the session
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Study session not found");
    }

    // Create a virtual channel ID specifically for screen sharing
    // This avoids conflicts with voice channels
    const screenSharingChannelId = `${args.sessionId}_screen` as Id<"voiceChannels">;
    
    await ctx.db.insert("voiceSignaling", {
      channelId: screenSharingChannelId,
      fromUserId: fromUserId,
      toUserId: args.toUserId,
      type: args.type,
      payload: args.payload,
      timestamp: Date.now()
    });

    return true;
  }
});

// Get signaling data for screen sharing (for WebRTC connection)
export const getSignals = query({
  args: {
    sessionId: v.id("studySessions"),
    after: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    // Create a virtual channel ID specifically for screen sharing
    const screenSharingChannelId = `${args.sessionId}_screen` as Id<"voiceChannels">;
    
    // Get signals directed to this user
    let query = ctx.db
      .query("voiceSignaling")
      .withIndex("by_channel", q => q.eq("channelId", screenSharingChannelId))
      .filter(q => q.eq(q.field("toUserId"), userId));
    
    // Only get signals after a certain timestamp if specified
    // if (args.after) {
    //   query = query.filter(q => q.gt(q.field("timestamp"), args.after));
    // }
    
    const signals = await query.collect();
    
    return signals;
  }
});