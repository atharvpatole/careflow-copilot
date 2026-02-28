"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Clock, Calendar } from "lucide-react";

export default function Dashboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900">Dashboard</h1>
                <p className="text-sm text-stone-500">Overview of patient metrics</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Active Patients", value: "1,245", icon: Users, trend: "+4%" },
                    { title: "Pending Notes", value: "32", icon: Clock, trend: "-12%" },
                    { title: "Appointments Today", value: "18", icon: Calendar, trend: "Same" },
                    { title: "Readmission Risk", value: "4.2%", icon: Activity, trend: "+0.3%" },
                ].map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-stone-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-stone-500 mt-1">
                                {stat.trend} from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="col-span-4 mt-6">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-stone-200 rounded-lg bg-stone-50 text-stone-500">
                        Activity chart placeholder
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
