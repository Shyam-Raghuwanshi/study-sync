import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

export const getRoom = internalQuery({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

export const createRoom = mutation({
  args: {
    name: v.string(),
    sessionId: v.id("studySessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    
    // Check if the user is a participant in the session
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Study session not found");
    
    if (!session.participants.includes(userId)) {
      throw new Error("You are not a participant in this study session");
    }

    // Get host name from identity
    const hostName = identity.name || "Unknown";

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      hostId: userId,
      hostName, // Store host name directly in the room document
      participants: [userId],
      isActive: true,
      sessionId: args.sessionId,
      creationTime: Date.now(),
    });

    await ctx.db.insert("participants", {
      userId,
      roomId,
      isHost: true,
      hasCamera: true,
      hasMic: true,
    });

    return roomId;
  },
});

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room || !room.isActive) throw new Error("Room not found");

    // Check if the user is a participant in the session
    const session = await ctx.db.get(room.sessionId);
    if (!session) throw new Error("Study session not found");
    
    if (!session.participants.includes(userId)) {
      throw new Error("You are not a participant in this study session");
    }
    
    await ctx.db.patch(args.roomId, {
      participants: [...room.participants, userId],
    });

    await ctx.db.insert("participants", {
      userId,
      roomId: args.roomId,
      isHost: false,
      hasCamera: true,
      hasMic: true,
    });

    return room.name;
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;
    const room = await ctx.db.get(args.roomId);
    if (!room) return;

    await ctx.db.patch(args.roomId, {
      participants: room.participants.filter(id => id !== userId),
    });

    const participantQuery = await ctx.db
      .query("participants")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .filter(q => q.eq(q.field("userId"), userId))
      .unique();

    if (participantQuery) {
      await ctx.db.delete(participantQuery._id);
    }

    if (room.hostId === userId) {
      await ctx.db.patch(args.roomId, {
        isActive: false,
      });
    }

    // If no participants left, mark room as inactive
    if (room.participants.length <= 1) {
      await ctx.db.patch(args.roomId, {
        isActive: false,
      });
    }
  },
});

export const listRooms = query({
  args: {
    sessionId: v.id("studySessions"),
  },
  handler: async (ctx, args) => {
    // Get rooms for the specific session
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Return rooms with additional info but handle hostIds as strings (from auth)
    return rooms.map((room) => {
      return {
        ...room,
        hostName: room.hostName || "Unknown", // Use existing hostName or default
        participantsCount: room.participants.length,
      };
    });
  },
});

export const getRoomParticipants = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .collect();

    return Promise.all(
      participants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId as any) as any;
        return {
          ...participant,
          name: user?.name ?? "Unknown",
          avatar: user?.pictureUrl ?? null,
        };
      })
    );
  },
});

export const toggleCamera = mutation({
  args: {
    roomId: v.id("rooms"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .filter(q => q.eq(q.field("userId"), userId))
      .unique();

    if (participant) {
      await ctx.db.patch(participant._id, {
        hasCamera: args.enabled,
      });
    }
  },
});

export const toggleMic = mutation({
  args: {
    roomId: v.id("rooms"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .filter(q => q.eq(q.field("userId"), userId))
      .unique();

    if (participant) {
      await ctx.db.patch(participant._id, {
        hasMic: args.enabled,
      });
    }
  },
});
