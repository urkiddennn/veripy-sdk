import { httpRouter } from "convex/server";
import { httpAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { rateLimiter } from "./rateLimit";
import { v } from "convex/values";

const http = httpRouter();

// Internal mutation to run rate limiting (rateLimiter.limit requires mutation ctx)
export const checkRateLimit = internalMutation({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        return await rateLimiter.limit(ctx, "verifyEndpoint", { key: args.key });
    },
});

http.route({
    path: "/v1/verify",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const { email } = await request.json();
        const apiKey = request.headers.get("x-api-key");
        console.log(`Received API Key from header: "${apiKey}"`);

        if (!email) {
            return new Response(JSON.stringify({ error: "Email is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "API Key is required" }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // Verify API Key
        const keyRecord = await ctx.runQuery(api.verify.getKeyRecord, { key: apiKey });
        if (!keyRecord || keyRecord.revoked) {
            return new Response(JSON.stringify({ error: "Invalid or revoked API Key" }), {
                status: 403,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // Apply Rate Limiting via internal mutation
        const { ok, retryAfter } = await ctx.runMutation(internal.http.checkRateLimit, { key: apiKey });

        if (!ok) {
            // Log the rate limited request
            await ctx.runMutation(api.verify.logVerification, {
                userId: keyRecord.userId,
                projectId: keyRecord.projectId,
                apiKeyId: keyRecord._id,
                email,
                valid: false,
                score: 0,
                reason: "rate_limited",
                timestamp: Date.now()
            });

            return new Response(JSON.stringify({
                error: "Rate limit exceeded",
                retryAfter,
                message: "Please upgrade your plan or slow down your requests."
            }), {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Retry-After": Math.ceil((retryAfter - Date.now()) / 1000).toString()
                },
            });
        }

        const result = await ctx.runAction(api.verify.verifyEmail, { email, apiKey });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, x-api-key",
            },
        });
    }),
});

// Preflight for CORS
http.route({
    path: "/v1/verify",
    method: "OPTIONS",
    handler: httpAction(async () => {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, x-api-key",
            },
        });
    }),
});

export default http;
