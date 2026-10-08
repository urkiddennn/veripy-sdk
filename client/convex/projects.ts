import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create project action
export const createProject = mutation({
  args: {
    name: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const userId = authUserId ?? args.userId;

    if (!userId) {
      throw new Error("Unauthenticated: Please log in to create a project.");
    }

    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      slug,
      userId,
      createdAt: Date.now(),
    });

    return projectId;
  },
});

// Get the projects list by users
export const getProjects = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const targetUserId = authUserId ?? args.userId;

    if (!targetUserId) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
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
    const authUserId = await getAuthUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (authUserId && project.userId !== authUserId) {
      throw new Error("Unauthorized: You do not own this project.");
    }

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
    const authUserId = await getAuthUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (authUserId && project.userId !== authUserId) {
      throw new Error("Unauthorized: You do not own this project.");
    }

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

// Update webhook configuration
export const updateWebhooks = mutation({
  args: {
    projectId: v.id("projects"),
    webhookUrl: v.string(),
    webhookEvents: v.array(v.string()),
    alertsEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (authUserId && project.userId !== authUserId) {
      throw new Error("Unauthorized: You do not own this project.");
    }

    // Generate secret if not existing
    const webhookSecret =
      project.webhookSecret ||
      `whsec_${Math.random().toString(36).slice(2, 12)}_${Date.now().toString(36)}`;

    await ctx.db.patch(args.projectId, {
      webhookUrl: args.webhookUrl,
      webhookEvents: args.webhookEvents,
      alertsEnabled: args.alertsEnabled,
      webhookSecret,
    });

    return { success: true, webhookSecret };
  },
});

// Update monthly quota
export const updateQuota = mutation({
  args: {
    projectId: v.id("projects"),
    monthlyQuota: v.number(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (authUserId && project.userId !== authUserId) {
      throw new Error("Unauthorized: You do not own this project.");
    }

    await ctx.db.patch(args.projectId, {
      monthlyQuota: args.monthlyQuota,
    });
    return { success: true };
  },
});

// Get project usage and quota stats
export const getUsageAndQuota = query({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    if (!args.projectId) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const quota = project.monthlyQuota ?? 10000;

    // Calculate usage from current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const logs = await ctx.db
      .query("verificationLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
      .filter((q) => q.gte(q.field("timestamp"), startOfMonth))
      .collect();

    const used = logs.length;
    const remaining = Math.max(0, quota - used);
    const percentage = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;

    // Reset date (1st of next month)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      quota,
      used,
      remaining,
      percentage: Number(percentage.toFixed(1)),
      resetDate: nextMonth,
      plan: quota <= 10000 ? "Free Tier" : quota <= 50000 ? "Growth" : "Scale Enterprise",
      rateLimitRps: 100,
      isNearLimit: percentage >= 80,
      isExceeded: used >= quota,
    };
  },
});

