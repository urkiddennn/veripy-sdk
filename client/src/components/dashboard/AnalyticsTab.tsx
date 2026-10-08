import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { Activity, Zap, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AnalyticsTab() {
    const user = useQuery(api.users.viewer);
    const userId = user?._id;
    const stats = useQuery(api.verify.getStats, userId ? { userId } : "skip");

    if (!stats) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-800" />
            </div>
        );
    }

    const metrics = [
        { label: 'Total Verified', value: stats.total, icon: <Zap className="w-4 h-4" />, color: 'text-white' },
        { label: 'Allow Rate', value: `${stats.allowPercentage.toFixed(1)}%`, icon: <Shield className="w-4 h-4" />, color: 'text-emerald-500' },
        { label: 'Block Rate', value: `${stats.blockPercentage.toFixed(1)}%`, icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500' },
        { label: 'Avg Accuracy', value: `${stats.successRate.toFixed(1)}%`, icon: <Activity className="w-4 h-4" />, color: 'text-sky-500' },
    ];

    return (
        <div className="py-12 space-y-12 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {metrics.map((m, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{m.label}</span>
                            <div className={`opacity-20 ${m.color}`}>{m.icon}</div>
                        </div>
                        <h2 className="text-3xl font-light tracking-tight text-white">{m.value}</h2>
                    </div>
                ))}
            </div>

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Request Throughput</h3>
                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Rolling 7-day visualization</p>
                    </div>
                </div>

                <div className="relative h-[300px] w-full bg-neutral-900/20 border border-white/5 rounded-md p-8 overflow-hidden group">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.timeSeries}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#525252', fontSize: 10, fontFamily: 'monospace' }}
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
                                    padding: '8px 12px'
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
                                activeDot={{ r: 4, fill: '#fff' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
