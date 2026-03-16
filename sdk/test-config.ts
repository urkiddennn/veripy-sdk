import { VeripyClient } from './src/index';

// Mock fetch globally so we don't actually hit the network
(globalThis as any).fetch = async () => ({
  ok: true,
  json: async () => ({ valid: true })
});

async function test() {
  console.log('--- Testing Rate Limiting (Enabled) ---');
  const rlClient = new VeripyClient({
    apiKey: 'test-key',
    config: { rateLimit: true, spamDetection: false }
  });
  
  try {
    // Attempt 11 requests rapidly (limit is 10)
    for (let i = 0; i < 11; i++) {
      console.log(`Request ${i + 1}`);
      await rlClient.verify('test' + i + '@example.com');
    }
    console.log('FAILED: Rate limit did not trigger');
  } catch (e: any) {
    console.log('SUCCESS: Caught expected rate limit error:', e.message);
  }

  console.log('\n--- Testing Spam Detection (Enabled) ---');
  const spamClient = new VeripyClient({ 
      apiKey: 'test-key',
      config: { spamDetection: true, rateLimit: false }
  });
  try {
    await spamClient.verify('user1@example.com');
    await spamClient.verify('user2@example.com');
    await spamClient.verify('user3@example.com');
    console.log('Request 4 (should fail)...');
    await spamClient.verify('user4@example.com');
    console.log('FAILED: Spam detection did not trigger');
  } catch (e: any) {
    console.log('SUCCESS: Caught expected spam error:', e.message);
  }

  console.log('\n--- Testing Config Disabled ---');
  const disabledClient = new VeripyClient({
    apiKey: 'test-key',
    config: { spamDetection: false, rateLimit: false }
  });
  
  try {
    for (let i = 0; i < 15; i++) {
        await disabledClient.verify('user1@example.com');
    }
    console.log('SUCCESS: Bypassed both local checks as requested.');
  } catch (e: any) {
      console.log('FAILED: Unexpected error:', e.message);
  }

  console.log('\n--- Testing Per-Call Override ---');
  const overrideClient = new VeripyClient({
    apiKey: 'test-key',
    config: { spamDetection: true, rateLimit: true }
  });

  try {
    // This should bypass despite global config being TRUE
    for (let i = 0; i < 15; i++) {
        await overrideClient.verify('user1@example.com', { spamDetection: false, rateLimit: false });
    }
    console.log('SUCCESS: Per-call override worked.');
  } catch (e: any) {
      console.log('FAILED: Override did not work:', e.message);
  }
}

test();
