import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-d"
});

// Create a new problem
export const create = action({
  args: {
    subject: v.string(),
    topic: v.string(),
    count: v.optional(v.number()),
    difficulty: v.optional(v.number()),
    sessionId: v.id("studySessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    try {
      const { subject, topic } = args;
      const difficulty = args?.difficulty || 1;
      const count = args?.count || 5;
      if (difficulty < 1 || difficulty > 5) {
        throw new Error("Difficulty must be between 1 and 5");
      }

      if (count < 1 || count > 20) {
        throw new Error("Count must be between 1 and 20");
      }

      // Define function schema for MCQ generation
      const mcqFunctionDefinition = {
        name: "generate_multiple_choice_questions",
        description: `Generate ${count} multiple-choice questions about ${subject}, specifically on the topic of ${topic} at difficulty level ${difficulty}/5`,
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              description: `An array of ${count} MCQs at difficulty level ${difficulty}/5`,
              items: {
                type: "object",
                properties: {
                  question: {
                    type: "string",
                    description: "The question text"
                  },
                  options: {
                    type: "array",
                    description: "Array of 4 options with their prefixes (A, B, C, D)",
                    items: {
                      type: "string"
                    }
                  },
                  correctAnswer: {
                    type: "string",
                    description: "The correct answer prefix (just the letter: A, B, C, or D)"
                  },
                  explanation: {
                    type: "string",
                    description: "Explanation of why the correct answer is right"
                  }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["questions"]
        }
      };

      // Generate MCQs with OpenAI function calling
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: `You are an expert educator creating multiple-choice questions (MCQs) about ${args.subject}, specifically on the topic of ${args.topic}. Generate ${count} MCQs at difficulty level ${difficulty}/5.` 
          },
          { 
            role: "user", 
            content: `Generate ${count} ${subject} MCQs about ${topic} at difficulty level ${difficulty}/5.` 
          }
        ],
        tools: [{ type: "function", function: mcqFunctionDefinition }],
        tool_choice: { type: "function", function: { name: "generate_multiple_choice_questions" } }
      });

      // Extract the function call response
      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      
      if (!toolCall || toolCall.type !== "function" || toolCall.function.name !== "generate_multiple_choice_questions") {
        throw new Error("Failed to generate MCQs: Invalid response format");
      }
      
      // Parse the function arguments
      try {
        const functionArgs = JSON.parse(toolCall.function.arguments);
        return functionArgs.questions || [];
      } catch (error) {
        console.error("Error parsing function arguments:", error);
        // throw new Error("Failed to parse generated MCQs");
        return [];
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "I'm currently having trouble generating an explanation. Please try again later.";
    }
  },
});