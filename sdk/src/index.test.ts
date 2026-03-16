import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VeripyClient } from './index';

describe('VeripyClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ valid: true, email: 'test@example.com', score: 0.9 })
    })));
  });

  it('should initialize with default config', () => {
    const client = new VeripyClient({ apiKey: 'test-key' });
    expect(client).toBeDefined();
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits when enabled', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: true, spamDetection: false }
      });

      // Attempt 11 requests rapidly (limit is 10)
      for (let i = 0; i < 10; i++) {
        await expect(client.verify(`test${i}@example.com`)).resolves.toBeDefined();
      }
      
      await expect(client.verify('test11@example.com')).rejects.toThrow('Rate limit exceeded');
    });

    it('should bypass rate limits when disabled', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { rateLimit: false, spamDetection: false }
      });

      for (let i = 0; i < 15; i++) {
        await expect(client.verify(`test${i}@example.com`)).resolves.toBeDefined();
      }
    });
  });

  describe('Spam Detection', () => {
    it('should detect spam when enabled', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { spamDetection: true, rateLimit: false }
      });

      // Spam limit is 3 in VeripyClient
      await client.verify('user1@example.com');
      await client.verify('user2@example.com');
      await client.verify('user3@example.com');
      
      await expect(client.verify('user4@example.com')).rejects.toThrow(/Spam behavior detected/);
    });
  });

  describe('Overrides', () => {
    it('should allow per-call overrides', async () => {
      const client = new VeripyClient({
        apiKey: 'test-key',
        config: { spamDetection: true, rateLimit: true }
      });

      // Bypass despite global config being TRUE
      for (let i = 0; i < 15; i++) {
        await expect(client.verify('user1@example.com', { spamDetection: false, rateLimit: false }))
          .resolves.toBeDefined();
      }
    });
  });
});
