import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new whiteboard
export const create = mutation({
    args: {
        name: v.string(),
        sessionId: v.id("studySessions"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new Error("User not authenticated");
        }
        const userId = user.subject;
        // Ensure the session exists
        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Study session not found");
        }

        // Ensure user is a participant in the session
        if (!session.participants.includes(userId)) {
            throw new Error("User is not a participant in this session");
        }

        const whiteboardId = await ctx.db.insert("whiteboards", {
            name: args.name,
            sessionId: args.sessionId,
            elements: [],
            snapshots: [],
            lastUpdated: Date.now(),
        });

        return whiteboardId;
    },
});

// Get whiteboards for a session
export const getBySession = query({
    args: {
        sessionId: v.id("studySessions"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new Error("User not authenticated");
        }
        return await ctx.db
            .query("whiteboards")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();
    },
});

// Get a specific whiteboard by ID
export const getById = query({
    args: { id: v.id("whiteboards") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new Error("User not authenticated");
        }
        return await ctx.db.get(args.id);
    },
});

// Update a whiteboard with new elements
export const updateElements = mutation({
    args: {
        id: v.id("whiteboards"),
        elements: v.array(v.any()),
        createSnapshot: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const whiteboard = await ctx.db.get(args.id);
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new Error("User not authenticated");
        }
        if (!whiteboard) {
            throw new Error("Whiteboard not found");
        }
        const userId = user.subject;

        // Check if user is a participant in the session
        const session = await ctx.db.get(whiteboard.sessionId);
        if (!session || !session.participants.includes(userId)) {
            throw new Error("User is not authorized to update this whiteboard");
        }

        const updates: any = {
            elements: args.elements,
            lastUpdated: Date.now(),
        };

        // Create a snapshot if requested
        if (args.createSnapshot) {
            updates.snapshots = [
                ...whiteboard.snapshots,
                {
                    timestamp: Date.now(),
                    elements: whiteboard.elements,
                    createdBy: userId,
                },
            ];
        }

        await ctx.db.patch(args.id, updates);

        return args.id;
    },
});

// Delete a whiteboard
export const deleteWhiteboard = mutation({
    args: {
        id: v.id("whiteboards"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new Error("User not authenticated");
        }
        const userId = user.subject;
        const whiteboard = await ctx.db.get(args.id);
        if (!whiteboard) {
            throw new Error("Whiteboard not found");
        }

        // Check if user is a participant in the session
        const session = await ctx.db.get(whiteboard.sessionId);
        if (!session || !session.participants.includes(userId)) {
            throw new Error("User is not authorized to delete this whiteboard");
        }

        await ctx.db.delete(args.id);
        return true;
    },
});