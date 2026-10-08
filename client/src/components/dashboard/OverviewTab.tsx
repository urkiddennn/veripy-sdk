import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Activity, Zap, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function OverviewTab({ projectId }: { projectId?: Id<"projects"> }) {
    const user = useQuery(api.users.viewer);
    const userId = user?._id;
    const stats = useQuery(api.verify.getStats, userId ? { userId, projectId } : "skip");
    const quotaInfo = useQuery(api.projects.getUsageAndQuota, projectId ? { projectId } : "skip");

    const usedCount = quotaInfo?.used ?? (stats?.total ?? 0);
    const quotaLimit = quotaInfo?.quota ?? 10000;
    const usagePercent = quotaInfo?.percentage ?? Math.min(100, Number(((usedCount / quotaLimit) * 100).toFixed(1)));
    const isNearLimit = quotaInfo?.isNearLimit ?? usagePercent >= 80;

    return (
        <div className="py-12 space-y-12 animate-fade-in text-left">
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Total Requests</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-light tracking-tight text-white">{stats?.total ?? 0}</h2>
                        <Zap className="w-3 h-3 text-neutral-700" />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Allow</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-light tracking-tight text-white">{stats?.allowPercentage?.toFixed(1) ?? '0.0'}%</h2>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Block</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-light tracking-tight text-white">{stats?.blockPercentage?.toFixed(1) ?? '0.0'}%</h2>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Error</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-light tracking-tight text-white">{stats?.errorPercentage?.toFixed(1) ?? '0.0'}%</h2>
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                    </div>
                </div>
            </div>

            {/* Quota & Rate Limit Gauge Card */}
            <div className="p-6 bg-neutral-900/30 border border-white/5 rounded-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <Gauge className="w-4 h-4 text-white" />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Monthly Verification Quota</h3>
                            <p className="text-[11px] text-neutral-500 font-mono">
                                {quotaInfo?.plan ?? "Developer Free Plan"} • Resets on {quotaInfo?.resetDate ?? "Next billing cycle"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isNearLimit ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                <AlertTriangle className="w-3 h-3" /> Approaching Quota ({usagePercent}%)
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3" /> Healthy ({usagePercent}%)
                            </span>
                        )}
                        <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-neutral-300 text-[10px] font-mono">
                            {quotaInfo?.rateLimitRps ?? 100} req/s burst limit
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="w-full bg-neutral-900 rounded-sm h-1.5 overflow-hidden border border-white/5">
                        <div
                            className={`h-full transition-all duration-500 ${
                                isNearLimit ? 'bg-amber-400' : 'bg-white'
                            }`}
                            style={{ width: `${Math.max(2, usagePercent)}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                        <span>
                            <strong className="text-white font-medium">{usedCount.toLocaleString()}</strong> of {quotaLimit.toLocaleString()} verifications used
                        </span>
                        <span>
                            <strong className="text-neutral-300">{Math.max(0, quotaLimit - usedCount).toLocaleString()}</strong> remaining
                        </span>
                    </div>
                </div>
            </div>

            {/* Traffic Activity Chart */}
            <div className="pt-6 border-t border-white/5 group/chart">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-neutral-500" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Traffic Activity (Last 7 Days)</h3>
                    </div>
                </div>

                <div className="h-32 w-full mt-8">
                    {stats?.timeSeries && (
                        <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.timeSeries}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#525252', fontSize: 9, fontFamily: 'monospace' }}
                                        tickFormatter={(date: string) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        dy={10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0a0a0a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#ffffff"
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 3, fill: '#ffffff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
