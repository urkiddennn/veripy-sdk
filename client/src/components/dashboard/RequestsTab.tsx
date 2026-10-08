import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Search, ChevronDown, ChevronRight, RefreshCw, ShieldCheck, Zap, Loader2, Code2, Download, FileSpreadsheet, FileJson, SlidersHorizontal, X } from 'lucide-react';
import Modal from '../ui/Modal';

export default function RequestsTab({ projectId }: { projectId?: Id<"projects"> }) {
    const user = useQuery(api.users.viewer);
    const userId = user?._id;
    const [searchTerm, setSearchTerm] = useState('');

    const logs = useQuery(api.verify.listLogs, userId ? { userId, projectId } : "skip");
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'allow' | 'block'>('all');
    const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);

    const filteredLogs = useMemo(() => {
        if (!logs) return [];
        const now = Date.now();
        return logs.filter(log => {
            const matchesSearch = log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.reason?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'allow' && log.valid) ||
                (statusFilter === 'block' && !log.valid);

            const matchesScore = scoreFilter === 'all' ||
                (scoreFilter === 'high' && log.score >= 0.8) ||
                (scoreFilter === 'medium' && log.score >= 0.4 && log.score < 0.8) ||
                (scoreFilter === 'low' && log.score < 0.4);

            let matchesTime = true;
            if (timeFilter === '24h') matchesTime = now - log.timestamp <= 24 * 60 * 60 * 1000;
            else if (timeFilter === '7d') matchesTime = now - log.timestamp <= 7 * 24 * 60 * 60 * 1000;
            else if (timeFilter === '30d') matchesTime = now - log.timestamp <= 30 * 24 * 60 * 60 * 1000;

            return matchesSearch && matchesStatus && matchesScore && matchesTime;
        });
    }, [logs, searchTerm, statusFilter, scoreFilter, timeFilter]);

    const hasActiveFilters = statusFilter !== 'all' || scoreFilter !== 'all' || timeFilter !== 'all' || searchTerm.trim() !== '';

    const handleClearFilters = () => {
        setStatusFilter('all');
        setScoreFilter('all');
        setTimeFilter('all');
        setSearchTerm('');
    };

    const escapeCsvField = (field: string | number) => {
        const str = String(field).replace(/"/g, '""');
        if (/^[=+\-@\t\r]/.test(str)) {
            return `"'${str}"`;
        }
        return `"${str}"`;
    };

    const handleExportCSV = () => {
        if (!filteredLogs.length) return;
        const headers = ["Timestamp", "Date (ISO)", "Host", "Email", "Status", "Score", "Reason"];
        const rows = filteredLogs.map((log) => [
            log.timestamp,
            new Date(log.timestamp).toISOString(),
            "api.veripy.io",
            escapeCsvField(log.email),
            log.valid ? "ALLOW" : "BLOCK",
            (log.score * 100).toFixed(0),
            escapeCsvField(log.reason || "valid_address")
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `veripy-requests-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportOpen(false);
    };

    const handleExportJSON = () => {
        if (!filteredLogs.length) return;
        const jsonContent = JSON.stringify(filteredLogs, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `veripy-requests-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportOpen(false);
    };

    const handleRefresh = () => {
        // Reactive Convex query
    };

    return (
        <div className="py-12 space-y-8 animate-fade-in text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative group max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search email or reason..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-900/50 border border-white/5 rounded-md pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-white/10 transition-all font-medium text-white tracking-wider"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-bold uppercase tracking-widest border ${isFilterOpen ? 'bg-neutral-900 border-white/10 text-white' : 'text-neutral-500 hover:text-white border-white/5 bg-neutral-900/40'}`}
                        >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>
                                {statusFilter === 'all' && scoreFilter === 'all' && timeFilter === 'all' ? 'Filters' : 'Filtered'}
                            </span>
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-md shadow-2xl z-50 p-3 space-y-3 text-xs animate-fade-in-up">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Status</p>
                                    <div className="grid grid-cols-3 gap-1">
                                        {(['all', 'allow', 'block'] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStatusFilter(s)}
                                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${statusFilter === s ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Score Range</p>
                                    <div className="grid grid-cols-2 gap-1">
                                        {[
                                            { id: 'all', label: 'All' },
                                            { id: 'high', label: '≥ 80 High' },
                                            { id: 'medium', label: '40-79 Med' },
                                            { id: 'low', label: '< 40 Low' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setScoreFilter(item.id as any)}
                                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${scoreFilter === item.id ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Time Window</p>
                                    <div className="grid grid-cols-4 gap-1">
                                        {[
                                            { id: 'all', label: 'All' },
                                            { id: '24h', label: '24h' },
                                            { id: '7d', label: '7d' },
                                            { id: '30d', label: '30d' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setTimeFilter(item.id as any)}
                                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${timeFilter === item.id ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="w-full pt-2 border-t border-white/5 text-[10px] text-neutral-500 hover:text-red-400 font-bold uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-1"
                                    >
                                        <X className="w-3 h-3" /> Reset Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Export Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            disabled={filteredLogs.length === 0}
                            className="flex items-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-bold uppercase tracking-widest border border-white/5 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Download className="w-3 h-3" />
                            <span>Export</span>
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isExportOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-neutral-900 border border-white/10 rounded-md shadow-2xl z-50 py-1 overflow-hidden animate-fade-in-up">
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 text-neutral-300 hover:text-white transition-colors text-left"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Export CSV</span>
                                </button>
                                <button
                                    onClick={handleExportJSON}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 text-neutral-300 hover:text-white transition-colors text-left"
                                >
                                    <FileJson className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Export JSON</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-neutral-900 rounded-md transition-colors border border-transparent hover:border-white/5 group"
                        title="Live logs connected"
                    >
                        <RefreshCw className={`w-3 h-3 text-neutral-600 group-hover:text-white transition-all ${logs === undefined ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filter Summary & Count */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono px-1">
                <div>
                    Showing <span className="text-white font-bold">{filteredLogs.length}</span> of <span className="text-neutral-400">{logs?.length ?? 0}</span> events
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="ml-3 text-[10px] font-sans text-neutral-400 hover:text-white underline uppercase tracking-wider"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-600 font-sans">
                    Live Stream Active
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
