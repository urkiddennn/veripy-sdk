import { Copy } from "lucide-react";
import { SiHono } from "react-icons/si";
import { FaReact, FaNodeJs } from "react-icons/fa";
import LandingNavbar from "../components/layout/LandingNavbar";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { RiSpamFill } from "react-icons/ri";
import { title } from "framer-motion/client";
import { CiClock1 } from "react-icons/ci";

export default function Docs() {
  const [activeTab, setActiveTab] = useState<
    "node" | "react" | "hono" | "sdk_defense" | "rate_limit"
  >("node");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const examples = {
    node: {
      title: "Node.js",
      icon: <FaNodeJs className="w-5 h-5 text-emerald-400" />,
      install: "npm install @veripy/sdk",
      code: `import { VeripyClient } from '@veripy/sdk';

const veripy = new VeripyClient({
  apiKey: process.env.VERIPY_API_KEY
});

const result = await veripy.verify('user@email.com');
if (!result.valid) {
  console.log('Reason:', result.results[0].reason);
}`,
    },
    react: {
      title: "React / Vite",
      icon: <FaReact className="w-5 h-5 text-sky-400" />,
      install: "npm install @veripy/sdk",
      code: `import { VeripyClient } from '@veripy/sdk';

// ProTip: Use on your backend to protect signups
// Or use in your frontend for instant feedback

const veripy = new VeripyClient({
  apiKey: import.meta.env.VITE_VERIPY_API_KEY
});

const handleBlur = async (email) => {
  const { valid } = await veripy.verify(email);
  if (!valid) alert('Please use a real email!');
};`,
    },
    hono: {
      title: "Hono",
      icon: <SiHono className="w-5 h-5 text-orange-400" />,
      install: "npm install @veripy/sdk",
      code: `import { Hono } from 'hono';
import { VeripyClient } from '@veripy/sdk';

const app = new Hono();

app.post('/signup', async (c) => {
  const { email } = await c.req.json();
  const veripy = new VeripyClient({ apiKey: c.env.VERIPY_API_KEY });

  const { valid } = await veripy.verify(email);
  if (!valid) return c.json({ error: 'Invalid email' }, 400);

  // Continue signup...
});`,
    },
    sdk_defense: {
      title: "Spam Defense",
      icon: <RiSpamFill className="w-5 h-5 text-emerald-400" />,
      install: "npm install @veripy/sdk",
      code: `import { VeripyClient } from '@veripy/sdk';

const veripy = new VeripyClient({ apiKey: 'vp_...' });

// The SDK automatically blocks automated iteration spam locally
// so you never waste API requests or hit backend limits!
const emailsToTest = ["test1@gmail.com", "test2@gmail.com", "test3@gmail.com"];

for (const email of emailsToTest) {
    try {
        await veripy.verify(email);
        console.log(\`Verified \${email}\`);
    } catch (e) {
        // Automatically throws: "Veripy Error: Spam behavior detected."
        console.error(e.message);
    }
}`,
    },
    rate_limit: {
      title: "Rate Limiting",
      icon: <CiClock1 className="w-5 h-5 text-emerald-400" />,
      install: "npm install @veripy/sdk",

      code: `import { VeripyClient } from '@veripy/sdk';

const veripy = new VeripyClient({
  apiKey: process.env.VERIPY_API_KEY
});

const result = await veripy.verify('user@email.com');
if (!result.valid) {
  console.log('Reason:', result.results[0].reason);
}`,
    },
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white/10 overflow-x-hidden pt-16">
      <LandingNavbar />

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Welcome Section */}
        <div className="space-y-6 mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-normal text-neutral-400 uppercase tracking-widest">
            Welcome to Veripy
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-white italic">
            Clean your list,{" "}
            <span className="text-neutral-500 font-normal">
              save your reach.
            </span>
          </h1>
          <p className="text-md text-neutral-400 font-thin max-w-2xl leading-relaxed">
            Simple email verification to keep your lists clean and your emails
            out of the spam folder.
          </p>
        </div>

        {/* Integration Tabs */}
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4">
            <div className="flex flex-wrap items-center gap-8">
              {(
                ["node", "react", "hono", "sdk_defense", "rate_limit"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 pb-4 -mb-4 border-b-2 transition-all text-xs uppercase tracking-widest focus:outline-none ${
                    activeTab === tab
                      ? "border-white text-white font-bold"
                      : "border-transparent text-neutral-600 hover:text-neutral-400 font-normal"
                  }`}
                >
                  {examples[tab].icon}
                  {examples[tab].title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-10 animate-fade-in-up">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 italic">
                  Installation
                </h3>
              </div>
              <div className="relative group">
                <pre className="p-5 bg-neutral-900/50 border border-white/5 rounded-md font-mono text-sm text-neutral-300">
                  <code>{examples[activeTab].install}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(examples[activeTab].install)}
                  className="absolute right-4 top-4 p-2 hover:bg-white/5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 italic">
                  Usage Example
                </h3>
              </div>
              <div className="relative group rounded-md border border-white/5 overflow-hidden">
                <SyntaxHighlighter
                  language="typescript"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: "2rem",
                    background: "rgba(23, 23, 23, 0.8)",
                    fontSize: "0.875rem",
                  }}
                >
                  {examples[activeTab].code}
                </SyntaxHighlighter>
                <button
                  onClick={() => copyToClipboard(examples[activeTab].code)}
                  className="absolute right-6 top-6 p-2 hover:bg-white/5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* API Specs */}
        <section className="mt-32 pt-20 border-t border-white/5 space-y-12">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Direct API Access</h2>
            <p className="text-neutral-500 text-sm font-thin">
              Don't want to use the SDK? Hit our edge endpoints directly.
            </p>
          </div>

          <div className="p-8 bg-neutral-900/30 border border-white/5 rounded-md space-y-6">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-[10px] font-bold rounded-md border border-sky-500/20 uppercase">
                POST
              </span>
              <code className="text-white font-bold tracking-wider">
                /v1/verify
              </code>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-1 h-1 rounded-full bg-neutral-700" />
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Requires <code className="text-neutral-200">x-api-key</code>{" "}
                  header for authentication.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-1 h-1 rounded-full bg-neutral-700" />
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Body:{" "}
                  <code className="text-neutral-200">{`{ "email": "valid@email.com" }`}</code>
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-40 pt-10 border-t border-white/5 flex items-center justify-between opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-500">
            Veripy Documentation
          </p>
          <div className="flex gap-6 text-md">v0.0.1</div>
        </footer>
      </main>
    </div>
  );
}
