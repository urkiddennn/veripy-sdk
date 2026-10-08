import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VeripyClient,
  VeripyError,
  VeripyValidationError,
  VeripyRateLimitError,
  VeripySpamError,
  VeripyApiError,
  VeripyTimeoutError,
} from './index';
import { veripyEmail } from './zod';
import { z } from 'zod';

describe('VeripyClient', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          valid: true,
          email: 'test@example.com',
          score: 0.95,
          timestamp: Date.now(),
          results: { syntax: true, disposable: false, mx_records: true, mailbox: true },
        }),
      })),
    );
  });

  it('should initialize with default config and default URL', () => {
    const client = new VeripyClient({ apiKey: 'test-key' });
    expect(client).toBeDefined();
  });

  it('should require apiKey', () => {
    expect(() => new VeripyClient({ apiKey: '' })).toThrow(VeripyError);
  });

  it('should use custom URL and trim emails', async () => {
    const customUrl = 'https://custom.api.veripy.com';
    const client = new VeripyClient({ apiKey: 'test-key', url: customUrl });

    await client.verify('  test@example.com  ');
    expect(fetch).toHaveBeenCalledWith(
      `${customUrl}/v1/verify`,
      expect.objectContaining({
        body: JSON.stringify({ email: 'test@example.com' }),
      }),
    );
  });

  it('should throw VeripyValidationError for invalid email format', async () => {
    const client = new VeripyClient({ apiKey: 'test-key' });
    await expect(client.verify('invalid-email')).rejects.toThrow(VeripyValidationError);
  });

  describe('Enriched Status Helpers', () => {
    it('should compute deliverable status and isSafeToSend', async () => {
      const client = new VeripyClient({ apiKey: 'test-key', config: { rateLimit: false } });
      const res = await client.verify('good@example.com');

      expect(res.status).toBe('deliverable');
      expect(res.isSafeToSend).toBe(true);
      expect(res.isRisky).toBe(false);
      expect(res.isDisposable).toBe(false);
    });

    it('should compute risky status when score is between 0.3 and 0.8', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => ({
            valid: true,
            email: 'risky@example.com',
            score: 0.5,
            results: { syntax: true, disposable: false, mx_records: true, mailbox: false },
          }),
        })),
      );

      const client = new VeripyClient({ apiKey: 'test-key', config: { rateLimit: false } });
      const res = await client.verify('risky@example.com');

      expect(res.status).toBe('risky');
      expect(res.isSafeToSend).toBe(false);
      expect(res.isRisky).toBe(true);
    });

    it('should compute undeliverable status when invalid or disposable', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => ({
            valid: false,
            email: 'fake@tempmail.com',
            score: 0.1,
            results: { syntax: true, disposable: true, mx_records: false, mailbox: false },
          }),
        })),
      );

      const client = new VeripyClient({ apiKey: 'test-key', config: { rateLimit: false } });
      const res = await client.verify('fake@tempmail.com');

      expect(res.status).toBe('undeliverable');
      expect(res.isSafeToSend).toBe(false);
      expect(res.isDisposable).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits when enabled and expose retryAfterMs', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: true, spamDetection: false },
      });

      for (let i = 0; i < 10; i++) {
        await expect(client.verify(`test${i}@example.com`)).resolves.toBeDefined();
      }

      await expect(client.verify('test11@example.com')).rejects.toThrow(VeripyRateLimitError);
    });

    it('should support custom burst and tokensPerMinute', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: {
          rateLimit: { burst: 2, tokensPerMinute: 2 },
          spamDetection: false,
        },
      });

      await expect(client.verify('a@example.com')).resolves.toBeDefined();
      await expect(client.verify('b@example.com')).resolves.toBeDefined();
      await expect(client.verify('c@example.com')).rejects.toThrow(VeripyRateLimitError);
    });

    it('should bypass rate limits when disabled', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: false, spamDetection: false },
      });

      for (let i = 0; i < 15; i++) {
        await expect(client.verify(`test${i}@example.com`)).resolves.toBeDefined();
      }
    });
  });

  describe('Spam Detection', () => {
    it('should detect spam when enabled on similar emails', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { spamDetection: true, rateLimit: false },
      });

      await client.verify('user1@example.com');
      await client.verify('user2@example.com');
      await client.verify('user3@example.com');

      await expect(client.verify('user4@example.com')).rejects.toThrow(VeripySpamError);
    });

    it('should detect spam on plus addressing variations', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { spamDetection: true, rateLimit: false },
      });

      await client.verify('john+1@example.com');
      await client.verify('john+2@example.com');
      await client.verify('john+3@example.com');

      await expect(client.verify('john+4@example.com')).rejects.toThrow(VeripySpamError);
    });

    it('should NOT falsely flag purely numeric emails as spam', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { spamDetection: true, rateLimit: false },
      });

      await expect(client.verify('1001@example.com')).resolves.toBeDefined();
      await expect(client.verify('2002@example.com')).resolves.toBeDefined();
      await expect(client.verify('3003@example.com')).resolves.toBeDefined();
      await expect(client.verify('4004@example.com')).resolves.toBeDefined();
      await expect(client.verify('5005@example.com')).resolves.toBeDefined();
    });

    it('should support custom maxSimilarRequests option', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: {
          rateLimit: false,
          spamDetection: { maxSimilarRequests: 2, windowMs: 10000 },
        },
      });

      await client.verify('account1@example.com');
      await client.verify('account2@example.com');
      await expect(client.verify('account3@example.com')).rejects.toThrow(VeripySpamError);
    });
  });

  describe('API Errors and Retries', () => {
    it('should throw VeripyApiError on 401 unauthorized', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'Invalid API Key' }),
        })),
      );

      const client = new VeripyClient({ apiKey: 'bad-key', config: { rateLimit: false } });
      await expect(client.verify('test@example.com')).rejects.toThrow(VeripyApiError);
    });

    it('should retry on 500 error when retries configured', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          callCount++;
          if (callCount === 1) {
            return {
              ok: false,
              status: 500,
              statusText: 'Internal Server Error',
              json: async () => ({ error: 'Database timeout' }),
            };
          }
          return {
            ok: true,
            json: async () => ({ valid: true, email: 'test@example.com', score: 1.0 }),
          };
        }),
      );

      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: false, spamDetection: false, retries: 1 },
      });

      const res = await client.verify('test@example.com');
      expect(res.valid).toBe(true);
      expect(callCount).toBe(2);
    });

    it('should throw VeripyTimeoutError when request times out', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url, options) =>
            new Promise((_resolve, reject) => {
              if (options?.signal) {
                options.signal.addEventListener('abort', () => {
                  const err: any = new Error('The operation was aborted');
                  err.name = 'AbortError';
                  reject(err);
                });
              }
            }),
        ),
      );

      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: false, spamDetection: false, timeoutMs: 10 },
      });

      await expect(client.verify('test@example.com')).rejects.toThrow(VeripyTimeoutError);
    });
  });

  describe('Batch Verification', () => {
    it('should verify multiple emails concurrently with bounded results', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: false, spamDetection: false },
      });

      const emails = ['user1@example.com', 'invalid-email', 'user2@example.com'];
      const results = await client.verifyBatch(emails, { concurrency: 2 });

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].result?.valid).toBe(true);

      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeInstanceOf(VeripyValidationError);

      expect(results[2].success).toBe(true);
      expect(results[2].result?.valid).toBe(true);
    });
  });

  describe('CSV Verification', () => {
    it('should parse CSV, verify emails and append veripy status columns', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: false, spamDetection: false },
      });

      const csvData = `name,email,company\nAlice,alice@example.com,Acme\nBob,bob@example.com,Beta`;
      const result = await client.verifyCsv(csvData, { concurrency: 2 });

      expect(result.total).toBe(2);
      expect(result.validCount).toBe(2);
      expect(result.rows[0].email).toBe('alice@example.com');
      expect(result.rows[0].veripy_valid).toBe(true);
      expect(result.rows[0].veripy_status).toBe('deliverable');
      expect(result.csv).toContain('veripy_valid,veripy_status,veripy_score,veripy_disposable');
      expect(result.csv).toContain('Alice,alice@example.com,Acme,true,deliverable');
    });
  });

  describe('Zod Integration', () => {
    it('should validate email using Zod schema', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: false, spamDetection: false },
      });

      const schema = z.object({
        email: veripyEmail(client, { blockDisposable: true, minScore: 0.7 }),
      });

      await expect(schema.parseAsync({ email: 'valid@example.com' })).resolves.toBeDefined();
      await expect(schema.parseAsync({ email: 'not-an-email' })).rejects.toThrow();
    });
  });
});
