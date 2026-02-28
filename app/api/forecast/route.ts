import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

export async function GET() {
    const filePath = join(process.cwd(), "data", "derived", "forecast.json");

    try {
        const content = await readFile(filePath, "utf-8");
        const data = JSON.parse(content);

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[API/Forecast] Error: ${msg}`);
        return NextResponse.json(
            {
                error: "Forecast data not found",
                instruction: "Please run 'npm run data:build' to generate derived JSON files.",
            },
            { status: 500 }
        );
    }
}
