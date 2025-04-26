import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new voice channel for a study session
export const createChannel = mutation({
  args: {
    sessionId: v.id("studySessions"),
    name: v.string(),
    description: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    return ctx.db.insert("voiceChannels", {
      sessionId: args.sessionId,
      name: args.name,
      description: args.description,
      isActive: true,
      createdAt: Date.now(),
      createdBy: userId
    });
  }
});

// Get all voice channels for a session
export const listChannelsBySession = query({
  args: { 
    sessionId: v.id("studySessions") 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceChannels")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .collect();
  }
});

// Join a voice channel
export const joinChannel = mutation({
  args: {
    channelId: v.id("voiceChannels"),
    deviceInfo: v.object({
      hasMicrophone: v.boolean(),
      hasCamera: v.boolean(),
      hasAudioOutput: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    const now = Date.now();
    
    // Check if user is already in the channel
    const existingParticipant = await ctx.db
      .query("voiceParticipants")
      .withIndex("by_channel", q => q.eq("channelId", args.channelId))
      .filter(q => q.eq(q.field("userId"), userId))
      .first();
      
    if (existingParticipant) {
      return ctx.db.patch(existingParticipant._id, {
        lastActiveTimestamp: now,
        deviceInfo: args.deviceInfo
      });
    }
    
    // Add user as new participant
    return ctx.db.insert("voiceParticipants", {
      channelId: args.channelId,
      userId,
      joinedAt: now,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
      lastActiveTimestamp: now,
      deviceInfo: args.deviceInfo
    });
  }
});

// Leave a voice channel
export const leaveChannel = mutation({
  args: {
    channelId: v.id("voiceChannels")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    const participant = await ctx.db
      .query("voiceParticipants")
      .withIndex("by_channel", q => q.eq("channelId", args.channelId))
      .filter(q => q.eq(q.field("userId"), userId))
      .first();
      
    if (participant) {
      return ctx.db.delete(participant._id);
    }
  }
});

// Get all participants in a voice channel
export const getChannelParticipants = query({
  args: {
    channelId: v.id("voiceChannels")
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceParticipants")
      .withIndex("by_channel", q => q.eq("channelId", args.channelId))
      .collect();
  }
});

// Update user's voice states (mute, deafen, speaking)
export const updateParticipantState = mutation({
  args: {
    channelId: v.id("voiceChannels"),
    isMuted: v.optional(v.boolean()),
    isDeafened: v.optional(v.boolean()),
    isSpeaking: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    const participant = await ctx.db
      .query("voiceParticipants")
      .withIndex("by_channel", q => q.eq("channelId", args.channelId))
      .filter(q => q.eq(q.field("userId"), userId))
      .first();
      
    if (!participant) {
      throw new Error("Not a participant in this channel");
    }
    
    const updates: any = { lastActiveTimestamp: Date.now() };
    
    if (args.isMuted !== undefined) updates.isMuted = args.isMuted;
    if (args.isDeafened !== undefined) updates.isDeafened = args.isDeafened;
    if (args.isSpeaking !== undefined) updates.isSpeaking = args.isSpeaking;
    
    return ctx.db.patch(participant._id, updates);
  }
});

// Send WebRTC signaling data
export const sendSignal = mutation({
  args: {
    channelId: v.id("voiceChannels"),
    toUserId: v.string(),
    type: v.string(),
    payload: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const fromUserId = identity.subject;
    
    return ctx.db.insert("voiceSignaling", {
      channelId: args.channelId,
      fromUserId,
      toUserId: args.toUserId,
      type: args.type,
      payload: args.payload,
      timestamp: Date.now()
    });
  }
});

// Get signaling data addressed to the current user
export const getSignals = query({
  args: {
    channelId: v.id("voiceChannels"),
    after: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    let query = ctx.db
      .query("voiceSignaling")
      .withIndex("by_channel", q => q.eq("channelId", args.channelId))
      .filter(q => q.eq(q.field("toUserId"), userId));
      
    if (args.after !== undefined) {
      query = query.filter(q => q.gt(q.field("timestamp"), args.after as any));
    }
    
    return await query.collect();
  }
});

// Close a voice channel
export const closeChannel = mutation({
  args: {
    channelId: v.id("voiceChannels")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    
    if (channel.createdBy !== userId) {
      throw new Error("Only the creator can close the channel");
    }
    
    // Mark channel as inactive
    await ctx.db.patch(args.channelId, { isActive: false });
    
    // Remove all participants
    const participants = await ctx.db
      .query("voiceParticipants")
      .withIndex("by_channel", q => q.eq("channelId", args.channelId))
      .collect();
      
    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }
    
    return { success: true };
  }
});