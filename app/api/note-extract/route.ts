import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { NoteExtractSchema } from "../../../lib/llm/schema";
import { buildSystemPrompt, buildUserPrompt, PROMPT_VERSION } from "../../../lib/llm/prompt";

export const runtime = "nodejs";

const RequestSchema = z.object({
    note: z.string().min(50).max(8000),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsedBody = RequestSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid request. Note must be between 50 and 8000 characters." }, { status: 400 });
        }

        const note = parsedBody.data.note;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API key is missing. Please configure OPENAI_API_KEY in your environment." }, { status: 500 });
        }

        // Never log raw note text to console in production, only lengths
        if (process.env.NODE_ENV === "production") {
            console.log(`[NoteExtract API] Processing note of length: ${note.length}`);
        } else {
            console.log(`[NoteExtract API] Processing note of length: ${note.length}`);
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: buildSystemPrompt() },
                { role: "user", content: buildUserPrompt(note) },
            ],
            response_format: zodResponseFormat(NoteExtractSchema, "note_extract"),
            temperature: 0.2,
            store: false,
        });

        const result = completion.choices[0].message.parsed;
        if (!result) {
            throw new Error("Failed to parse the response structure from OpenAI.");
        }

        return NextResponse.json({
            prompt_version: PROMPT_VERSION,
            model: completion.model || "gpt-4o-mini",
            result: result,
        });
    } catch (error: unknown) {
        const errObj = error as { name?: string, status?: number, message?: string, request_id?: string };
        console.error("[NoteExtract API] Error:", errObj);

        // Check if it's an OpenAI API error regarding parsing or similar issue
        if (errObj.name === 'LengthFinishReasonError' || errObj.status === 402 || errObj.status === 400 || errObj.message?.includes('parse')) {
            return NextResponse.json(
                {
                    error: "Failed to parse OpenAI structure.",
                    message: errObj.message,
                    request_id: errObj.request_id || "unknown"
                },
                { status: 502 }
            );
        }

        return NextResponse.json(
            { error: "Internal Server Error", message: errObj.message },
            { status: 500 }
        );
    }
}
