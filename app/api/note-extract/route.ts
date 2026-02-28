import { NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
    note: z.string().min(5),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = RequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Placeholder extraction logic
        const extractedData = {
            patientStatus: 'Stable',
            keyFindings: ['No acute distress'],
            recommendedAction: 'Follow up in 2 weeks',
        };

        return NextResponse.json(extractedData);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to extract note' }, { status: 500 });
    }
}
