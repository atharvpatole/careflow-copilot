"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Users,
    Clock,
    RefreshCw,
    Filter,
    Calendar,
    AlertCircle,
    Loader2,
    Table as TableIcon,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Types
interface MetricsData {
    generated_at: string;
    kpis: {
        total_encounters: number;
        avg_los_days: number | null;
        revisit_rate_30d: number | null;
    };
    series: {
        encounters_by_day: { date: string; count: number }[];
    };
    breakdowns: {
        encounters_by_class: { class: string; count: number }[];
    };
    top_conditions: { code: string; display: string; count: number }[];
    notes: string[];
}

export default function DashboardPage() {
    const [data, setData] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [classFilterOpen, setClassFilterOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/metrics");
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.instruction || "Failed to fetch metrics");
                }
                const jsonData = await res.json();
                setData(jsonData);

                // Initialize filters based on data
                if (jsonData.series.encounters_by_day.length > 0) {
                    const dates = jsonData.series.encounters_by_day.map((d: { date: string }) => d.date);
                    // Set to last 30 days of data if possible
                    const sortedDates = [...dates].sort();
                    setEndDate(sortedDates[sortedDates.length - 1]);

                    // Default to last 30 data points or first date
                    const startIndex = Math.max(0, sortedDates.length - 30);
                    setStartDate(sortedDates[startIndex]);
                }
            } catch (err: unknown) {
                if (err instanceof Error) setError(err.message);
                else setError(String(err));
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Filtered Data
    const filteredDaySeries = useMemo(() => {
        if (!data) return [];
        return data.series.encounters_by_day.filter((d) => {
            const isAfterStart = !startDate || d.date >= startDate;
            const isBeforeEnd = !endDate || d.date <= endDate;
            return isAfterStart && isBeforeEnd;
        });
    }, [data, startDate, endDate]);

    const filteredClassSeries = useMemo(() => {
        if (!data) return [];
        if (selectedClasses.length === 0) return data.breakdowns.encounters_by_class;
        return data.breakdowns.encounters_by_class.filter((c) =>
            selectedClasses.includes(c.class)
        );
    }, [data, selectedClasses]);

    const allClassNames = useMemo(() => {
        if (!data) return [];
        return data.breakdowns.encounters_by_class.map((c) => c.class);
    }, [data]);

    const toggleClass = (className: string) => {
        setSelectedClasses((prev) =>
            prev.includes(className)
                ? prev.filter((c) => c !== className)
                : [...prev, className]
        );
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="text-stone-500 font-medium">Loading clinical insights...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex bg-red-50 border border-red-100 rounded-xl p-8 flex-col items-center justify-center gap-4 text-center max-w-2xl mx-auto my-12">
                <div className="bg-red-100 p-3 rounded-full">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-red-900">Dashboard Unavailable</h2>
                <p className="text-red-700">{error}</p>
                <div className="mt-4 p-4 bg-white rounded-lg border border-red-200 text-sm font-mono text-stone-700">
                    npm run data:build
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Global Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-stone-900">Clinical Dashboard</h1>
                    <p className="text-stone-500 mt-1">
                        Real-time encounter metrics and condition trends.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <Calendar className="h-4 w-4 text-stone-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm bg-transparent border-none focus:ring-0 p-0 text-stone-700"
                        />
                        <span className="text-stone-300">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm bg-transparent border-none focus:ring-0 p-0 text-stone-700"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setClassFilterOpen(!classFilterOpen)}
                            className={cn(
                                "flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5 shadow-sm text-sm font-medium transition-all hover:bg-stone-50",
                                selectedClasses.length > 0 && "border-blue-200 bg-blue-50 text-blue-700"
                            )}
                        >
                            <Filter className="h-4 w-4" />
                            Classes {selectedClasses.length > 0 && `(${selectedClasses.length})`}
                        </button>

                        {classFilterOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-20 p-2 overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="max-h-60 overflow-y-auto">
                                    {allClassNames.map((cls) => (
                                        <label
                                            key={cls}
                                            className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedClasses.includes(cls)}
                                                onChange={() => toggleClass(cls)}
                                                className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                            />
                                            <span className="text-sm text-stone-700 capitalize">{cls}</span>
                                        </label>
                                    ))}
                                </div>
                                {selectedClasses.length > 0 && (
                                    <button
                                        onClick={() => setSelectedClasses([])}
                                        className="w-full mt-2 text-xs text-blue-600 font-semibold py-2 border-t border-stone-100 hover:text-blue-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-2.5 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Live
                        </span>
                    </div>
                    <p className="text-stone-500 font-medium text-sm">Total Encounters</p>
                    <h3 className="text-3xl font-bold mt-1 text-stone-900">
                        {data.kpis.total_encounters?.toLocaleString()}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-amber-50 p-2.5 rounded-xl group-hover:bg-amber-100 transition-colors">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-stone-500 font-medium text-sm">Avg. Length of Stay</p>
                    <h3 className="text-3xl font-bold mt-1 text-stone-900">
                        {data.kpis.avg_los_days ? `${data.kpis.avg_los_days} days` : "N/A"}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-50 p-2.5 rounded-xl group-hover:bg-purple-100 transition-colors">
                            <RefreshCw className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-stone-500 font-medium text-sm">30-Day Revisit Rate</p>
                    <h3 className="text-3xl font-bold mt-1 text-stone-900">
                        {data.kpis.revisit_rate_30d
                            ? `${(data.kpis.revisit_rate_30d * 100).toFixed(1)}%`
                            : "N/A"}
                    </h3>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <h4 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                        Patient Volume Over Time
                        <span className="text-xs font-normal text-stone-400">({filteredDaySeries.length} nodes)</span>
                    </h4>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredDaySeries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 12 }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <h4 className="text-lg font-bold text-stone-900 mb-6">Encounters by Class</h4>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredClassSeries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis
                                    dataKey="class"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#6366f1"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Table Row */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
                    <h4 className="text-lg font-bold text-stone-900">Prevalent Conditions</h4>
                    <TableIcon className="h-5 w-5 text-stone-400" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50 text-stone-500 font-semibold text-xs uppercase tracking-wider">
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Condition Description</th>
                                <th className="px-6 py-4 text-right">Frequency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                            {data.top_conditions.map((item) => (
                                <tr key={item.code} className="hover:bg-stone-50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-stone-500">{item.code}</td>
                                    <td className="px-6 py-4 font-medium text-stone-900">{item.display}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="bg-stone-100 group-hover:bg-blue-100 group-hover:text-blue-700 px-3 py-1 rounded-full font-bold transition-colors">
                                            {item.count.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center pb-8">
                <p className="text-xs text-stone-400">
                    Generated at: {new Date(data.generated_at).toLocaleString()}
                </p>
            </div>
        </div>
    );
}
