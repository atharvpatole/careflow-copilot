import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const dataPath = path.join(process.cwd(), 'data/derived/forecast.json');
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf-8');
            return NextResponse.json(JSON.parse(data));
        }
        return NextResponse.json({ error: 'Forecast file not found' }, { status: 404 });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to load forecast' }, { status: 500 });
    }
}
