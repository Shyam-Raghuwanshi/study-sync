import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new problem
export const create = mutation({
  args: {
    sessionId: v.id("studySessions"),
    content: v.string(),
    solution: v.string(),
    difficulty: v.number(),
    tags: v.array(v.string()),
    generatedBy: v.union(v.string(), v.literal("AI")),
  },
  handler: async (ctx, args) => {
    // Ensure the session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Study session not found");
    }
    
    // If not AI-generated, ensure the user is a participant
    if (args.generatedBy !== "AI") {
      if (!session.participants.includes(args.generatedBy)) {
        throw new Error("User is not a participant in this session");
      }
    }
    
    const problemId = await ctx.db.insert("problems", {
      sessionId: args.sessionId,
      content: args.content,
      solution: args.solution,
      difficulty: args.difficulty,
      tags: args.tags,
      generatedBy: args.generatedBy,
      attempts: {},
    });
    
    return problemId;
  },
});

// Get problems for a session
export const getBySession = query({
  args: {
    sessionId: v.id("studySessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("problems")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Get a specific problem by ID
export const getById = query({
  args: { id: v.id("problems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Record a problem attempt
export const recordAttempt = mutation({
  args: {
    id: v.id("problems"),
    userId: v.string(),
    solved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const problem = await ctx.db.get(args.id);
    if (!problem) {
      throw new Error("Problem not found");
    }
    
    // Get current attempts for the user or initialize
    const userAttempts = problem.attempts[args.userId] || {
      attempts: 0,
      solved: false,
      lastAttempt: 0,
    };
    
    // Update the attempts
    const updatedAttempts = {
      ...userAttempts,
      attempts: userAttempts.attempts + 1,
      solved: args.solved || userAttempts.solved,
      lastAttempt: Date.now(),
    };
    
    // Update the problem record
    await ctx.db.patch(args.id, {
      attempts: {
        ...problem.attempts,
        [args.userId]: updatedAttempts,
      },
    });
    
    // If solved, update the user's progress
    if (args.solved && !userAttempts.solved) {
      const session = await ctx.db.get(problem.sessionId);
      if (session) {
        const progressRecords = await ctx.db
          .query("progress")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("groupId"), session.groupId))
          .collect();
        
        if (progressRecords.length > 0) {
          const progress = progressRecords[0];
          await ctx.db.patch(progress._id, {
            problemsSolved: progress.problemsSolved + 1,
            lastUpdated: Date.now(),
          });
        }
      }
    }
    
    return updatedAttempts;
  },
});

// Delete a problem
export const deleteProblem = mutation({
  args: {
    id: v.id("problems"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const problem = await ctx.db.get(args.id);
    if (!problem) {
      throw new Error("Problem not found");
    }
    
    // Check if user is the creator (if not AI-generated)
    if (problem.generatedBy !== "AI" && problem.generatedBy !== args.userId) {
      const session = await ctx.db.get(problem.sessionId);
      if (!session || !session.participants.includes(args.userId)) {
        throw new Error("Not authorized to delete this problem");
      }
    }
    
    await ctx.db.delete(args.id);
    return true;
  },
});

// Generate practice problems
export const generatePracticeProblems = mutation({
  args: {
    sessionId: v.id("studySessions"),
    topic: v.string(),
    difficulty: v.number(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const problems = [];
    for (let i = 0; i < args.count; i++) {
      const problemId = await ctx.db.insert("problems", {
        sessionId: args.sessionId,
        content: `Practice problem on ${args.topic} (Difficulty: ${args.difficulty})`,
        solution: `Solution for problem on ${args.topic}`,
        difficulty: args.difficulty,
        tags: [args.topic],
        generatedBy: "AI",
        attempts: {},
      });
      problems.push(problemId);
    }
    return problems;
  },
});