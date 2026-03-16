import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Check if a domain is in the disposable blocklist.
 * Used by verifyEmail on every verification request.
 */
export const isDomainDisposable = query({
    args: { domain: v.string() },
    handler: async (ctx, args): Promise<boolean> => {
        const record = await ctx.db
            .query("disposableDomains")
            .withIndex("by_domain", (q) => q.eq("domain", args.domain.toLowerCase()))
            .first();
        return record !== null;
    },
});

/**
 * Returns the full domain record (including hasMx flag), or null if not in blocklist.
 */
export const getDomainRecord = query({
    args: { domain: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("disposableDomains")
            .withIndex("by_domain", (q) => q.eq("domain", args.domain.toLowerCase()))
            .first();
    },
});

/**
 * Add a single domain to the blocklist (e.g. when you spot a new spam domain).
 */
export const addDomain = mutation({
    args: {
        domain: v.string(),
        addedBy: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const domain = args.domain.toLowerCase().trim();
        // Prevent duplicates
        const existing = await ctx.db
            .query("disposableDomains")
            .withIndex("by_domain", (q) => q.eq("domain", domain))
            .first();
        if (existing) {
            return { alreadyExists: true, id: existing._id };
        }
        const id = await ctx.db.insert("disposableDomains", {
            domain,
            addedAt: Date.now(),
            addedBy: args.addedBy ?? "admin",
        });
        return { alreadyExists: false, id };
    },
});

/**
 * Remove a domain from the blocklist by its document ID.
 */
export const removeDomain = mutation({
    args: { id: v.id("disposableDomains") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

/**
 * Remove a domain from the blocklist by its domain string.
 */
export const removeDomainByName = mutation({
    args: { domain: v.string() },
    handler: async (ctx, args) => {
        const record = await ctx.db
            .query("disposableDomains")
            .withIndex("by_domain", (q) => q.eq("domain", args.domain.toLowerCase()))
            .first();
        if (record) {
            await ctx.db.delete(record._id);
            return { removed: true };
        }
        return { removed: false };
    },
});

/**
 * List domains (paginated) — useful for an admin panel.
 */
export const listDomains = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("disposableDomains")
            .order("asc")
            .take(args.limit ?? 100);
    },
});
