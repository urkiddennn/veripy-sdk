import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,
    users: defineTable({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        image: v.optional(v.string()),
        password: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()),
        phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
    })
        .index("email", ["email"])
        .index("phone", ["phone"]),
    
  
    // Project
    projects: defineTable({
        name: v.string(),
        slug: v.string(),
        userId: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_slug", ["slug"]),
        
    projectDomainRules: defineTable({
        projectId: v.id("projects"),
        domain: v.string(),
        action: v.string(), // "allow" or "block"
        createdAt: v.number(),
    })
        .index("by_project", ["projectId"])
        .index("by_project_domain", ["projectId", "domain"]),
    
    requests: defineTable({
        projectId: v.optional(v.id("projects")),
        userId: v.optional(v.id("users")),
        apiKeyId: v.optional(v.string()),
        emailChecked: v.optional(v.string()),
        endpoint: v.optional(v.string()),
        status: v.optional(v.number()),
        timestamp: v.optional(v.number()),
        type: v.optional(v.string()),
        details: v.optional(v.any()),
    })
        .index("by_project", ["projectId"])
        .index("by_user", ["userId"])
        .index("by_apiKey", ["apiKeyId"]),

    apiKeys: defineTable({
        projectId: v.optional(v.id("projects")),
        userId: v.id("users"),
        key: v.optional(v.string()),
        name: v.string(),
        createdAt: v.optional(v.number()),
        displayKey: v.optional(v.string()),
        hashedKey: v.optional(v.string()),
        requestsCount: v.optional(v.number()),
        revoked: v.optional(v.boolean()),
    })
        .index("by_project", ["projectId"])
        .index("by_userId", ["userId"])
        .index("by_key", ["key"])
        .index("by_hashedKey", ["hashedKey"]),
    
    
    // List of domains
    disposableDomains: defineTable({
        domain: v.string(),
        addedAt: v.number(),
        addedBy: v.optional(v.string()), // "seed" | "admin" | userId
        hasMx: v.optional(v.boolean()),  // true = validated DNS (real MX/A record)
    }).index("by_domain", ["domain"]),
    
    
    // This will show the logs on user end
    verificationLogs: defineTable({
        projectId: v.optional(v.id("projects")),
        userId: v.id("users"),
        apiKeyId: v.optional(v.id("apiKeys")),
        email: v.string(),
        valid: v.boolean(),
        score: v.float64(),
        reason: v.optional(v.string()),
        timestamp: v.float64(),
    })
        .index("by_project", ["projectId"])
        .index("by_user", ["userId"]),
});
