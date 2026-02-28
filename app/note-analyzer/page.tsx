"use client";

import React, { useState } from "react";
import {
    Brain,
    Clipboard,
    Zap,
    Activity,
    AlertTriangle,
    Pill,
    Thermometer,
    Calendar,
    ChevronDown,
    ChevronRight,
    Search,
    Loader2,
    CheckCircle2,
    XCircle,
    ArrowRight,
    RefreshCw,
} from "lucide-react";

// Types derived from schema
interface NoteExtractResult {
    summary: string;
    problems: { label: string; evidence: string }[];
    medications: { label: string; evidence: string }[];
    allergies: { label: string; evidence: string }[];
    followUps: { label: string; evidence: string }[];
    redFlags: { label: string; severity: "low" | "medium" | "high"; evidence: string }[];
}

interface NoteExtractResponse {
    prompt_version: string;
    model: string;
    result: NoteExtractResult;
}

const SAMPLE_NOTE = `Patient presents with persistent headache and mild nausea for the past 3 days.`;

export default function NoteAnalyzerPage() {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<NoteExtractResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [jsonOpen, setJsonOpen] = useState(false);

    const handleExtract = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;

        setLoading(true);
        setResponse(null);
        setError(null);

        try {
            const res = await fetch("/api/note-extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note }),
            });

            if (!res.ok) {
                const errData = await res.json();
                const errorMessage = errData.error?.message || errData.error || errData.message || "Failed to analyze note";
                throw new Error(errorMessage);
            }

            const data = await res.json();
            setResponse(data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const loadSample = () => setNote(SAMPLE_NOTE.trim());

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                            Intelligent Note Analyzer
                        </h1>
                    </div>
                    <p className="text-slate-500 text-lg">
                        Type any clinical input — from a brief complaint to a full note — and let AI generate a comprehensive analysis.
                    </p>
                </div>
                <button
                    onClick={loadSample}
                    className="flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors bg-indigo-50 px-5 py-2.5 rounded-xl border border-indigo-100 w-fit self-start md:self-center"
                >
                    <Clipboard className="h-4 w-4" />
                    Load Sample Note
                </button>
            </div>

            {/* Input Section */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative group transition-all hover:shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500" />
                <form onSubmit={handleExtract} className="p-8 space-y-6">
                    <div className="relative">
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Type anything — 'i have headache from past 2 days', 'chest pain radiating to left arm', or paste a full clinical note..."
                            className="w-full min-h-[280px] p-6 text-slate-800 placeholder:text-slate-400 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg leading-relaxed resize-y"
                            disabled={loading}
                        />
                        <div className="absolute bottom-4 right-4 text-xs font-semibold text-slate-400">
                            {note.length} characters
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3 text-slate-500 text-sm italic">
                            <Search className="h-4 w-4" />
                            Analyzing for problems, medications, red flags, and more.
                        </div>
                        <button
                            type="submit"
                            disabled={loading || note.trim().length === 0}
                            className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-3 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-5 w-5 fill-indigo-300 text-indigo-300" />
                                    Analyze Note
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </section>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-2">
                    <XCircle className="h-6 w-6 text-rose-500 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="text-rose-900 font-bold mb-1">Analysis Engineering Error</h4>
                        <p className="text-rose-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {response && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Summary & Red Flags */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    Clinical Summary
                                </h3>
                                <p className="text-slate-700 text-lg leading-relaxed">
                                    {response.result.summary}
                                </p>
                            </div>

                            <TabsSection result={response.result} />
                        </div>

                        {/* Red Flags Column */}
                        <div className="space-y-8">
                            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <AlertTriangle className="h-24 w-24" />
                                </div>
                                <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2 relative z-10">
                                    <Thermometer className="h-5 w-5 text-rose-400" />
                                    Safety Red Flags
                                </h3>

                                {response.result.redFlags.length === 0 ? (
                                    <div className="bg-white/10 p-5 rounded-2xl flex items-center gap-3 relative z-10">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                        <span className="text-slate-100 font-medium">No acute warnings detected.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4 relative z-10">
                                        {response.result.redFlags.map((flag, idx) => (
                                            <div key={idx} className="bg-white/10 p-5 rounded-2xl border border-white/5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-100">{flag.label}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${flag.severity === 'high' ? 'bg-rose-500' :
                                                        flag.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-500'
                                                        }`}>
                                                        {flag.severity}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                                    &quot;{flag.evidence}&quot;
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-4 py-12">
                                <div className="bg-indigo-50 p-4 rounded-full">
                                    <RefreshCw className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h5 className="font-bold text-slate-900">Deterministic Model</h5>
                                <p className="text-sm text-slate-500">
                                    Parsed via {response.model}<br />
                                    using Prompt Engineering {response.prompt_version}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Full JSON Viewer */}
                    <div className="border-t border-slate-100 pt-8">
                        <button
                            onClick={() => setJsonOpen(!jsonOpen)}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-semibold mb-4 transition-colors ml-auto"
                        >
                            {jsonOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {jsonOpen ? 'Hide' : 'View'} Internal Extraction JSON
                        </button>
                        {jsonOpen && (
                            <pre className="bg-slate-900 text-indigo-200 p-8 rounded-3xl overflow-x-auto text-xs font-mono leading-relaxed shadow-inner">
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function TabsSection({ result }: { result: NoteExtractResult }) {
    const [activeTab, setActiveTab] = useState<'problems' | 'medications' | 'allergies' | 'followUps'>('problems');

    const tabs = [
        { id: 'problems', label: 'Problems', icon: Activity, count: result.problems.length },
        { id: 'medications', label: 'Medications', icon: Pill, count: result.medications.length },
        { id: 'allergies', label: 'Allergies', icon: AlertTriangle, count: result.allergies.length },
        { id: 'followUps', label: 'Follow Up', icon: Calendar, count: result.followUps.length },
    ];

    const activeList = result[activeTab];

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="flex bg-slate-50 border-b border-slate-100 overflow-x-auto scroller-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-8 py-5 text-sm font-bold transition-all relative min-w-fit ${activeTab === tab.id ? 'text-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-1 bg-indigo-600" />
                        )}
                    </button>
                ))}
            </div>

            <div className="p-8 flex-1">
                {activeList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-12">
                        <CheckCircle2 className="h-12 w-12 text-slate-100" />
                        <p className="font-semibold text-lg">No {activeTab} identified.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        {activeList.map((item, idx) => (
                            <div key={idx} className="group bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                        {item.label}
                                    </h4>
                                </div>
                                <p className="text-sm text-slate-500 italic flex gap-2">
                                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                                    <span>{item.evidence}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
