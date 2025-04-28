import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Query to get user's notifications
export const getUserNotifications = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return notifications;
  },
});

// Query to get unread notifications count
export const getUnreadCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unreadCount = await ctx.db
      .query("notifications")
      .withIndex("by_read_status", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadCount.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
    return { success: true };
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read_status", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { success: true, count: unreadNotifications.length };
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    // Check if the current user is the owner of the notification
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    if (notification.userId !== identity.subject) {
      throw new Error("Not authorized to delete this notification");
    }
    
    await ctx.db.delete(args.notificationId);
    return { success: true };
  },
});

// Create new notification
export const createNotification = internalMutation({
  args: {
    userId: v.string(),
    sessionId: v.optional(v.id("studySessions")),
    groupId: v.optional(v.id("studyGroups")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.object({
      sessionStartTime: v.optional(v.number()),
      resourceId: v.optional(v.string()),
      actorId: v.optional(v.string()),
      actorName: v.optional(v.string()),
      userEmail: v.optional(v.string()), // Added userEmail field
    })),
  },
  handler: async (ctx, args) => {
    // Check user notification preferences
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Default to sending notifications if preferences don't exist
    const shouldSendWeb = preferences ? preferences.webNotifications : true;
    const shouldSendEmail = preferences ? preferences.emailNotifications : true;
    console.log("Notification preferences:", shouldSendEmail, preferences)
    // Create notification record
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      sessionId: args.sessionId,
      groupId: args.groupId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      isEmailSent: false,
      createdAt: Date.now(),
      metadata: args.metadata,
    });

    // If email notifications are enabled, schedule the email sending via internalAction
    if (shouldSendEmail) {
      await ctx.scheduler.runAfter(0, internal.mail.sendNotificationEmail, {
        userId: args.userId,
        notificationId,
        title: args.title,
        message: args.message,
        type: args.type,
        metadata: args.metadata,
      });
    }

    return notificationId;
  },
});

// Create session reminder notification
export const createSessionReminder = mutation({
  args: {
    sessionId: v.id("studySessions"),
    userId: v.string(),
    notifyBy: v.string(), // "email", "web", "both"
    userEmail: v.optional(v.string()), // Added to pass email directly
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    const group = await ctx.db.get(session.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Try to get user's email from identity if not provided
    let userEmail = args.userEmail;
    if (!userEmail) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity && identity.email) {
        userEmail = identity.email;
      }
    }

    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      userId: args.userId,
      sessionId: args.sessionId,
      groupId: session.groupId,
      type: "session_reminder",
      title: `Reminder: ${session.name}`,
      message: `You've set a reminder for your upcoming study session in ${group.name} that starts at ${new Date(session.startTime).toLocaleString()}.`,
      metadata: {
        sessionStartTime: session.startTime,
        userEmail: userEmail, // Pass email in metadata
      },
    });

    return { success: true };
  },
});

// Check if a user has set a notification for a specific session
export const checkSessionNotification = query({
  args: { 
    userId: v.string(), 
    sessionId: v.id("studySessions") 
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_session", (q) => 
        q.eq("sessionId", args.sessionId)
      )
      .filter((q) => 
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "session_reminder")
      )
      .first();
    
    return !!notifications; // Return boolean indicating if notification exists
  },
});

// Get user notification preferences
export const getUserPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Return default preferences if not set
    if (!preferences) {
      return {
        emailNotifications: true,
        webNotifications: true,
        sessionReminders: true,
        groupUpdates: true,
        resourceAdditions: true,
      };
    }

    return preferences;
  },
});

// Update user notification preferences
export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      emailNotifications: v.boolean(),
      webNotifications: v.boolean(),
      sessionReminders: v.boolean(),
      groupUpdates: v.boolean(),
      resourceAdditions: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.preferences,
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        ...args.preferences,
        lastUpdated: Date.now(),
      });
      return id;
    }
  },
});