import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

export async function GET() {
    const filePath = join(process.cwd(), "data", "derived", "metrics.json");

    try {
        const content = await readFile(filePath, "utf-8");
        const data = JSON.parse(content);

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error: any) {
        console.error(`[API/Metrics] Error: ${error.message}`);
        return NextResponse.json(
            {
                error: "Metrics data not found",
                instruction: "Please run 'npm run data:build' to generate derived JSON files.",
            },
            { status: 500 }
        );
    }
}
