# veripy-sdk

The official Node.js wrapper for the Veripy Email Verification API.

## Installation

```bash
npm install veripy-sdk
```

## Basic Usage

```typescript
import VeripyClient from 'veripy-sdk';

const client = new VeripyClient({
  apiKey: 'vp_your_api_key_here'
});

const result = await client.verify('test@example.com');
console.log(result);
```

## Configuration

You can configure local security features to prevent API abuse and save on credits.

```typescript
const client = new VeripyClient({
  apiKey: 'vp_your_api_key_here',
  config: {
    rateLimit: true,     // Enable local token bucket rate limiting (Default: true)
    spamDetection: true  // Enable local similar-email detection (Default: true)
  }
});
```

### Local Rate Limiting
The SDK includes a built-in token bucket rate limiter. By default, it allows a burst of **10 requests** and refills at a rate of **10 requests per minute**. This helps prevent accidental loops or spikes from consuming your API quota.

### Local Spam Detection
The SDK monitors request patterns and blocks "highly similar" email variations (e.g., `user1@gmail.com`, `user2@gmail.com`) if more than **3 variations** are sent within a **1 minute window**.

## Per-Call Overrides

You can override the global configuration for specific calls if needed.

```typescript
// Bypass local checks for a specific verification
const result = await client.verify('test@example.com', {
  rateLimit: false,
  spamDetection: false
});
```

## Types

### VerifyResult
```typescript
interface VerifyResult {
  valid: boolean;
  email: string;
  results: {
    syntax: boolean;
    disposable: boolean;
    mx_records: boolean;
    mailbox: boolean;
  };
  score: number;    // 0 to 1
  timestamp: number;
}
```

## License
ISC
