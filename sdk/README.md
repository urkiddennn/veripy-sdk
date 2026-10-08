# veripy-sdk

The official Node.js / TypeScript SDK for the Veripy Email Verification API.

## Installation

```bash
npm install veripy-sdk
```

## Basic Usage

```typescript
import { VeripyClient } from 'veripy-sdk';

const client = new VeripyClient({
  apiKey: 'vp_your_api_key_here'
});

const result = await client.verify('test@example.com');

// High-level computed status helpers
if (result.isSafeToSend) {
  console.log('Safe to send email!');
} else if (result.isRisky) {
  console.warn('Risky deliverability score');
}
console.log('Status:', result.status); // 'deliverable' | 'risky' | 'undeliverable'
```

## Zod Schema Validation

Verify emails asynchronously directly within Zod schemas (e.g. Next.js server actions, tRPC, Remix):

```typescript
import { z } from 'zod';
import { VeripyClient } from 'veripy-sdk';
import { veripyEmail } from 'veripy-sdk/zod';

const client = new VeripyClient({ apiKey: 'vp_xxx' });

const SignupSchema = z.object({
  email: veripyEmail(client, {
    blockDisposable: true,
    minScore: 0.7,
    message: 'Please provide a valid, deliverable work or personal email'
  })
});

const data = await SignupSchema.parseAsync(req.body);
```

## CSV Batch Verification

Verify CSV files directly with automatic email column detection and multi-threaded worker pool:

```typescript
import fs from 'fs';

const csvContent = fs.readFileSync('leads.csv', 'utf-8');

const { csv, total, validCount, invalidCount, rows } = await client.verifyCsv(csvContent, {
  concurrency: 10,
  emailColumn: 'email' // optional: auto-detected if omitted
});

console.log(`Processed ${total} rows. ${validCount} valid, ${invalidCount} invalid.`);

// Save enriched CSV with veripy_valid, veripy_status, veripy_score columns
fs.writeFileSync('leads_verified.csv', csv);
```

## Batch Verification (Array)

```typescript
const emails = ['user1@example.com', 'user2@example.com', 'invalid@domain.com'];

const results = await client.verifyBatch(emails, { concurrency: 5 });

for (const item of results) {
  if (item.success) {
    console.log(item.email, item.result?.status);
  } else {
    console.error(item.email, item.error?.message);
  }
}
```

## Configuration

```typescript
const client = new VeripyClient({
  apiKey: 'vp_your_api_key_here',
  config: {
    rateLimit: {
      burst: 20,
      tokensPerMinute: 60
    },
    spamDetection: {
      maxSimilarRequests: 5,
      windowMs: 30000
    },
    timeoutMs: 8000,
    retries: 2
  }
});
```

## Error Handling

```typescript
import {
  VeripyClient,
  VeripyValidationError,
  VeripyRateLimitError,
  VeripySpamError,
  VeripyApiError,
  VeripyTimeoutError
} from 'veripy-sdk';

try {
  await client.verify('test@example.com');
} catch (error) {
  if (error instanceof VeripyRateLimitError) {
    console.warn(`Local rate limit reached. Retry in ${error.retryAfterMs}ms`);
  } else if (error instanceof VeripySpamError) {
    console.warn('Spam behavior detected locally');
  } else if (error instanceof VeripyApiError) {
    console.error(`API Error ${error.status}:`, error.data);
  } else if (error instanceof VeripyValidationError) {
    console.error('Invalid email format');
  } else if (error instanceof VeripyTimeoutError) {
    console.error('Request timed out');
  }
}
```

## Types

```typescript
export type EmailDeliverability = 'deliverable' | 'risky' | 'undeliverable';

export interface VerifyResult {
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
  reason?: string;
  status: EmailDeliverability;
  isSafeToSend: boolean;
  isRisky: boolean;
  isDisposable: boolean;
}
```

## License
ISC
