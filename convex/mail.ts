import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from 'resend';

export const sendNotificationEmail = internalMutation({
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
        console.log("User email not found in metadata, trying to fetch from userId:", args.userId);
        // Otherwise try to get from identity
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
          console.error("User email not found for userId:", args.userId);
          return { success: false, error: "User email not found" };
        }
        userEmail = identity.email;
      }

      // Initialize Resend with API key
      console.log("Resend API Key:", process.env.RESEND_API_KEY, "User Email:", userEmail);
      const resend = new Resend(process.env.RESEND_API_KEY);

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

      // Send the email
      console.log({
        from: 'onboarding@resend.dev',
        to: userEmail,
        subject: args.title,
        html: emailHtml
      })
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: userEmail,
        subject: args.title,
        html: emailHtml
      });

      console.log("Email sent successfully:", data, error);

      // Mark notification as email sent
      await ctx.db.patch(args.notificationId, {
        isEmailSent: true
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: String(error) };
    }
  },
});
