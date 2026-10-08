import { useState } from "react";
import { Copy, Check, Rocket, Key, Terminal, FileSpreadsheet } from "lucide-react";
import { SiHono, SiPython } from "react-icons/si";
import { FaReact, FaNodeJs } from "react-icons/fa";
import LandingNavbar from "../components/layout/LandingNavbar";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { RiSpamFill } from "react-icons/ri";
import { CiClock1 } from "react-icons/ci";
import { Link } from "react-router-dom";

type SdkTab = "node" | "react" | "hono" | "python" | "sdk_defense" | "rate_limit" | "batch";

export default function Docs() {
  const [activeTab, setActiveTab] = useState<SdkTab>("node");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const examples = {
    node: {
      title: "Node.js",
      icon: <FaNodeJs className="w-4 h-4 text-emerald-400" />,
      install: "npm install veripy-sdk",
      code: `import { Veripy } from 'veripy-sdk';

const veripy = new Veripy({
  apiKey: process.env.VERIPY_API_KEY!,
  config: {
    spamDetection: true,
    rateLimit: true,
    timeoutMs: 5000
  }
});

const result = await veripy.verify('user@company.com');

if (result.isSafeToSend) {
  console.log(\`Verified \${result.email} (Score: \${result.score * 100}%)\`);
} else {
  console.warn(\`Rejected: \${result.reason} (Status: \${result.status})\`);
}`,
    },
    react: {
      title: "React / Vite",
      icon: <FaReact className="w-4 h-4 text-sky-400" />,
      install: "npm install veripy-sdk",
      code: `import { useState } from 'react';
import { Veripy } from 'veripy-sdk';

const veripy = new Veripy({
  apiKey: import.meta.env.VITE_VERIPY_API_KEY
});

export function SignupInput() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleValidate = async () => {
    const result = await veripy.verify(email);
    if (!result.valid) {
      setStatus(\`Invalid email: \${result.reason}\`);
    } else {
      setStatus('Email verified');
    }
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleValidate}
        placeholder="you@company.com"
      />
      {status && <span>{status}</span>}
    </div>
  );
}`,
    },
    hono: {
      title: "Hono / Edge",
      icon: <SiHono className="w-4 h-4 text-orange-400" />,
      install: "npm install veripy-sdk",
      code: `import { Hono } from 'hono';
import { Veripy } from 'veripy-sdk';

const app = new Hono();

app.post('/api/register', async (c) => {
  const { email } = await c.req.json();
  const veripy = new Veripy({ apiKey: c.env.VERIPY_API_KEY });

  const result = await veripy.verify(email);

  if (!result.valid) {
    return c.json({ error: 'Deliverability check failed', reason: result.reason }, 400);
  }

  // Proceed with user account creation...
  return c.json({ success: true });
});

export default app;`,
    },
    python: {
      title: "Python",
      icon: <SiPython className="w-4 h-4 text-yellow-400" />,
      install: "pip install requests",
      code: `import requests

VERIPY_API_KEY = "vp_live_your_key_here"

def verify_email(email: str):
    response = requests.post(
        "https://api.veripy.io/v1/verify",
        headers={"x-api-key": VERIPY_API_KEY, "Content-Type": "application/json"},
        json={"email": email},
        timeout=5
    )
    data = response.json()
    if response.status_code == 200:
        print(f"Valid: {data['valid']}, Score: {data['score']}")
    else:
        print(f"Error {response.status_code}: {data.get('error')}")

verify_email("candidate@domain.com")`,
    },
    sdk_defense: {
      title: "Spam Defense",
      icon: <RiSpamFill className="w-4 h-4 text-emerald-400" />,
      install: "npm install veripy-sdk",
      code: `import { Veripy, VeripySpamError } from 'veripy-sdk';

const veripy = new Veripy({
  apiKey: process.env.VERIPY_API_KEY!,
  config: {
    // Client-side spam protection catches automated sequential iterations
    // (e.g. bot testing test1@, test2@, test3@ within a 60s window)
    spamDetection: {
      enabled: true,
      windowMs: 60000,
      maxSimilarRequests: 3
    }
  }
});

try {
  await veripy.verify("spam.attack1@gmail.com");
} catch (err) {
  if (err instanceof VeripySpamError) {
    console.error("Local spam defense intercepted abusive iteration without consuming quota.");
  }
}`,
    },
    rate_limit: {
      title: "Rate Limiting",
      icon: <CiClock1 className="w-4 h-4 text-emerald-400" />,
      install: "npm install veripy-sdk",
      code: `import { Veripy, VeripyRateLimitError } from 'veripy-sdk';

const veripy = new Veripy({
  apiKey: process.env.VERIPY_API_KEY!,
  config: {
    // Token bucket rate-limiter prevents burst threshold spikes
    rateLimit: {
      enabled: true,
      burst: 20,
      tokensPerMinute: 60
    }
  }
});

try {
  const result = await veripy.verify('lead@domain.com');
} catch (err) {
  if (err instanceof VeripyRateLimitError) {
    console.warn(\`Rate limited. Retry after: \${err.retryAfterMs}ms\`);
  }
}`,
    },
    batch: {
      title: "Batch & CSV",
      icon: <FileSpreadsheet className="w-4 h-4 text-sky-400" />,
      install: "npm install veripy-sdk",
      code: `import { Veripy } from 'veripy-sdk';

const veripy = new Veripy({ apiKey: process.env.VERIPY_API_KEY! });

// 1. Verify Array of Emails concurrently
const emails = ['alex@gmail.com', 'temp@10minutemail.com', 'sarah@stripe.com'];
const batchResults = await veripy.verifyBatch(emails, { concurrency: 5 });

console.log(batchResults.map(r => ({ email: r.email, valid: r.result?.valid })));

// 2. Verify Raw CSV string
const rawCsv = "email,name\\nalex@gmail.com,Alex\\ntemp@tempmail.com,Temp";
const csvResult = await veripy.verifyCsv(rawCsv, { emailColumn: 'email' });

console.log(\`Total: \${csvResult.total}, Valid: \${csvResult.validCount}\`);
console.log(csvResult.csv); // Cleaned CSV string with veripy status columns`,
    },
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white/10 overflow-x-hidden pt-16">
      <LandingNavbar />

      <main className="max-w-4xl mx-auto px-6 py-20 text-left">
        {/* Header Section */}
        <div className="space-y-6 mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-neutral-400 uppercase tracking-widest">
            Veripy Documentation • v1.0.6
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Developer Documentation
          </h1>
          <p className="text-base text-neutral-400 max-w-2xl leading-relaxed font-normal">
            Integrate email verification, disposable domain blocking, DNS MX validation, and fraud protection into your registration and signup flows.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a href="#quickstart" className="px-3 py-1.5 rounded-md text-xs font-mono bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5 transition-colors">
              # Quickstart
            </a>
            <a href="#sdk-reference" className="px-3 py-1.5 rounded-md text-xs font-mono bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5 transition-colors">
              # SDK Reference
            </a>
            <a href="#http-api" className="px-3 py-1.5 rounded-md text-xs font-mono bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5 transition-colors">
              # REST API
            </a>
            <a href="#scores-and-status" className="px-3 py-1.5 rounded-md text-xs font-mono bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5 transition-colors">
              # Deliverability Scores
            </a>
            <a href="#webhooks" className="px-3 py-1.5 rounded-md text-xs font-mono bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5 transition-colors">
              # Webhooks
            </a>
          </div>
        </div>

        {/* Getting Started Guide */}
        <section id="quickstart" className="mb-24 scroll-mt-24 space-y-8 animate-fade-in-up">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              Getting Started
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-3 hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                <Key className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">1. Create Project & API Key</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Log in to the dashboard, create a workspace project, and generate a secret API key starting with <code className="text-neutral-300 font-mono">vp_live_</code>.
              </p>
            </div>

            <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-3 hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                <Terminal className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">2. Install Package</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Install <code className="text-neutral-300 font-mono">veripy-sdk</code> in your Node, Bun, Deno, or edge server runtime.
              </p>
            </div>

            <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-3 hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                <Rocket className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">3. Verify Inline</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Invoke <code className="text-neutral-300 font-mono">veripy.verify(email)</code> to block disposable domains and invalid mailboxes before saving user records.
              </p>
            </div>
          </div>
        </section>

        {/* Integration Code Playground */}
        <section id="sdk-reference" className="mb-24 scroll-mt-24 space-y-6">
          <div className="border-b border-white/5 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              SDK Examples & Framework Integration
            </h2>
            <span className="text-[11px] font-mono text-neutral-500">Node • Bun • Next • Edge</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
            {(["node", "react", "hono", "python", "sdk_defense", "rate_limit", "batch"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs uppercase tracking-wider font-mono transition-all ${
                  activeTab === tab
                    ? "bg-white text-black font-bold"
                    : "text-neutral-400 hover:text-white bg-white/5"
                }`}
              >
                {examples[tab].icon}
                {examples[tab].title}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Install Bar */}
            <div className="relative group">
              <div className="p-4 bg-neutral-950 border border-white/10 rounded-md font-mono text-xs text-neutral-300 flex items-center justify-between">
                <span><code>{examples[activeTab].install}</code></span>
                <button
                  onClick={() => copyToClipboard(examples[activeTab].install, `install-${activeTab}`)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
                  title="Copy command"
                >
                  {copiedKey === `install-${activeTab}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Code Block */}
            <div className="relative rounded-md border border-white/10 overflow-hidden bg-neutral-950">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-[11px] font-mono text-neutral-500 bg-neutral-900/40">
                <span>{examples[activeTab].title} Example</span>
                <button
                  onClick={() => copyToClipboard(examples[activeTab].code, `code-${activeTab}`)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  {copiedKey === `code-${activeTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === `code-${activeTab}` ? "Copied" : "Copy"}
                </button>
              </div>

              <SyntaxHighlighter
                language="typescript"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1.25rem",
                  background: "#0a0a0a",
                  fontSize: "0.8125rem",
                  lineHeight: "1.6",
                }}
              >
                {examples[activeTab].code}
              </SyntaxHighlighter>
            </div>
          </div>
        </section>

        {/* REST API Reference */}
        <section id="http-api" className="mb-24 scroll-mt-24 space-y-8">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              REST HTTP API Reference
            </h2>
          </div>

          <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold rounded border border-emerald-500/20">
                POST
              </span>
              <code className="text-white font-mono text-sm font-semibold">
                https://api.veripy.io/v1/verify
              </code>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              Direct HTTPS edge endpoint for validating an individual email address. Requires the API key passed in the <code className="text-white font-mono">x-api-key</code> header.
            </p>

            {/* Headers & Request Body */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-950 border border-white/5 rounded-md space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Headers</span>
                <pre className="font-mono text-xs text-neutral-300">
                  {`x-api-key: vp_live_...\nContent-Type: application/json`}
                </pre>
              </div>

              <div className="p-4 bg-neutral-950 border border-white/5 rounded-md space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Request Body</span>
                <pre className="font-mono text-xs text-neutral-300">
                  {`{\n  "email": "user@domain.com"\n}`}
                </pre>
              </div>
            </div>

            {/* Response Payload */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Response Payload (200 OK)</span>
              <pre className="p-4 bg-neutral-950 border border-white/5 rounded-md font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
{`{
  "valid": true,
  "email": "user@domain.com",
  "score": 0.95,
  "status": "deliverable",
  "isSafeToSend": true,
  "isRisky": false,
  "isDisposable": false,
  "results": {
    "syntax": true,
    "disposable": false,
    "mx_records": true,
    "mailbox": true
  },
  "timestamp": 1728439200000
}`}
              </pre>
            </div>

            {/* Schema Table */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Response Fields</span>
              <div className="border border-white/5 rounded-md overflow-hidden bg-neutral-950 text-xs">
                <table className="w-full font-mono">
                  <thead>
                    <tr className="border-b border-white/5 text-neutral-500 text-[10px] uppercase text-left bg-neutral-900/30">
                      <th className="p-3">Field</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-neutral-300">
                    <tr>
                      <td className="p-3 text-white">valid</td>
                      <td className="p-3 text-neutral-500">boolean</td>
                      <td className="p-3">High-level deliverability flag (true = safe to accept).</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white">score</td>
                      <td className="p-3 text-neutral-500">float (0.0 - 1.0)</td>
                      <td className="p-3">Deliverability confidence confidence score.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white">status</td>
                      <td className="p-3 text-neutral-500">string</td>
                      <td className="p-3">"deliverable" | "risky" | "undeliverable"</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white">results.disposable</td>
                      <td className="p-3 text-neutral-500">boolean</td>
                      <td className="p-3">True if email domain is detected in disposable/throwaway database.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white">results.mx_records</td>
                      <td className="p-3 text-neutral-500">boolean</td>
                      <td className="p-3">True if target domain resolves active DNS MX mail exchanges.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white">reason</td>
                      <td className="p-3 text-neutral-500">string | null</td>
                      <td className="p-3">"invalid_syntax" | "disposable_email" | "custom_blacklisted" | null</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Deliverability & Score Matrix */}
        <section id="scores-and-status" className="mb-24 scroll-mt-24 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              Deliverability Score Matrix
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-neutral-900/30 border border-emerald-500/20 rounded-lg space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Score ≥ 0.80 • Deliverable
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Legitimate mailbox on an authenticated domain with active MX records. Safe for transactional emails and welcome series.
              </p>
            </div>

            <div className="p-6 bg-neutral-900/30 border border-amber-500/20 rounded-lg space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Score 0.30–0.79 • Risky
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Domain has MX records but shows disposable patterns or custom blacklist flag. Recommended to prompt for verification confirmation.
              </p>
            </div>

            <div className="p-6 bg-neutral-900/30 border border-red-500/20 rounded-lg space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                Score &lt; 0.30 • Undeliverable
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Known throwaway service, malformed syntax, or nonexistent MX records. Block immediately to preserve sender reputation.
              </p>
            </div>
          </div>
        </section>

        {/* Webhooks Section */}
        <section id="webhooks" className="mb-24 scroll-mt-24 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              Webhooks & Event Notifications
            </h2>
          </div>

          <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-6">
            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              Configure Webhook endpoints in your project <strong>Settings &gt; Webhooks & Alerts</strong> tab to receive automated HTTP POST webhooks when events trigger.
            </p>

            <div className="border border-white/5 rounded-md overflow-hidden bg-neutral-950 text-xs">
              <table className="w-full font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-neutral-500 text-[10px] uppercase text-left bg-neutral-900/30">
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Trigger Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-300">
                  <tr>
                    <td className="p-3 text-white">verification.blocked</td>
                    <td className="p-3 text-neutral-400">Dispatched when a signup is rejected due to blacklist or disposable detection.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-white">disposable.spike</td>
                    <td className="p-3 text-neutral-400">Dispatched when disposable email rate exceeds abnormal volume in 5-minute window.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-white">quota.threshold_80</td>
                    <td className="p-3 text-neutral-400">Alert triggered when 80% of project monthly verification capacity is reached.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-white">quota.exceeded</td>
                    <td className="p-3 text-neutral-400">Alert triggered when quota is exhausted and subsequent requests are throttled.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Verifying Signatures (Node.js)</span>
              <pre className="p-4 bg-neutral-950 border border-white/5 rounded-md font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
{`import crypto from 'crypto';

export function verifyWebhook(rawPayload: string, signature: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'v1=' + hmac.update(rawPayload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Status Codes */}
        <section className="mb-24 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              HTTP Error Codes & Rate Limits
            </h2>
          </div>

          <div className="border border-white/5 rounded-md overflow-hidden bg-neutral-950 text-xs">
            <table className="w-full font-mono">
              <thead>
                <tr className="border-b border-white/5 text-neutral-500 text-[10px] uppercase text-left bg-neutral-900/30">
                  <th className="p-3">Status</th>
                  <th className="p-3">Meaning</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-300">
                <tr>
                  <td className="p-3 text-emerald-400 font-bold">200 OK</td>
                  <td className="p-3">Verification completed</td>
                  <td className="p-3 text-neutral-400">Parse deliverability payload.</td>
                </tr>
                <tr>
                  <td className="p-3 text-amber-400 font-bold">400 Bad Request</td>
                  <td className="p-3">Missing or empty email</td>
                  <td className="p-3 text-neutral-400">Ensure email parameter is passed in request body.</td>
                </tr>
                <tr>
                  <td className="p-3 text-red-400 font-bold">401 Unauthorized</td>
                  <td className="p-3">Missing x-api-key header</td>
                  <td className="p-3 text-neutral-400">Provide a valid API key in request header.</td>
                </tr>
                <tr>
                  <td className="p-3 text-red-400 font-bold">403 Forbidden</td>
                  <td className="p-3">Revoked or invalid API key</td>
                  <td className="p-3 text-neutral-400">Regenerate API key in project dashboard.</td>
                </tr>
                <tr>
                  <td className="p-3 text-amber-400 font-bold">429 Too Many Requests</td>
                  <td className="p-3">Burst rate limit or quota exceeded</td>
                  <td className="p-3 text-neutral-400">Check Retry-After header or upgrade project quota tier.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-xs font-mono gap-4">
          <p className="uppercase tracking-widest text-[11px]">
            Veripy Developer Reference
          </p>
          <div className="flex items-center gap-6">
            <Link to="/projects" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/docs" className="hover:text-white transition-colors">
              API Docs
            </Link>
            <span>v1.0.6</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
