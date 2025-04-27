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
  },
  handler: async (ctx, args) => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;
    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      hostId: userId,
      participants: [userId],
      isActive: true,
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

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

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
  },
});

export const listRooms = query({
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    return Promise.all(
      rooms.map(async (room) => {
        const host = await ctx.db.get(room.hostId as any) as any;
        return {
          ...room,
          hostName: host?.name ?? "Unknown",
        };
      })
    );
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
