"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { AccessToken } from "livekit-server-sdk";

export const generateToken = action({
  args: {
    sessionId: v.id("studySessions"),
  },
  handler: async (ctx, args): Promise<string> => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;
    const userName = getUserIdentity.name;

    // Use the session ID as the room name
    const roomName = `session_${args.sessionId}`;

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: userId,
        name: userName
      }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,  // Set the room name based on session ID
      canPublish: true,
      canSubscribe: true,
    });

    return token.toJwt();
  },
});

export const generateTokenForGroup = action({
  args: {
    groupId: v.any(),
  },
  handler: async (ctx, args): Promise<string> => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;
    const userName = getUserIdentity.name;

    // Use the session ID as the room name
    const roomName = `group_${args.groupId}`;

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: userId,
        name: userName
      }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return token.toJwt();
  },
});
