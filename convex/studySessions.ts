import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

        // Check if the user is an admin
        const memberRoles = group.memberRoles || {};
        const isAdmin = memberRoles[userId] === "admin" || group.createdBy === userId;
        
        if (!isAdmin) {
            throw new Error("Only group administrators can schedule sessions");
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
        await ctx.db.insert("whiteboards", {
            sessionId: sessionId,
            elements: "[]",
        })

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

// Get participants of a study session
export const getParticipants = query({
    args: {
        sessionId: v.id("studySessions"),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Study session not found");
        }

        // In a real application, you would fetch user details from your auth service
        // For now, we're returning a simplified representation with the data we have
        return session.participants.map(userId => ({
            id: userId,
            name: userId, // Ideally replaced with actual user names from auth service
            active: true, // In a real app, you'd track this with presence
            avatar: '/placeholder.svg'
        }));
    },
});

// Get all upcoming sessions for the current user
export const getUpcomingForUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            //   throw new Error("User not authenticated");
            return []
        }

        const userId = identity.subject;

        // Get all groups the user is a member of
        const userGroups = await ctx.db
            .query("studyGroups")
            .withIndex("by_member", (q) => q.eq("members", userId as any))
            .collect();

        // Get all upcoming sessions for these groups
        const groupIds = userGroups.map(group => group._id);

        if (groupIds.length === 0) {
            return [];
        }

        const sessions = [];

        // For each group, get their sessions
        for (const groupId of groupIds) {
            const groupSessions = await ctx.db
                .query("studySessions")
                .withIndex("by_group", (q) => q.eq("groupId", groupId))
                .filter(q => q.eq(q.field("isActive"), true))
                .collect();

            // Get group information
            const group = userGroups.find(g => g._id === groupId);

            // Add group name to each session
            const sessionsWithGroup = groupSessions.map(session => ({
                ...session,
                groupName: group?.name || "Study Group",
                subject: group?.subject || "General"
            }));

            sessions.push(...sessionsWithGroup);
        }

        // Sort by start time (soonest first)
        return sessions.sort((a, b) => a.startTime - b.startTime);
    }
});

// Delete a study session
export const deleteSession = mutation({
    args: {
        sessionId: v.id("studySessions"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Study session not found");
        }

        // Get the study group to check if user is an admin
        const group = await ctx.db.get(session.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // Check if user is an admin of the group or creator of the session
        const memberRoles = group.memberRoles || {};
        const isAdmin = memberRoles[args.userId] === "admin" || 
                       group.createdBy === args.userId || 
                       session.createdBy === args.userId;
        
        if (!isAdmin) {
            throw new Error("Only group administrators can delete sessions");
        }

        // Session must be completed before it can be deleted
        // if (session.isActive && session.status !== 'completed') {
        //     throw new Error("Cannot delete an active session. End the session first.");
        // }

        // Delete all related resources
        
        // 1. Delete messages associated with the session
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        // 2. Delete whiteboards associated with the session
        const whiteboards = await ctx.db
            .query("whiteboards")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const whiteboard of whiteboards) {
            await ctx.db.delete(whiteboard._id);
        }

        // 3. Delete resources associated with this specific session
        const sessionResources = await ctx.db
            .query("resources")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const resource of sessionResources) {
            await ctx.db.delete(resource._id);
        }

        // 4. Delete any AI interactions associated with the session
        const aiInteractions = await ctx.db
            .query("aiInteractions")
            .withIndex("by_id", (q) => q.eq("_id", args.sessionId as any))
            .collect();

        for (const interaction of aiInteractions) {
            await ctx.db.delete(interaction._id);
        }

        // Finally, delete the session itself
        await ctx.db.delete(args.sessionId);

        return {
            success: true,
            message: "Session and all associated data deleted successfully"
        };
    },
});