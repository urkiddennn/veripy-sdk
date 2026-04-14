import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get all domain rules for a given project
 */
export const listRules = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("projectDomainRules")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("desc")
            .collect();
    },
});

/**
 * Get a specific domain rule for a project
 */
export const getRule = query({
    args: { projectId: v.id("projects"), domain: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("projectDomainRules")
            .withIndex("by_project_domain", (q) =>
                q.eq("projectId", args.projectId).eq("domain", args.domain.toLowerCase())
            )
            .first();
    },
});

/**
 * Add a new domain rule to a project
 */
export const addRule = mutation({
    args: {
        projectId: v.id("projects"),
        domain: v.string(),
        action: v.string(), // "allow" or "block"
    },
    handler: async (ctx, args) => {
        const domain = args.domain.toLowerCase().trim();
        // Prevent duplicate domains for the same project
        const existing = await ctx.db
            .query("projectDomainRules")
            .withIndex("by_project_domain", (q) =>
                q.eq("projectId", args.projectId).eq("domain", domain)
            )
            .first();
            
        if (existing) {
            return { alreadyExists: true, id: existing._id };
        }
        
        const id = await ctx.db.insert("projectDomainRules", {
            projectId: args.projectId,
            domain,
            action: args.action,
            createdAt: Date.now(),
        });
        
        return { alreadyExists: false, id };
    },
});

/**
 * Remove a domain rule
 */
export const removeRule = mutation({
    args: { id: v.id("projectDomainRules") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return { removed: true };
    },
});
