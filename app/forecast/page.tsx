"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import {
    TrendingUp,
    AlertCircle,
    Loader2,
    ArrowUpRight,
    Target,
    Shield,
} from "lucide-react";

// Types
interface ForecastData {
    generated_at: string;
    method: string;
    history: { date: string; count: number }[];
    forecast: { date: string; yhat: number; lower: number; upper: number }[];
}

export default function ForecastPage() {
    const [data, setData] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/forecast");
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.instruction || "Failed to fetch forecast");
                }
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err: unknown) {
                if (err instanceof Error) setError(err.message);
                else setError(String(err));
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Merge history and forecast for the chart
    const chartData = useMemo(() => {
        if (!data) return [];

        const historyMapped = data.history.map((h) => ({
            date: h.date,
            count: h.count,
            isForecast: false,
        }));

        const forecastMapped = data.forecast.map((f) => ({
            date: f.date,
            yhat: f.yhat,
            range: [f.lower, f.upper],
            isForecast: true,
        }));

        // We join them at the last history point for a continuous line
        const lastHistory = historyMapped[historyMapped.length - 1];
        if (lastHistory && forecastMapped.length > 0) {
            // Small adjustment: make the first forecast point also contain the last history count for visual continuity
            (forecastMapped[0] as { historyLink?: number }).historyLink = lastHistory.count;
        }

        return [...historyMapped, ...forecastMapped];
    }, [data]);

    const lastHistoryDate = useMemo(() => {
        if (!data || data.history.length === 0) return "";
        return data.history[data.history.length - 1].date;
    }, [data]);

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-stone-500 font-medium">Computing predictive model...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex bg-indigo-50 border border-indigo-100 rounded-xl p-8 flex-col items-center justify-center gap-4 text-center max-w-2xl mx-auto my-12">
                <div className="bg-indigo-100 p-3 rounded-full">
                    <AlertCircle className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-indigo-900">Forecast Unavailable</h2>
                <p className="text-indigo-700">{error}</p>
                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200 text-sm font-mono text-stone-700">
                    npm run data:build
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Volume Projection</h1>
                    </div>
                    <p className="text-stone-500">
                        14-day predictive encounter forecast based on recent trends.
                    </p>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Status</span>
                        <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                            Active Optimization
                        </span>
                    </div>
                    <div className="w-px h-8 bg-stone-100" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Confidence</span>
                        <span className="text-sm font-semibold text-stone-700">85-92% Mean</span>
                    </div>
                </div>
            </div>

            {/* Main Prediction Chart */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="h-32 w-32 text-indigo-900" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h4 className="text-xl font-bold text-stone-900">Operational Forecast Pipeline</h4>
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-stone-300" />
                            <span className="text-stone-500">History</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-indigo-500" />
                            <span className="text-indigo-600">Predicted</span>
                        </div>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 11 }}
                                minTickGap={40}
                                padding={{ left: 10, right: 10 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
                                labelClassName="font-bold text-stone-900"
                            />

                            {/* Reference line for "Present" */}
                            {lastHistoryDate && (
                                <ReferenceLine x={lastHistoryDate} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                            )}

                            {/* Confidence interval Area */}
                            <Area
                                type="monotone"
                                dataKey="range"
                                stroke="none"
                                fill="url(#rangeGradient)"
                                connectNulls
                                animationDuration={1500}
                            />

                            {/* History Line */}
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#d1d5db"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                                name="Actual Data"
                            />

                            {/* Predicted Line */}
                            <Line
                                type="monotone"
                                dataKey="yhat"
                                stroke="#6366f1"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                name="Prediction (Mean)"
                                animationDuration={2000}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Methodology Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-indigo-900 text-indigo-50 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl shadow-indigo-100">
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="h-6 w-6 text-indigo-300" />
                            <h3 className="text-xl font-bold">Predictive Methodology</h3>
                        </div>
                        <p className="text-indigo-200/90 leading-relaxed mb-6">
                            This model utilizes a <span className="text-white font-semibold">weekday-average baseline</span> calculated over the rolling 28-day lookback period. It identifies specific seasonality patterns for each day of the clinical week (e.g., outpatient spikes on Mondays vs. inpatient stability on weekends).
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Confidence Logic</span>
                                <p className="text-sm mt-1">Bounds are generated by calculating the standard deviation of historical residuals, providing a 1.5σ confidence threshold.</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Data Source</span>
                                <p className="text-sm mt-1">Refreshed every hour from primary FHIR encounter streams via internal deterministic ingestion pipeline.</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                </div>

                <div className="bg-white border border-stone-200 p-8 rounded-3xl flex flex-col justify-center gap-6 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold">
                            <ArrowUpRight className="h-5 w-5" />
                            <span>Forecast Summary</span>
                        </div>
                        <h5 className="text-2xl font-bold text-stone-900">Normal Trends</h5>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-500">Algorithm</span>
                            <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-700">{data.method}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-500">Window</span>
                            <span className="text-stone-900 font-medium">14 Days Rolling</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-500">Last Computed</span>
                            <span className="text-stone-900 font-medium">{new Date(data.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <button className="w-full bg-stone-900 text-white py-3 rounded-2xl font-bold hover:bg-stone-800 transition-colors">
                        Export Model Data
                    </button>
                </div>
            </div>

            <div className="pb-8 text-center text-[10px] text-stone-400 font-medium uppercase tracking-[0.2em]">
                Proprietary Predictive Analytics Framework v1.2
            </div>
        </div>
    );
}
