"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { AccessToken } from "livekit-server-sdk";
import { internal } from "./_generated/api";

export const generateToken = action({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args): Promise<string> => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;
    const userName = getUserIdentity.name;
    const room = await ctx.runQuery(internal.rooms.getRoom, { roomId: args.roomId });
    if (!room) throw new Error("Room not found");

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: userId,
        name: userName
      }
    );

    token.addGrant({
      room: room.name,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return token.toJwt();
  },
});
