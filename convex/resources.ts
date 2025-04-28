import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for resources
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Create a new resource
export const create = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
    groupId: v.id("studyGroups"),
    sessionId: v.optional(v.id("studySessions")),
    type: v.string(), // e.g., "document", "image", "pdf"
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ensure the group exists
    const user = await ctx.auth.getUserIdentity();
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

    const resourceId = await ctx.db.insert("resources", {
      name: args.name,
      storageId: args.storageId,
      createdBy: userId,
      createdByName: user.name || "Unknown",
      groupId: args.groupId,
      sessionId: args.sessionId,
      type: args.type,
      description: args.description,
      lastUpdated: Date.now(),
      version: 1,
      contributorIds: [userId],
    });

    // Update group's last active timestamp
    await ctx.db.patch(args.groupId, {
      lastActive: Date.now(),
    });

    return resourceId;
  },
});

// Get all resources for a group
export const getByGroup = query({
  args: {
    groupId: v.id("studyGroups"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resources")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

// Get all resources for a session
export const getBySession = query({
  args: {
    sessionId: v.id("studySessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resources")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Get a specific resource by ID
export const getById = query({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update a resource's metadata
export const update = mutation({
  args: {
    id: v.id("resources"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.string(), // The user making the update
  },
  handler: async (ctx, args) => {
    const { id, name, description, userId } = args;

    const resource = await ctx.db.get(id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    // Check if the group exists and the user is a member
    const group = await ctx.db.get(resource.groupId);
    if (!group || !group.members.includes(userId)) {
      throw new Error("User is not authorized to update this resource");
    }

    // Update the resource metadata
    const updates: { lastUpdated: number; version: number; name?: string; description?: string; contributorIds?: string[] } = {
      lastUpdated: Date.now(),
      version: resource.version + 1,
    };

    if (name) {
      updates.name = name;
    }

    if (description) {
      updates.description = description;
    }

    // Add user to contributors if not already there
    if (!resource.contributorIds.includes(userId)) {
      updates.contributorIds = [...resource.contributorIds, userId];
    }

    await ctx.db.patch(id, updates);

    // Update group's last active timestamp
    await ctx.db.patch(resource.groupId, {
      lastActive: Date.now(),
    });

    return id;
  },
});

// Delete a resource
export const deleteResource = mutation({
  args: {
    id: v.id("resources"),
    userId: v.string(), // To verify the user is the creator or has permission
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    // Check if user is the creator
    if (resource.createdBy !== args.userId) {
      // If not creator, check if user is a member of the group
      const group = await ctx.db.get(resource.groupId);
      if (!group || !group.members.includes(args.userId)) {
        throw new Error("Not authorized to delete this resource");
      }
    }

    // Delete the file from storage
    await ctx.storage.delete(resource.storageId);

    // Delete the resource record
    await ctx.db.delete(args.id);
    return true;
  },
});

// Get download URL for a resource
export const getDownloadUrl = mutation({
  args: {
    id: v.id("resources"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    // Check if user has access to the resource
    const group = await ctx.db.get(resource.groupId);
    if (!group || !group.members.includes(args.userId)) {
      throw new Error("Not authorized to access this resource");
    }

    return await ctx.storage.getUrl(resource.storageId);
  },
});