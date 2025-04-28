import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from 'resend';

export const sendNotificationEmail = internalAction({
  args: {
    userId: v.string(),
    notificationId: v.id("notifications"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    metadata: v.optional(v.object({
      sessionStartTime: v.optional(v.number()),
      resourceId: v.optional(v.string()),
      actorId: v.optional(v.string()),
      actorName: v.optional(v.string()),
      userEmail: v.optional(v.string()), // Added userEmail field to pass email directly
    })),
  },
  handler: async (ctx, args) => {
    try {
      let userEmail;

      // First check if email was passed in metadata
      if (args.metadata?.userEmail) {
        userEmail = args.metadata.userEmail;
      } else {
        // Since we're now using an internalAction, we can't use ctx.auth.getUserIdentity()
        // We would need to get the user email from a different source, like the database
        console.error("User email not provided in metadata for userId:", args.userId);
        return { success: false, error: "User email not provided in metadata" };
      }

      // Initialize Resend with API key
      const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);

      // Format the email based on notification type
      let emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #4361ee;">${args.title}</h1>
          <p>${args.message}</p>
      `;

      // Add specific content based on notification type
      if (args.type === 'session_reminder' && args.metadata?.sessionStartTime) {
        const sessionDate = new Date(args.metadata.sessionStartTime);
        emailHtml += `
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Session Start Time:</strong> ${sessionDate.toLocaleString()}</p>
            <p>Don't forget to join on time!</p>
          </div>
        `;
      }

      // Close the email HTML
      emailHtml += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>This is an automated notification from StudySync.</p>
            <p style="font-size: 12px; color: #666;">You received this email because you signed up for notifications in StudySync.</p>
          </div>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: userEmail,
        subject: args.title,
        html: emailHtml
      });


      // Mark notification as email sent
      //@ts-ignore
      await ctx.runMutation(async ({ db }) => {
        await db.patch(args.notificationId, {
          isEmailSent: true
        });
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: String(error) };
    }
  },
});
