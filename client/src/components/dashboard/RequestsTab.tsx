import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Search, ChevronDown, ChevronRight, RefreshCw, ShieldCheck, Zap, Loader2, Code2 } from 'lucide-react';
import Modal from '../ui/Modal';

export default function RequestsTab({ projectId }: { projectId?: Id<"projects"> }) {
    const userId = localStorage.getItem('veripy_user_id') as Id<"users"> | null;
    const [searchTerm, setSearchTerm] = useState('');

    // Convex queries are reactive, but we can force a "refresh" by changing a dependency
    // though it's technically redundant in Convex, it satisfies user expectation for a button action.
    const logs = useQuery(api.verify.listLogs, userId ? { userId, projectId } : "skip");
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'allow' | 'block'>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filteredLogs = useMemo(() => {
        if (!logs) return [];
        return logs.filter(log => {
            const matchesSearch = log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.reason?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'allow' && log.valid) ||
                (statusFilter === 'block' && !log.valid);

            return matchesSearch && matchesStatus;
        });
    }, [logs, searchTerm, statusFilter]);

    const handleRefresh = () => {
        // Convex is reactive, so manual refresh is usually not needed.
        // We'll just provide a visual feedback or leave it for now.
    };

    return (
        <div className="py-12 space-y-8 animate-fade-in text-left">
            <div className="flex items-center justify-between">
                <div className="relative group max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-900/50 border border-white/5 rounded-md pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-white/10 transition-all font-medium text-white uppercase tracking-wider"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all text-xs font-bold uppercase tracking-widest border ${isFilterOpen ? 'bg-neutral-900 border-white/10 text-white' : 'text-neutral-500 hover:text-white border-transparent hover:border-white/5'}`}
                        >
                            <span>{statusFilter === 'all' ? 'All Status' : statusFilter === 'allow' ? 'Allow' : 'Block'}</span>
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-neutral-900 border border-white/10 rounded-md shadow-2xl z-50 py-1 overflow-hidden animate-fade-in-up">
                                {(['all', 'allow', 'block'] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setStatusFilter(s);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors ${statusFilter === s ? 'text-white' : 'text-neutral-500'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-neutral-900 rounded-md transition-colors border border-transparent hover:border-white/5 group"
                    >
                        <RefreshCw className={`w-3 h-3 text-neutral-600 group-hover:text-white transition-all ${logs === undefined ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center text-xs font-bold text-neutral-600 uppercase tracking-[0.2em] px-6 mb-4 font-mono">
                    <div className="w-4" /> {/* Bullet space */}
                    <div className="w-[180px]">Time</div>
                    <div className="w-[200px]">Host</div>
                    <div className="flex-1">Path</div>
                    <div className="w-[120px] text-right">Reason</div>
                    <div className="w-10 pl-4" /> {/* Chevron space */}
                </div>

                {logs === undefined ? (
                    <div className="h-64 flex flex-col items-center justify-center border border-white/5 rounded-md bg-neutral-900/20">
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border border-white/5 rounded-md bg-neutral-900/20 text-neutral-600">
                        <ShieldCheck className="w-8 h-8 opacity-5 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">
                            {searchTerm ? 'No matching logs' : 'No activity found'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredLogs.map((row) => (
                            <div
                                key={row._id}
                                onClick={() => setSelectedLog(row)}
                                className="group flex items-center px-6 py-4 rounded-md border border-transparent hover:border-white/5 hover:bg-white/2 transition-all cursor-pointer"
                            >
                                <div className="w-4 flex items-center">
                                    <div className="w-1 h-1 rounded-full bg-neutral-700 group-hover:bg-neutral-500 transition-colors" />
                                </div>

                                <div className="w-[180px]">
                                    <span className="text-xs font-medium text-amber-500/70 group-hover:text-amber-500 transition-colors font-mono">
                                        {new Date(row.timestamp).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            fractionalSecondDigits: 2,
                                            hour12: false
                                        }).replace(',', '')}
                                    </span>
                                </div>

                                <div className="w-[200px]">
                                    <span className="text-sm font-medium text-sky-400/70 group-hover:text-sky-400 transition-colors">
                                        api.veripy.io
                                    </span>
                                </div>

                                <div className="flex-1 truncate">
                                    <span className="text-sm font-medium text-neutral-500 group-hover:text-neutral-300 transition-colors">
                                        {row.email}
                                    </span>
                                </div>

                                <div className="w-[120px] flex items-center justify-end gap-3 pr-2">
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className={`w-3 h-3 ${row.valid ? 'text-emerald-500' : 'text-red-500'}`} />
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors">
                                            {row.valid ? 'Allow' : 'Block'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5 text-neutral-500" />
                                        <span className="text-xs font-mono text-neutral-600 group-hover:text-neutral-400 transition-colors">
                                            {(row.score * 100).toFixed(0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="w-4 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title=""
                maxWidth="lg"
            >
                {selectedLog && (
                    <div className="bg-[#050505] text-neutral-400 font-sans p-6 rounded-md select-text">
                        {/* Header: ID and Icons */}
                        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">ID:</span>
                                <span className="text-[13px] font-mono text-white font-bold tracking-tight">{selectedLog._id}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Code2 className="w-3.5 h-3.5 text-neutral-600 hover:text-white cursor-pointer transition-colors" />
                            </div>
                        </div>

                        {/* Request Details Section */}
                        <div className="space-y-4 mb-10">
                            <div className="grid grid-cols-[100px_1fr] gap-x-8 items-center">
                                <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">Timestamp</span>
                                <span className="text-sm font-medium italic text-neutral-500">
                                    {new Date(selectedLog.timestamp).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        fractionalSecondDigits: 2,
                                        hour12: false
                                    }).replace(',', '')} <span className="text-neutral-700 not-italic">+08:00</span>
                                </span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-x-8 items-center">
                                <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">Target</span>
                                <span className="text-sm font-medium text-neutral-300">{selectedLog.email}</span>
                            </div>
                            {selectedLog.apiKeyId && (
                                <div className="grid grid-cols-[100px_1fr] gap-x-8 items-center">
                                    <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">Key ID</span>
                                    <span className="text-sm font-mono text-neutral-500">{selectedLog.apiKeyId}</span>
                                </div>
                            )}
                        </div>

                        {/* Allowed/Blocked Section */}
                        <div className="mb-10">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-6">
                                <div className="flex items-center gap-2">
                                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                                    <span className={`text-[13px] font-bold uppercase tracking-wider ${selectedLog.valid ? 'text-white' : 'text-red-500'}`}>
                                        {selectedLog.valid ? 'Allow' : 'Block'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 px-2">
                                <div className="grid grid-cols-[100px_1fr] gap-x-8 items-center">
                                    <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">Conclusion</span>
                                    <span className="text-sm font-bold text-white uppercase tracking-widest">{selectedLog.valid ? 'ALLOW' : 'BLOCK'}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-x-8 items-center">
                                    <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">Score</span>
                                    <span className="text-sm font-bold text-white uppercase tracking-widest">{(selectedLog.score * 100).toFixed(0)}/100</span>
                                </div>
                                {selectedLog.reason && (
                                    <div className="grid grid-cols-[100px_1fr] gap-x-8 items-center">
                                        <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">Reason</span>
                                        <span className="text-sm font-mono text-neutral-400 capitalize">{selectedLog.reason.replace('_', ' ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </Modal>
        </div>
    );
}
