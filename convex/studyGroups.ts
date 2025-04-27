import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new study group
export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        subject: v.string(),
        isPublic: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }
        const userId = identity.subject;
        const userName = identity.name || "Unknown User";

        // Create a memberRoles map with the creator as admin
        const memberRoles: Record<string, string> = {};
        memberRoles[userId] = "admin";

        const studyGroupId = await ctx.db.insert("studyGroups", {
            name: args.name,
            description: args.description,
            subject: args.subject,
            createdBy: userId,
            createdByName: userName,
            members: [userId],
            memberRoles: memberRoles as any,
            isPublic: args.isPublic,
            createdAt: Date.now(),
            lastActive: Date.now(),
        });

        return studyGroupId;
    },
});

// Get all study groups (with optional filtering)
export const getAll = query({
    args: {
        subject: v.optional(v.string()),
        onlyPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            // throw new Error("User not authenticated");
            return [];
        }
        let query: any = ctx.db.query("studyGroups");
        const userId = identity.subject;
        if (args.subject) {
            query = query.withIndex("by_subject", (q: any) => q.eq("subject", args.subject),);
        }

        // if (userId) {
        //     query = query.withIndex("by_member", (q) => q.eq("members", userId));
        // }

        if (args.onlyPublic) {
            query = query.filter((q: any) => q.eq(q.field("isPublic"), true));
        }
        const groups = await query.collect();
        return groups
    },
});

// // Get a specific study group by ID
export const getById = query({
    args: { id: v.id("studyGroups") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// // Update a study group
// export const update = mutation({
//     args: {
//         id: v.id("studyGroups"),
//         name: v.optional(v.string()),
//         description: v.optional(v.string()),
//         subject: v.optional(v.string()),
//         isPublic: v.optional(v.boolean()),
//     },
//     handler: async (ctx, args) => {
//         const { id, ...updates } = args;

//         const existingGroup = await ctx.db.get(id);
//         if (!existingGroup) {
//             throw new Error("Study group not found");
//         }

//         await ctx.db.patch(id, {
//             ...updates,
//             lastActive: Date.now(),
//         });

//         return id;
//     },
// });

// Join a study group
export const joinGroup = mutation({
    args: {
        groupId: v.id("studyGroups"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }
        const userId = identity.subject;
        const userName = identity.name || "Unknown User";
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            return args.groupId;
        }

        // Initialize memberRoles if it doesn't exist
        const memberRoles = group.memberRoles || {};
        // Add the user with member role
        memberRoles[userId] = "member";

        // Add the user to the members array
        await ctx.db.patch(args.groupId, {
            members: [...group.members, userId],
            memberRoles,
            lastActive: Date.now(),
        });

        return args.groupId;
    },
});

// // Leave a study group
export const leaveGroup = mutation({
    args: {
        groupId: v.id("studyGroups"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // Remove the user from the members array
        await ctx.db.patch(args.groupId, {
            members: group.members.filter((id) => id !== args.userId),
            lastActive: Date.now(),
        });

        return args.groupId;
    },
});

// // Delete a study group
export const deleteGroup = mutation({
    args: {
        id: v.id("studyGroups"),
        userId: v.string(), // To verify the user is the creator
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.id);
        if (!group) {
            throw new Error("Study group not found");
        }

        if (group.createdBy !== args.userId) {
            throw new Error("Only the creator can delete the group");
        }

        // First, find and delete all related records

        // 1. Find all study sessions for this group
        const sessions = await ctx.db
            .query("studySessions")
            .withIndex("by_group", (q) => q.eq("groupId", args.id))
            .collect();

        // 2. For each session, delete all related records
        for (const session of sessions) {
            // Delete messages
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            for (const message of messages) {
                await ctx.db.delete(message._id);
            }

            // Delete whiteboards
            const whiteboards = await ctx.db
                .query("whiteboards")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            for (const whiteboard of whiteboards) {
                await ctx.db.delete(whiteboard._id);
            }

            // Delete problems
            const problems = await ctx.db
                .query("problems")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            for (const problem of problems) {
                await ctx.db.delete(problem._id);
            }

            // Delete documents linked to this session
            const sessionDocs = await ctx.db
                .query("resources")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            for (const doc of sessionDocs) {
                await ctx.db.delete(doc._id);
            }

            // Finally delete the session
            await ctx.db.delete(session._id);
        }

        // 3. Delete documents linked to this group
        const groupDocs = await ctx.db
            .query("resources")
            .withIndex("by_group", (q) => q.eq("groupId", args.id))
            .collect();

        for (const doc of groupDocs) {
            await ctx.db.delete(doc._id);
        }

        // 4. Delete progress records
        const progressRecords = await ctx.db
            .query("progress")
            .withIndex("by_group", (q) => q.eq("groupId", args.id))
            .collect();

        for (const progress of progressRecords) {
            await ctx.db.delete(progress._id);
        }

        // Finally, delete the group itself
        await ctx.db.delete(args.id);

        return true;
    },
});

// // Get recent activity for a study group
export const getRecentActivity = query({
    args: {
        groupId: v.id("studyGroups"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;

        // Get recent sessions
        const recentSessions = await ctx.db
            .query("studySessions")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .order("desc")
            .take(limit);

        // Get recent documents
        const recentDocs = await ctx.db
            .query("resources")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .order("desc")
            .take(limit);

        return {
            sessions: recentSessions,
            documents: recentDocs,
        };
    },
});

// Get sessions for a specific group
export const getGroupSessions = query({
    args: { groupId: v.id("studyGroups") },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query("studySessions")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect();
        return sessions;
    },
});

// Get members details for a group
export const getGroupMembers = query({
    args: { groupId: v.id("studyGroups") },
    handler: async (ctx, args) => {
        // Get the study group
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // Check if your schema has a users table
        // If there's no users table in your schema, you'll need to add one
        // For now, we'll just return the member IDs
        return group.members;

        /* If you have a users table, you would do something like:
        const memberPromises = group.members.map(async (memberId) => {
          const user = await ctx.db
            .query("users")  // Assuming you have a users table
            .withIndex("by_id", (q) => q.eq("_id", memberId))
            .first();
          return user;
        });
    
        return await Promise.all(memberPromises);
        */
    },
});

// Get resources for a group
export const getGroupResources = query({
    args: { groupId: v.id("studyGroups") },
    handler: async (ctx, args) => {
        const resources = await ctx.db
            .query("resources")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect();
        return resources;
    },
});

// Search for study groups by name
export const searchByName = query({
    args: {
        searchTerm: v.string(),
        onlyPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }

        let query = ctx.db.query("studyGroups");

        // Filter by public status if requested
        if (args.onlyPublic) {
            query = query.filter((q) => q.eq(q.field("isPublic"), true));
        }

        // Get all groups then filter by name (Convex doesn't support text search directly in query)
        const allGroups = await query.collect();

        // Filter groups whose names include the search term (case insensitive)
        const searchTermLower = args.searchTerm.toLowerCase();
        const filteredGroups = allGroups.filter(group =>
            group.name.toLowerCase().includes(searchTermLower)
        );

        return filteredGroups;
    },
});

// Get user role in group
export const getUserRole = query({
    args: {
        groupId: v.id("studyGroups"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            // throw new Error("User not authenticated");
            return null;
        }

        // Use provided userId or current user's id
        const userId = identity.subject;

        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // If memberRoles doesn't exist or user not in roles, check if they're the creator
        if (!group.memberRoles || !group.memberRoles[userId as any]) {
            // If user is creator but no role, they are an admin
            if (group.createdBy === userId) {
                return "admin";
            }

            // If user is member but no role, they are a member
            if (group.members.includes(userId)) {
                return "member";
            }

            return null; // Not a member
        }

        return group.memberRoles[userId];
    },
});

// Make user an admin
export const makeAdmin = mutation({
    args: {
        groupId: v.id("studyGroups"),
        targetUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }
        const userId = identity.subject;

        // Get the group
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // Initialize memberRoles if it doesn't exist
        const memberRoles = group.memberRoles || {};

        // Check if current user is admin
        if (memberRoles[userId] !== "admin" && group.createdBy !== userId) {
            throw new Error("Only admins can make other users admins");
        }

        // Check if target user is a member
        if (!group.members.includes(args.targetUserId)) {
            throw new Error("Target user is not a member of this group");
        }

        // Update role to admin
        memberRoles[args.targetUserId] = "admin";

        // Update the group
        await ctx.db.patch(args.groupId, {
            memberRoles,
            lastActive: Date.now(),
        });

        return args.groupId;
    },
});

// Remove admin status
export const removeAdmin = mutation({
    args: {
        groupId: v.id("studyGroups"),
        targetUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }
        const userId = identity.subject;

        // Get the group
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // Initialize memberRoles if it doesn't exist
        const memberRoles = group.memberRoles || {};

        // Check if current user is admin
        if (memberRoles[userId] !== "admin" && group.createdBy !== userId) {
            throw new Error("Only admins can change roles");
        }

        // Cannot demote the creator
        if (group.createdBy === args.targetUserId) {
            throw new Error("Cannot remove admin status from the group creator");
        }

        // Update role to member
        memberRoles[args.targetUserId] = "member";

        // Update the group
        await ctx.db.patch(args.groupId, {
            memberRoles,
            lastActive: Date.now(),
        });

        return args.groupId;
    },
});

// Get members details with roles for a group
export const getGroupMembersWithRoles = query({
    args: { groupId: v.id("studyGroups") },
    handler: async (ctx, args) => {
        // Get the study group
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // Get members with their roles
        const memberRoles = group.memberRoles || {};

        // We'll use Clerk to get user names in the front-end
        // For now, return member IDs with their roles
        return group.members.map(memberId => ({
            userId: memberId,
            role: memberRoles[memberId] || (group.createdBy === memberId ? "admin" : "member"),
            isCreator: group.createdBy === memberId
        }));
    },
});