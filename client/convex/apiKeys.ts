import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateSecureKey, hashString } from "./crypto";

export const generateKey = mutation({
    args: {
        userId: v.id("users"),
        projectId: v.optional(v.id("projects")),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        const effectiveUserId = authUserId ?? args.userId;

        if (args.projectId) {
            const project = await ctx.db.get(args.projectId);
            if (project && authUserId && project.userId !== authUserId) {
                throw new Error("Unauthorized: You do not own this project.");
            }
        }

        const rawKey = generateSecureKey();
        const hashedKey = await hashString(rawKey);

        // e.g. vp_abc123...
        const displayKey = rawKey.substring(0, 7) + "••••••••" + rawKey.substring(rawKey.length - 4);

        const apiKeyId = await ctx.db.insert("apiKeys", {
            userId: effectiveUserId,
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
        const authUserId = await getAuthUserId(ctx);
        const effectiveUserId = authUserId ?? args.userId;

        if (args.projectId) {
            const project = await ctx.db.get(args.projectId);
            if (project && authUserId && project.userId !== authUserId) {
                throw new Error("Unauthorized: You do not have access to this project.");
            }
            return await ctx.db
                .query("apiKeys")
                .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
                .collect();
        }
        return await ctx.db
            .query("apiKeys")
            .withIndex("by_userId", (q) => q.eq("userId", effectiveUserId))
            .collect();
    },
});

export const deleteKey = mutation({
    args: { id: v.id("apiKeys") },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        const key = await ctx.db.get(args.id);
        if (!key) return;

        if (authUserId && key.userId !== authUserId) {
            throw new Error("Unauthorized: You do not own this API key.");
        }

        await ctx.db.delete(args.id);
    },
});
