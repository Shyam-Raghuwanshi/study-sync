"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { AccessToken } from "livekit-server-sdk";

export const generateToken = action({
  args: {
    groupId: v.id("studyGroups"),
  },
  handler: async (ctx, args): Promise<string> => {
    const getUserIdentity = await ctx.auth.getUserIdentity();
    if (!getUserIdentity) throw new Error("Not authenticated");
    const userId = getUserIdentity.subject as any;
    const userName = getUserIdentity.name; 

    // Use the group ID as the room name
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
      room: roomName,  // Set the room name based on group ID
      canPublish: true,
      canSubscribe: true,
    });

    return token.toJwt();
  },
});
