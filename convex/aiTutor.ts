import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-d"
});

export const monitorDiscussion = mutation({
  args: {
    sessionId: v.id("studySessions"),
    userId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Logic to monitor discussions and provide feedback
    // This could involve analyzing the message content and providing suggestions
    // For now, we will just log the message
    console.log(`User ${args.userId} in session ${args.sessionId}: ${args.message}`);
    return true;
  },
});

// Ask the AI tutor a question and get a response - using an action for external API calls
export const ask = action({
  args: {
    question: v.string(),
    chatHistory: v.optional(
      v.array(
        v.object({
          role: v.string(),
          name: v.string(),
          content: v.string(),
        })
      )
    ),
    interactionType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user identity if available
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    try {
      // Prepare messages array with system prompt
      const messages = [
        {
          role: "system",
          content: "You are a helpful AI tutor assisting students with their studies. Provide clear, concise, and educational responses. Use previous conversation context to give more relevant answers."
        }
      ];

      // Add chat history if provided
      if (args.chatHistory && args.chatHistory.length > 0) {
        // Filter out the loading message if present and format messages properly
        const filteredHistory = args.chatHistory
          .filter(msg => msg.content !== '...')
          .map(msg => {
            // Create a properly formatted message object
            // OpenAI requires that 'name' must not contain spaces or special characters
            const formattedMsg = {
              role: msg.role,
              content: msg.content
            };

            // Only add the name field if it's a valid format according to OpenAI's requirements
            // (doesn't contain spaces, <, |, \, /, >)
            if (msg.role === 'user' || msg.role === 'assistant') {
              const sanitizedName = msg.name.replace(/[\s<|\\/>]+/g, '_');
              if (sanitizedName) {
                // @ts-ignore - TypeScript may complain about the dynamic property
                formattedMsg.name = sanitizedName;
              }
            }

            return formattedMsg;
          });

        messages.push(...filteredHistory);
      }

      // Add the current question
      messages.push({
        role: "user",
        content: args.question
      });

      // Use OpenAI to generate a response
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // You can use different models as needed
        //@ts-ignore
        messages: messages,
        max_tokens: 1000, // Adjust as needed
        temperature: 0.7, // Adjust for more or less creative responses
      });

      // Extract the response from the API result
      const response = completion.choices[0]?.message?.content ||
        "I'm sorry, I couldn't process your question. Please try again.";

      return response;
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "I'm currently having trouble connecting to my knowledge base. Please try again in a moment.";
    }
  },
});

export const saveAIInteraction = mutation({
  args: {
    sessionId: v.id("studySessions"),
    interactionType: v.string(),
    content: v.string(),
    response: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    const userId = identity.subject;
    console.log("Saving AI interaction:", args);
    // Save the interaction to the aiInteractions table
    const res = await ctx.db.insert("aiInteractions", {
      sessionId: args.sessionId,
      userId: userId,
      //@ts-ignore
      interactionType: args.interactionType,
      timestamp: args.timestamp,
      content: args.content,
      response: args.response,
    });
    console.log("Saved AI interaction:", res);
    return res;
  },
});

// Explain a concept to the user
export const explainConcept = action({
  args: {
    concept: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an educational AI tutor. Provide clear, concise explanations of academic concepts."
          },
          {
            role: "user",
            content: `Explain the concept of ${args.concept} in simple terms.`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content ||
        "I'm sorry, I couldn't generate an explanation. Please try again.";

      return response;
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "I'm currently having trouble generating an explanation. Please try again later.";
    }
  },
});

// Generate practice problems based on user performance
export const generatePracticeProblems = query({
  args: {
    userId: v.string(),
    sessionId: v.id("studySessions"),
  },
  handler: async (ctx, args) => {
    // Logic to generate practice problems
    // This could involve analyzing user performance and generating relevant problems
    // const problems = await ctx.db.query("problems").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();

    // For demonstration, return a static problem
    return [
      {
        id: "generated_problem_1",
        content: "What is the derivative of x^2?",
        solution: "2x",
        difficulty: 1,
        tags: ["calculus"],
        generatedBy: "AI",
      },
    ];
  },
});

// Provide personalized feedback on user solutions
export const provideFeedback = mutation({
  args: {
    userId: v.string(),
    problemId: v.id("problems"),
    userSolution: v.string(),
  },
  handler: async (ctx, args) => {
    // Logic to analyze the user's solution and provide feedback
    const problem = await ctx.db.get(args.problemId);
    if (!problem) {
      throw new Error("Problem not found");
    }

    // Simple feedback logic
    const isCorrect = args.userSolution.trim() === problem.solution.trim();
    return {
      correct: isCorrect,
      feedback: isCorrect ? "Great job!" : "That's not quite right. Try again!",
    };
  },
});

// Track user progress
export const trackProgress = mutation({
  args: {
    userId: v.string(),
    sessionId: v.id("studySessions"),
    solvedProblems: v.array(v.id("problems")),
  },
  handler: async (ctx, args) => {
    // Logic to track user progress
    // const progressRecord = await ctx.db.get(args.userId);
    // if (!progressRecord) {
    //   throw new Error("User progress record not found");
    // }

    // // Update the progress record
    // await ctx.db.patch(args.userId, {
    //   problemsSolved: progressRecord.problemsSolved + args.solvedProblems.length,
    //   lastUpdated: Date.now(),
    // });

    return true;
  },
});