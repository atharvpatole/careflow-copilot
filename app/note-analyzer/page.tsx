"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { FileText, Wand2 } from "lucide-react";

export default function NoteAnalyzer() {
    const [note, setNote] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900">Note Analyzer</h1>
                <p className="text-sm text-stone-500">LLM-powered clinical note extraction</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-stone-700">
                            <FileText className="h-4 w-4" />
                            Clinical Note Input
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="w-full min-h-[300px] p-4 text-sm rounded-md border border-stone-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Paste clinical note here... e.g. Patient presents with acute COPD exacerbation."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleAnalyze}
                                disabled={!note || isAnalyzing}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isAnalyzing ? "Analyzing..." : "Analyze Note"}
                                <Wand2 className="h-4 w-4" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-stone-700">
                            <Wand2 className="h-4 w-4" />
                            Extracted Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`min-h-[300px] rounded-md border border-stone-100 bg-stone-50 p-4 font-mono text-sm transition-opacity duration-300 ${isAnalyzing ? 'opacity-50' : 'opacity-100'}`}>
                            <span className="text-stone-400">Waiting for note analysis...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
