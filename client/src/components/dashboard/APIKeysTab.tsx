import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Plus, Copy, Check, Trash2, Key, Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function APIKeysTab({ projectId }: { projectId?: Id<"projects"> }) {
    const [name, setName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const user = useQuery(api.users.viewer);
    const userId = user?._id;
    const apiKeys = useQuery(api.apiKeys.listKeys, userId ? { userId, projectId } : "skip");
    const generateKey = useMutation(api.apiKeys.generateKey);
    const deleteKey = useMutation(api.apiKeys.deleteKey);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !userId) return;

        setIsGenerating(true);
        try {
            const result = await generateKey({ userId, projectId, name });
            setName('');

            // Show the newly generated key to the user (once only)
            const newKey = (result as any).key;
            if (newKey) {
                navigator.clipboard.writeText(newKey);
                setCopiedKey(newKey);
                alert("API Key copied to your clipboard! Securely store it now, as it will never be displayed in full again.");
                setTimeout(() => setCopiedKey(null), 3000);
            }
        } catch (error) {
            console.error("Failed to generate key:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="py-12 space-y-12 animate-fade-in">
            {/* Create New Key Section */}
            <div className="p-6 bg-neutral-900/20 border border-white/5 rounded-md space-y-4">
                <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-neutral-500" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Generate New Key</h3>
                </div>
                <form onSubmit={handleGenerate} className="flex gap-3">
                    <input
                        type="text"
                        placeholder="e.g. Production API"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/5 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-white/20 transition-all font-medium text-white"
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !name}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-md text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Generate
                    </button>
                </form>
            </div>

            {/* Keys Table/List */}
            <div className="space-y-4">
                <div className="flex items-center text-xs font-bold uppercase tracking-widest text-neutral-500 px-2">
                    <span className="flex-1">Active Keys</span>
                    <span className="w-32 text-right">Last Used</span>
                    <span className="w-32 text-right">Created</span>
                    <span className="w-20"></span>
                </div>

                <div className="space-y-px">
                    {apiKeys?.map((apiKey: any) => (
                        <div key={apiKey._id} className="group p-4 bg-neutral-900/10 border border-white/2 hover:bg-neutral-900/30 transition-all flex items-center gap-4">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white/90">{apiKey.name}</span>
                                    <span className="text-xs font-mono text-neutral-600 truncate max-w-[120px]">
                                        {apiKey.key || apiKey.displayKey || '••••••••'}
                                    </span>
                                    <button
                                        onClick={() => apiKey.key && copyToClipboard(apiKey.key)}
                                        disabled={!apiKey.key}
                                        className="p-1 hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:hidden"
                                    >
                                        {copiedKey === apiKey.key ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-neutral-500" />}
                                    </button>
                                </div>
                            </div>

                            <div className="w-32 text-right text-[10px] font-medium text-neutral-600">
                                {apiKey.requestsCount || 0} requests
                            </div>

                            <div className="w-32 text-right text-[10px] font-medium text-neutral-600">
                                {apiKey.createdAt ? new Date(apiKey.createdAt).toLocaleDateString() : 'N/A'}
                            </div>

                            <div className="w-20 flex justify-end">
                                <button
                                    onClick={() => deleteKey({ id: apiKey._id })}
                                    className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {apiKeys?.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-white/5 rounded-md">
                            <Shield className="w-6 h-6 text-neutral-700 mx-auto mb-3" />
                            <p className="text-sm text-neutral-500 font-medium tracking-tight">No active API keys found.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-md flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Security Reminder</p>
                    <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                        Your API keys grant access to the Veripy verification engine. Never share them in client-side code or public repositories.
                    </p>
                </div>
            </div>
        </div>
    );
}
