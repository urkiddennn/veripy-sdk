# veripy-sdk

The official Node.js wrapper for the Veripy Email Verification API.

## Installation

```bash
npm install veripy-sdk
```

## Usage

```typescript
import VeripyClient from 'veripy-sdk';

const client = new VeripyClient({
  apiKey: 'vp_your_api_key_here'
});

async function run() {
  const result = await client.verify('test@example.com');
  console.log(result);
  /**
   * {
   *   valid: true,
   *   email: "test@example.com",
   *   results: {
   *     syntax: true,
   *     disposable: false,
   *     mx_records: true,
   *     mailbox: true
   *   },
   *   score: 0.95,
   *   timestamp: 1741512345678
   * }
   */
}

run();
```
