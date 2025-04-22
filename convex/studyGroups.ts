import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
        const studyGroupId = await ctx.db.insert("studyGroups", {
            name: args.name,
            description: args.description,
            subject: args.subject,
            createdBy: userId,
            members: [userId],
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
        userId: v.optional(v.string()),
        onlyPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }
        let query: any = ctx.db.query("studyGroups");

        if (args.subject) {
            query = query.withIndex("by_subject", (q) => q.eq("subject", args.subject));
        }

        if (args.userId) {
            query = query.withIndex("by_member", (q) => q.eq("members", args.userId));
        }

        if (args.onlyPublic) {
            query = query.filter((q) => q.eq(q.field("isPublic"), true));
        }

        return await query.collect();
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

// // Join a study group
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
        console.log(userId, "User ID");
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Study group not found");
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            return args.groupId;
        }

        // Add the user to the members array
        await ctx.db.patch(args.groupId, {
            members: [...group.members, userId],
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
                .query("documents")
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
            .query("documents")
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
            .query("documents")
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
            .query("documents")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect();
        return resources;
    },
});