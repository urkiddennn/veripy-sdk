import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rl, {
    verifyEndpoint: { kind: "token bucket", rate: 50, period: MINUTE, capacity: 60 },
    loginAttempt: { kind: "token bucket", rate: 5, period: MINUTE, capacity: 10 },
});
