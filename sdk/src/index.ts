interface VerifyResult {
  valid: boolean;
  email: string;
  results: {
    syntax: boolean;
    disposable: boolean;
    mx_records: boolean;
    mailbox: boolean;
  };
  score: number;
  timestamp: number;
}

export interface VeripyConfig {
  spamDetection?: boolean;
  rateLimit?: boolean;
}

export class VeripyClient {
  private url: string;
  private apiKey: string;
  private globalConfig: Required<VeripyConfig>;

  // Local memory cache for spam detection
  private history: { email: string; timestamp: number }[] = [];
  private readonly SPAM_WINDOW_MS = 60000; // 1 minute window
  private readonly MAX_SIMILAR_REQUESTS = 3; // Block after 3 similar variations

  constructor(options: { url?: string; apiKey: string; config?: VeripyConfig }) {
    this.url =
      options.url || "https://lovable-alpaca-951.eu-west-1.convex.site";

    if (!options.apiKey) {
      throw new Error("VeripyClient requires an apiKey.");
    }
    this.apiKey = options.apiKey;
    this.globalConfig = {
      spamDetection: options.config?.spamDetection ?? true,
      rateLimit: options.config?.rateLimit ?? true,
    };
  }

  /**
   * Helper to detect if two emails are highly similar variations
   * (e.g., test1@example.com and test2@example.com)
   */
  private isSimilar(email1: string, email2: string): boolean {
    const [local1, domain1] = email1.toLowerCase().split("@");
    const [local2, domain2] = email2.toLowerCase().split("@");

    if (domain1 !== domain2) return false;

    // Strip trailing numbers from the local part (e.g. 'test12' -> 'test')
    const base1 = local1.replace(/\d+$/, "");
    const base2 = local2.replace(/\d+$/, "");

    // Also catch "plus addressing" variations (e.g. user+1@gmail.com and user+2@gmail.com)
    const plusBase1 = local1.split("+")[0];
    const plusBase2 = local2.split("+")[0];

    return base1 === base2 || plusBase1 === plusBase2;
  }

  /**
   * Helper for built in rate limiter (Token Bucket)
   */
  private tokens: number = 10; // default starting burst
  private lastRefill: number = Date.now();
  private readonly MAX_TOKENS = 10;
  private readonly REFILL_RATE_PER_MS = 10 / (60 * 1000); // 10 tokens per minute

  private checkRateLimit(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    // Refill tokens based on time passed
    this.tokens = Math.min(
      this.MAX_TOKENS,
      this.tokens + timePassed * this.REFILL_RATE_PER_MS,
    );
    this.lastRefill = now;

    if (this.tokens < 1) {
      throw new Error(
        "Veripy Error: Rate limit exceeded locally. Slow down your requests.",
      );
    }

    this.tokens -= 1;
  }

  /**
   * Verifies an email address.
   * @param email The email address to verify.
   * @param config Optional configuration to override global settings.
   * @returns A Promise resolving to the verification result.
   */
  async verify(email: string, config?: VeripyConfig): Promise<VerifyResult> {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Veripy Error: Invalid email format provided to SDK.");
    }

    const activeConfig = { ...this.globalConfig, ...config };
    const now = Date.now();

    // 1. Local Rate Limiting
    if (activeConfig.rateLimit) {
      this.checkRateLimit();
    }

    // 2. Local Spam Detection
    if (activeConfig.spamDetection) {
      // Clean up history older than our window
      this.history = this.history.filter(
        (req) => now - req.timestamp < this.SPAM_WINDOW_MS,
      );

      // Check for spam behavior locally
      const similarCount = this.history.filter((req) =>
        this.isSimilar(req.email, email),
      ).length;

      if (similarCount >= this.MAX_SIMILAR_REQUESTS) {
        throw new Error(
          "Veripy Error: Spam behavior detected. Too many highly similar requests locally.",
        );
      }

      // Add to local history
      this.history.push({ email, timestamp: now });
    }

    const response = await fetch(`${this.url}/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(
        `Veripy API Error: ${response.status} - ${error.error || response.statusText}`,
      );
    }

    return (await response.json()) as VerifyResult;
  }
}

export default VeripyClient;
