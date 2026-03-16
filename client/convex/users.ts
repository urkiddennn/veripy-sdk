import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashString } from "./crypto";
import { rateLimiter } from "./rateLimit";

// Create user actions
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await hashString(args.password);

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: hashedPassword,
    });

    return userId;
  },
});

// login user actions
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Enforce rate limiting on login attempts per email
    const status = await rateLimiter.limit(ctx, "loginAttempt", {
      key: args.email,
    });
    if (!status.ok) {
      throw new Error(`Too many login attempts. Please try again later.`);
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const hashedPassword = await hashString(args.password);

    // Support backwards compatibility during migration
    const isPlaintextMatch = user.password === args.password;
    const isHashMatch = user.password === hashedPassword;

    if (!isPlaintextMatch && !isHashMatch) {
      throw new Error("Invalid email or password");
    }

    // If they logged in with a plaintext password, automatically upgrade it to hashed!
    if (isPlaintextMatch) {
      await ctx.db.patch(user._id, { password: hashedPassword });
    }

    return user._id;
  },
});

// get user actions
export const getUser = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    return await ctx.db.get(args.userId);
  },
});
