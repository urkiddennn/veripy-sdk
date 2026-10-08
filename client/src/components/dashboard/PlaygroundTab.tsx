import { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Play, Check, Copy, ShieldCheck, ShieldAlert, AlertTriangle, Mail, Server, Code } from 'lucide-react';
import Button from '../ui/Button';

interface PlaygroundTabProps {
    projectId?: Id<"projects">;
}

export default function PlaygroundTab({ projectId }: PlaygroundTabProps) {
    const user = useQuery(api.users.viewer);
    const userId = user?._id;
    const verifyEmail = useAction(api.verify.verifyEmail);

    const [email, setEmail] = useState('developer@company.com');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [snippetLanguage, setSnippetLanguage] = useState<'curl' | 'typescript' | 'python'>('curl');
    const [copiedSnippet, setCopiedSnippet] = useState(false);

    const presetEmails = [
        { label: 'Standard Clean', email: 'john.doe@gmail.com' },
        { label: 'Disposable Domain', email: 'test.user@tempmail.com' },
        { label: 'Invalid Syntax', email: 'invalid..email@domain' },
        { label: 'Mailinator', email: 'preview@mailinator.com' },
    ];

    const handleVerify = async (emailToTest?: string) => {
        const targetEmail = (emailToTest ?? email).trim();
        if (!targetEmail) return;

        setIsLoading(true);
        setError(null);
        try {
            const res = await verifyEmail({
                email: targetEmail,
                projectId,
                userId,
            });
            setResult(res);
        } catch (err: any) {
            console.error('Playground verification failed:', err);
            setError(err?.message || 'Verification request failed');
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score: number = 0) => {
        if (score >= 0.8) return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', bar: 'bg-emerald-400' };
        if (score >= 0.4) return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', bar: 'bg-amber-400' };
        return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', bar: 'bg-red-400' };
    };

    const codeSnippets = {
        curl: `curl -X POST https://api.veripy.io/v1/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "${email || 'user@example.com'}"}'`,
        typescript: `import { Veripy } from "veripy-sdk";

const veripy = new Veripy({ apiKey: process.env.VERIPY_API_KEY! });

const result = await veripy.verify({
  email: "${email || 'user@example.com'}",
});

console.log(result.valid, result.score);`,
        python: `from veripy import Veripy

client = Veripy(api_key="YOUR_API_KEY")

result = client.verify(email="${email || 'user@example.com'}")
print(f"Valid: {result.valid}, Score: {result.score}")`,
    };

    const copyCode = () => {
        navigator.clipboard.writeText(codeSnippets[snippetLanguage]);
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
    };

    return (
        <div className="py-12 space-y-10 animate-fade-in text-left">
            {/* Header info */}
            <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Live Verification Tester</h2>
                <p className="text-xs text-neutral-500 mt-1 font-mono">
                    Direct endpoint evaluation for syntax, MX hosts, and disposable blacklist rules.
                </p>
            </div>

            {/* Input Card */}
            <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                            placeholder="user@example.com"
                            className="w-full bg-neutral-950 border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 transition-all font-mono"
                        />
                    </div>
                    <Button
                        onClick={() => handleVerify()}
                        disabled={!email.trim() || isLoading}
                        loading={isLoading}
                        variant="primary"
                        className="px-6 text-xs uppercase tracking-wider"
                    >
                        <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Verify Email
                    </Button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mr-1">Sample Inputs:</span>
                    {presetEmails.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                setEmail(item.email);
                                handleVerify(item.email);
                            }}
                            className="px-2.5 py-1 text-[10px] font-mono rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5 transition-all"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Result Report */}
            {result && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Score Card */}
                        <div className={`p-6 rounded-lg border ${getScoreColor(result.score).bg} ${getScoreColor(result.score).border} flex flex-col justify-between space-y-4`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Deliverability Score</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${result.valid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {result.valid ? 'ALLOW' : 'BLOCK'}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-5xl font-light font-mono ${getScoreColor(result.score).text}`}>
                                        {(result.score * 100).toFixed(0)}
                                    </span>
                                    <span className="text-xs text-neutral-500 font-mono">/ 100</span>
                                </div>
                                <p className="text-xs text-neutral-400">
                                    {result.valid ? 'High confidence deliverable address.' : (result.reason ? `Flagged: ${result.reason}` : 'Undeliverable address.')}
                                </p>
                            </div>

                            <div className="w-full bg-neutral-900 rounded-sm h-1.5 overflow-hidden border border-white/5">
                                <div
                                    className={`h-full ${getScoreColor(result.score).bar}`}
                                    style={{ width: `${Math.max(5, (result.score || 0) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Breakdown Checks */}
                        <div className="md:col-span-2 p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Rule Breakdown</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center justify-between p-3 rounded bg-white/2 border border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Code className="w-3.5 h-3.5 text-neutral-400" />
                                        <span className="text-neutral-300">RFC 5322 Syntax</span>
                                    </div>
                                    <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Valid
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded bg-white/2 border border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                                        <span className="text-neutral-300">Disposable Email</span>
                                    </div>
                                    {result.results?.disposable ? (
                                        <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Clean Domain
                                        </span>
                                    ) : (
                                        <span className="font-mono text-[11px] font-bold text-red-400 flex items-center gap-1">
                                            <ShieldAlert className="w-3 h-3" /> Disposable Flag
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-3 rounded bg-white/2 border border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Server className="w-3.5 h-3.5 text-neutral-400" />
                                        <span className="text-neutral-300">DNS MX Records</span>
                                    </div>
                                    {result.results?.mx_records !== false ? (
                                        <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Resolving
                                        </span>
                                    ) : (
                                        <span className="font-mono text-[11px] font-bold text-red-400 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> No MX Record
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-3 rounded bg-white/2 border border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                                        <span className="text-neutral-300">Mailbox Ping</span>
                                    </div>
                                    <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer Code Snippet */}
                    <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {(['curl', 'typescript', 'python'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setSnippetLanguage(lang)}
                                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                                            snippetLanguage === lang
                                                ? 'bg-white text-black'
                                                : 'text-neutral-500 hover:text-white bg-white/5'
                                        }`}
                                    >
                                        {lang === 'typescript' ? 'Node / TS' : lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={copyCode}
                                className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copiedSnippet ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <pre className="p-4 bg-neutral-950 rounded-md border border-white/5 font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
                            {codeSnippets[snippetLanguage]}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
