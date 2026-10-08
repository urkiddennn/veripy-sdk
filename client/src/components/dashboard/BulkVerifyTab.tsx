import { useState, useRef } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Upload, FileText, Play, Download, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

interface BulkVerifyTabProps {
    projectId?: Id<"projects">;
}

interface BatchItem {
    email: string;
    valid?: boolean;
    score?: number;
    reason?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
}

export default function BulkVerifyTab({ projectId }: BulkVerifyTabProps) {
    const user = useQuery(api.users.viewer);
    const userId = user?._id;
    const verifyEmail = useAction(api.verify.verifyEmail);

    const [inputMode, setInputMode] = useState<'paste' | 'file'>('paste');
    const [rawText, setRawText] = useState('support@stripe.com\ntemp@10minutemail.com\nhello@github.com\nuser@tempmail.com\ninvalid-email@');
    const [items, setItems] = useState<BatchItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'blocked'>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseEmailsFromText = (text: string) => {
        const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        // Also capture non-valid tokens if separated by line for syntax error testing
        const lineTokens = text
            .split(/[\r\n,;]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && s.includes('@'));

        const combined = Array.from(new Set([...matches, ...lineTokens])).slice(0, 200);
        return combined.map((email) => ({
            email,
            status: 'pending' as const,
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const parsed = parseEmailsFromText(content);
                setItems(parsed);
                setRawText(parsed.map((p) => p.email).join('\n'));
            }
        };
        reader.readAsText(file);
    };

    const startBatchVerification = async () => {
        let list = items;
        if (list.length === 0) {
            list = parseEmailsFromText(rawText);
            setItems(list);
        }
        if (list.length === 0) return;

        setIsProcessing(true);
        setProgress(0);

        const updatedList = [...list];
        let completed = 0;

        // Process with concurrency limit of 3
        const concurrency = 3;
        for (let i = 0; i < updatedList.length; i += concurrency) {
            const chunk = updatedList.slice(i, i + concurrency);
            await Promise.all(
                chunk.map(async (item, chunkIndex) => {
                    const index = i + chunkIndex;
                    updatedList[index].status = 'processing';
                    setItems([...updatedList]);

                    try {
                        const result = await verifyEmail({
                            email: item.email,
                            projectId,
                            userId,
                        });
                        updatedList[index] = {
                            email: item.email,
                            valid: result.valid,
                            score: result.score,
                            reason: result.reason || (result.valid ? 'Deliverable' : 'Undeliverable'),
                            status: 'done',
                        };
                    } catch (error) {
                        updatedList[index] = {
                            email: item.email,
                            valid: false,
                            score: 0,
                            reason: 'API Error',
                            status: 'error',
                        };
                    }
                    completed++;
                    setProgress(Math.round((completed / updatedList.length) * 100));
                    setItems([...updatedList]);
                })
            );
        }

        setIsProcessing(false);
    };

    const completedItems = items.filter((i) => i.status === 'done' || i.status === 'error');
    const validCount = items.filter((i) => i.valid === true).length;
    const blockedCount = items.filter((i) => i.status === 'done' && i.valid === false).length;

    const filteredItems = items.filter((i) => {
        if (filterStatus === 'valid') return i.valid === true;
        if (filterStatus === 'blocked') return i.valid === false;
        return true;
    });

    const exportCSV = (validOnly = false) => {
        const source = validOnly ? items.filter((i) => i.valid) : items;
        if (source.length === 0) return;

        const escapeCsvField = (field: string | number) => {
            const str = String(field).replace(/"/g, '""');
            if (/^[=+\-@\t\r]/.test(str)) {
                return `"'${str}"`;
            }
            return `"${str}"`;
        };

        const headers = ["Email", "Status", "Score", "Reason"];
        const rows = source.map((i) => [
            escapeCsvField(i.email),
            i.valid ? "ALLOW" : "BLOCK",
            i.score !== undefined ? (i.score * 100).toFixed(0) : "N/A",
            escapeCsvField(i.reason || 'Pending'),
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `veripy-batch-${validOnly ? 'valid-' : 'all-'}${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="py-12 space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Bulk Email Verifier</h2>
                <p className="text-xs text-neutral-500 mt-1">
                    Upload a CSV file or paste email lists to verify hundreds of addresses in bulk.
                </p>
            </div>

            {/* Input Selection */}
            <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-6">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <button
                        onClick={() => setInputMode('paste')}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${
                            inputMode === 'paste' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-white'
                        }`}
                    >
                        Paste List
                    </button>
                    <button
                        onClick={() => setInputMode('file')}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${
                            inputMode === 'file' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-white'
                        }`}
                    >
                        Upload CSV / TXT
                    </button>
                </div>

                {inputMode === 'paste' ? (
                    <div className="space-y-3">
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            disabled={isProcessing}
                            rows={5}
                            placeholder="Paste emails separated by newlines, commas, or semicolons..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-md p-3 text-xs text-white font-mono focus:outline-none focus:border-white/30 transition-all"
                        />
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                            <span>Detected roughly {parseEmailsFromText(rawText).length} email addresses</span>
                            <span>Max 200 emails per batch</span>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 border border-dashed border-white/10 rounded-lg hover:border-white/20 hover:bg-white/2 cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-2"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".csv,.txt"
                            className="hidden"
                        />
                        <Upload className="w-6 h-6 text-neutral-400" />
                        <p className="text-xs font-bold uppercase tracking-wider text-white">Click or drag a CSV file here</p>
                        <p className="text-[11px] text-neutral-500">Supports .csv or .txt with email column</p>
                        {items.length > 0 && (
                            <p className="text-xs font-mono text-emerald-400 pt-2">Loaded {items.length} emails from file</p>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <Button
                        onClick={startBatchVerification}
                        disabled={isProcessing}
                        loading={isProcessing}
                        variant="primary"
                        className="px-6 text-xs uppercase tracking-wider"
                    >
                        <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                        {isProcessing ? `Processing (${progress}%)` : 'Start Bulk Verification'}
                    </Button>

                    {completedItems.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Button onClick={() => exportCSV(false)} variant="secondary" className="text-[10px]">
                                <Download className="w-3 h-3 mr-1" /> Export All
                            </Button>
                            <Button onClick={() => exportCSV(true)} variant="secondary" className="text-[10px]">
                                <Download className="w-3 h-3 mr-1 text-emerald-400" /> Export Valid Only ({validCount})
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
                <div className="space-y-2 p-5 bg-neutral-900/30 border border-white/5 rounded-lg animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            Verifying batch...
                        </span>
                        <span>{completedItems.length} of {items.length} ({progress}%)</span>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-sm h-1.5 overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Summary Metrics */}
            {completedItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-neutral-900/30 border border-white/5 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Processed</p>
                            <p className="text-2xl font-light font-mono text-white mt-1">{completedItems.length}</p>
                        </div>
                        <FileText className="w-5 h-5 text-neutral-600" />
                    </div>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Deliverable</p>
                            <p className="text-2xl font-light font-mono text-emerald-400 mt-1">{validCount}</p>
                        </div>
                        <ShieldCheck className="w-5 h-5 text-emerald-500/40" />
                    </div>

                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Blocked / Risky</p>
                            <p className="text-2xl font-light font-mono text-red-400 mt-1">{blockedCount}</p>
                        </div>
                        <ShieldAlert className="w-5 h-5 text-red-500/40" />
                    </div>
                </div>
            )}

            {/* Batch Table */}
            {items.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {(['all', 'valid', 'blocked'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setFilterStatus(filter)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                        filterStatus === filter
                                            ? 'bg-white text-black'
                                            : 'bg-white/5 text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        <span className="text-xs font-mono text-neutral-500">
                            Showing {filteredItems.length} records
                        </span>
                    </div>

                    <div className="border border-white/5 rounded-lg overflow-hidden bg-neutral-900/20 divide-y divide-white/5 font-mono text-xs">
                        {filteredItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-white/2 transition-colors">
                                <span className="text-neutral-200 truncate max-w-sm">{item.email}</span>

                                <div className="flex items-center gap-4 shrink-0">
                                    {item.status === 'processing' && (
                                        <span className="text-[10px] uppercase text-neutral-500 flex items-center gap-1.5">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Verifying
                                        </span>
                                    )}

                                    {item.status === 'pending' && (
                                        <span className="text-[10px] uppercase text-neutral-600">Pending</span>
                                    )}

                                    {item.status === 'done' && (
                                        <>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                item.valid
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {item.valid ? 'ALLOW' : 'BLOCK'}
                                            </span>
                                            <span className="text-neutral-400 w-12 text-right">
                                                {item.score !== undefined ? `${(item.score * 100).toFixed(0)}%` : '-'}
                                            </span>
                                            <span className="text-neutral-500 text-[11px] w-28 truncate text-right">
                                                {item.reason}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
