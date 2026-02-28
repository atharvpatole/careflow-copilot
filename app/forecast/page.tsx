"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
    { name: "Jan", baseline: 4000, forecast: 4200 },
    { name: "Feb", baseline: 3000, forecast: 3100 },
    { name: "Mar", baseline: 2000, forecast: 2600 },
    { name: "Apr", baseline: 2780, forecast: 2900 },
    { name: "May", baseline: 1890, forecast: 2100 },
    { name: "Jun", baseline: 2390, forecast: 2500 },
    { name: "Jul", baseline: 3490, forecast: 3800 },
];

export default function Forecast() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900">Patient Volume Forecast</h1>
                <p className="text-sm text-stone-500">ML-driven baseline vs expected</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Admissions Forecast (6 months)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip />
                                <Area type="monotone" dataKey="baseline" stroke="#a8a29e" strokeDasharray="3 3" fill="transparent" />
                                <Area type="monotone" dataKey="forecast" stroke="#2563eb" fillOpacity={1} fill="url(#colorForecast)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
