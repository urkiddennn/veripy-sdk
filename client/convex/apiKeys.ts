import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateSecureKey, hashString } from "./crypto";

export const generateKey = mutation({
    args: {
        userId: v.id("users"),
        projectId: v.optional(v.id("projects")),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const rawKey = generateSecureKey();
        const hashedKey = await hashString(rawKey);

        // e.g. vp_abc123...
        const displayKey = rawKey.substring(0, 7) + "••••••••" + rawKey.substring(rawKey.length - 4);

        const apiKeyId = await ctx.db.insert("apiKeys", {
            userId: args.userId,
            projectId: args.projectId,
            name: args.name,
            createdAt: Date.now(),
            displayKey,
            hashedKey,
            requestsCount: 0,
            revoked: false,
            // key is intentionally omitted for security!
        });

        // Return the RAW key one time only so the client can show it!
        return { apiKeyId, key: rawKey };
    },
});

export const listKeys = query({
    args: {
        userId: v.id("users"),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        if (args.projectId) {
            return await ctx.db
                .query("apiKeys")
                .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
                .collect();
        }
        return await ctx.db
            .query("apiKeys")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const deleteKey = mutation({
    args: { id: v.id("apiKeys") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
