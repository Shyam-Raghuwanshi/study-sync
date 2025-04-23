import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { useId } from "react";

// Create a new study session
export const create = mutation({
    args: {
        groupId: v.id("studyGroups"),
        name: v.string(),
        description: v.string(),
        startTime: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Ensure the group exists
        const user = await ctx.auth.getUserIdentity()
        if (!user) {
            throw new Error("User not authenticated");
        }
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        const userId = user.subject;
        // Ensure user is a member of the group
        if (!group.members.includes(userId)) {
            throw new Error("User is not a member of this group");
        }

        const startTime = args.startTime || Date.now();
        const currentTime = Date.now();

        // Validate that startTime is in the future for scheduled sessions
        if (startTime < currentTime) {
            throw new Error("Session start time must be in the future");
        }

        const sessionId = await ctx.db.insert("studySessions", {
            groupId: args.groupId,
            name: args.name,
            description: args.description,
            startTime,
            isActive: true,
            status: startTime > currentTime ? 'upcoming' : 'active',
            participants: [userId],
            createdBy: userId,
        });

        // Update group's last active timestamp
        await ctx.db.patch(args.groupId, {
            lastActive: currentTime,
        });

        return sessionId;
    },
});

// Get all study sessions for a group
export const getByGroup = query({
    args: {
        groupId: v.id("studyGroups"),
        includeInactive: v.optional(v.boolean()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query("studySessions")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId));

        if (!args.includeInactive) {
            query = query.filter((q) => q.eq(q.field("isActive"), true));
        }

        if (args.status) {
            query = query.filter((q) => q.eq(q.field("status"), args.status));
        }

        const sessions = await query.collect();

        // Update status of upcoming sessions if their start time has passed
        const currentTime = Date.now();
        const updatedSessions = [];

        for (const session of sessions) {
            if (session.status === 'upcoming' && session.startTime <= currentTime) {
                //@ts-ignore
                await ctx.db.patch(session._id, { status: 'active' });
                updatedSessions.push({ ...session, status: 'active' });
            } else {
                updatedSessions.push(session);
            }
        }

        return updatedSessions;
    },
});

// Get a specific study session by ID
export const getById = query({
    args: { id: v.id("studySessions") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Join a study session
export const joinSession = mutation({
    args: {
        sessionId: v.id("studySessions"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Study session not found");
        }

        if (!session.isActive) {
            throw new Error("Cannot join an inactive session");
        }

        // Check if the session's start time has passed for upcoming sessions
        if (session.status === 'upcoming' && session.startTime > Date.now()) {
            throw new Error("This session hasn't started yet");
        }

        // Check if user is already a participant
        if (session.participants.includes(args.userId)) {
            return args.sessionId;
        }

        // Add the user to the participants array
        await ctx.db.patch(args.sessionId, {
            participants: [...session.participants, args.userId],
        });

        return args.sessionId;
    },
});

// End a study session
export const endSession = mutation({
    args: {
        sessionId: v.id("studySessions"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Study session not found");
        }

        if (!session.participants.includes(args.userId)) {
            throw new Error("Only participants can end the session");
        }

        await ctx.db.patch(args.sessionId, {
            isActive: false,
            status: 'completed',
            endTime: Date.now(),
        });

        return args.sessionId;
    },
});

// Get a study session by ID
export const get = query({
  args: {
    id: v.id("studySessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Study session not found");
    }

    // Get the group name
    const group = await ctx.db.get(session.groupId);
    
    return {
      ...session,
      groupName: group?.name || "Unknown Group",
      // Map participants to include active status
      participants: session.participants.map(userId => ({
        id: userId,
        name: userId, // In a real app, you'd get user details from your auth service
        active: true, // In a real app, you'd track this with presence
        avatar: '/placeholder.svg'
      }))
    };
  },
});