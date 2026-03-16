import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Activity, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function OverviewTab({ projectId }: { projectId?: Id<"projects"> }) {
    const userId = localStorage.getItem('veripy_user_id') as Id<"users"> | null;
    const stats = useQuery(api.verify.getStats, userId ? { userId, projectId } : "skip");

    return (
        <div className="py-12 space-y-12 animate-fade-in">
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

            <div className="pt-12 border-t border-white/5 group/chart">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-neutral-500" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Traffic Activity</h3>
                    </div>
                </div>

                <div className="h-32 w-full mt-8">
                    {stats?.timeSeries && (
                        <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.timeSeries}>
                                    <defs>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="2" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#404040', fontSize: 8, fontWeight: 'bold' }}
                                        tickFormatter={(date: string) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        dy={10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0a0a0a',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#fff"
                                        strokeWidth={1.5}
                                        dot={{ fill: '#fff', r: 0, strokeWidth: 0 }}
                                        activeDot={{ r: 3, fill: '#fff' }}
                                        filter="url(#glow)"
                                        animationDuration={1500}
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
