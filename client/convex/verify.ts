import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import * as cryptoHelper from "./crypto";

// Core verification logic
export const verifyEmail = action({
    args: {
        email: v.string(),
        apiKey: v.optional(v.string())
    },
    handler: async (ctx, args): Promise<{
        valid: boolean;
        reason?: string;
        email?: string;
        details?: { syntax: boolean };
        results?: { syntax: boolean; disposable: boolean; mx_records: boolean; mailbox: boolean };
        score?: number;
        timestamp?: number;
    }> => {
        const { email } = args;

        const syntaxValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!syntaxValid) {
            const result = {
                valid: false,
                reason: "invalid_syntax",
                details: { syntax: false }
            };

            // Log if associated with a user
            const keyRecord = args.apiKey ? await ctx.runQuery(api.verify.getKeyRecord, { key: args.apiKey }) : null;
            if (keyRecord) {
                await ctx.runMutation(api.verify.logVerification, {
                    userId: keyRecord.userId,
                    projectId: keyRecord.projectId,
                    apiKeyId: keyRecord._id,
                    email,
                    valid: false,
                    score: 0.1,
                    reason: "invalid_syntax",
                    timestamp: Date.now()
                });
            }
            return result;
        }

        // 2. Disposable Check + MX Record status (from DB)
        const domain = email.split("@")[1]?.toLowerCase();
        const domainRecord = domain
            ? await ctx.runQuery(api.disposableDomains.getDomainRecord, { domain })
            : null;
        const isDisposable = domainRecord !== null;
        const hasMx = isDisposable
            ? (domainRecord?.hasMx ?? false)  // Use validated DB data for disposable domains
            : true;                            // Assume real domains have MX (simplified)
        console.log(`Verifying: ${email}, Domain: ${domain}, isDisposable: ${isDisposable}, hasMx: ${hasMx}`);

        const report = {
            valid: !isDisposable && hasMx,
            email,
            results: {
                syntax: true,
                disposable: !isDisposable,
                mx_records: hasMx,
                mailbox: true // Simulated
            },
            // MX-validated disposable domains score lower (more deceptive)
            score: !isDisposable ? 0.95 : hasMx ? 0.15 : 0.2,
            timestamp: Date.now()
        };

        // Log the verification if associated with a user
        const keyRecord = args.apiKey ? await ctx.runQuery(api.verify.getKeyRecord, { key: args.apiKey }) : null;
        if (keyRecord) {
            await ctx.runMutation(api.verify.logVerification, {
                userId: keyRecord.userId,
                projectId: keyRecord.projectId,
                apiKeyId: keyRecord._id,
                email,
                valid: report.valid,
                score: report.score,
                reason: report.results.disposable ? undefined : "disposable_email", // Basic mapping for now
                timestamp: report.timestamp
            });
        }

        return report;
    },
});

export const getKeyRecord = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        // Try looking up by old plaintext key first (for existing keys)
        const plainRecord = await ctx.db
            .query("apiKeys")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();

        if (plainRecord) return plainRecord;

        // If not found, hash the key and look up securely
        const hashedKey = await cryptoHelper.hashString(args.key);

        return await ctx.db
            .query("apiKeys")
            .withIndex("by_hashedKey", (q) => q.eq("hashedKey", hashedKey))
            .first();
    },
});

export const listLogs = query({
    args: {
        userId: v.id("users"),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        if (args.projectId) {
            return await ctx.db
                .query("verificationLogs")
                .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
                .order("desc")
                .take(50);
        }
        return await ctx.db
            .query("verificationLogs")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(50);
    },
});

export const getStats = query({
    args: {
        userId: v.id("users"),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        const logs = await (args.projectId
            ? ctx.db.query("verificationLogs").withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            : ctx.db.query("verificationLogs").withIndex("by_user", (q) => q.eq("userId", args.userId))
        ).collect();

        const total = logs.length;
        const allowed = logs.filter(l => l.valid).length;
        const blocked = logs.filter(l => !l.valid && l.score < 0.95).length;
        const errors = total - allowed - blocked;

        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const recentLogs = logs.filter(l => l.timestamp >= sevenDaysAgo);

        const dailyData: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000).toLocaleDateString();
            dailyData[date] = 0;
        }

        recentLogs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString();
            if (dailyData[date] !== undefined) {
                dailyData[date]++;
            }
        });

        const timeSeries = Object.entries(dailyData)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            total,
            recent: logs.slice(0, 10),
            successRate: total > 0 ? (allowed / total) * 100 : 100,
            allowPercentage: total > 0 ? (allowed / total) * 100 : 0,
            blockPercentage: total > 0 ? (blocked / total) * 100 : 0,
            errorPercentage: total > 0 ? (errors / total) * 100 : 0,
            timeSeries,
        };
    },
});

export const logVerification = mutation({
    args: {
        userId: v.id("users"),
        projectId: v.optional(v.id("projects")),
        apiKeyId: v.optional(v.id("apiKeys")),
        email: v.string(),
        valid: v.boolean(),
        score: v.float64(),
        reason: v.optional(v.string()),
        timestamp: v.float64(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("verificationLogs", args);

        if (args.apiKeyId) {
            const key = await ctx.db.get(args.apiKeyId);
            if (key) {
                await ctx.db.patch(args.apiKeyId, {
                    requestsCount: (key.requestsCount || 0) + 1
                });
            }
        }
    },
});
