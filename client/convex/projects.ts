import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create project action
export const createProject = mutation({
  args: {
    name: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      slug,
      userId: args.userId,
      createdAt: Date.now(),
    });

    return projectId;
  },
});

// Get the projects list by users
export const getProjects = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
      .collect();
  },
});

export const getProject = query({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    if (!args.projectId) return null;
    return await ctx.db.get(args.projectId);
  },
});

// update project action
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await ctx.db.patch(args.projectId, {
      name: args.name,
      slug,
    });
  },
});

// delete project actions
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Delete project
    await ctx.db.delete(args.projectId);

    // Delete associated API keys
    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const key of apiKeys) {
      await ctx.db.delete(key._id);
    }

    // Delete associated requests
    const requests = await ctx.db
      .query("requests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const req of requests) {
      await ctx.db.delete(req._id);
    }

    // Delete associated verification logs
    const logs = await ctx.db
      .query("verificationLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
  },
});
