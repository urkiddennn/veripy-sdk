import { z } from 'zod';
import { VeripyClient, VerifyOptions } from './index';

export interface VeripyZodOptions extends VerifyOptions {
  blockDisposable?: boolean;
  minScore?: number;
  message?: string;
}

/**
 * Creates a Zod asynchronous string refinement for Veripy email verification.
 *
 * @param client VeripyClient instance
 * @param options Validation rules (minScore, blockDisposable, custom message)
 * @returns ZodType that verifies email deliverability
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { VeripyClient } from 'veripy-sdk';
 * import { veripyEmail } from 'veripy-sdk/zod';
 *
 * const client = new VeripyClient({ apiKey: 'vp_xxx' });
 * const schema = z.object({
 *   email: veripyEmail(client, { blockDisposable: true, minScore: 0.7 })
 * });
 * ```
 */
export function veripyEmail(
  client: VeripyClient,
  options?: VeripyZodOptions,
): z.ZodEffects<z.ZodString, string, string> {
  const minScore = options?.minScore ?? 0.5;
  const blockDisposable = options?.blockDisposable ?? true;
  const message = options?.message || 'Invalid or undeliverable email address';

  return z
    .string()
    .email()
    .refine(
      async (email) => {
        try {
          const res = await client.verify(email, options);
          if (!res.valid) return false;
          if (blockDisposable && res.isDisposable) return false;
          if (res.score < minScore) return false;
          return true;
        } catch {
          return false;
        }
      },
      { message },
    );
}

export default veripyEmail;
