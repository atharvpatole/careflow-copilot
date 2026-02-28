import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { initLogger, wrapOpenAI } from "braintrust";
import { zodResponseFormat } from "openai/helpers/zod";
import { NoteExtractSchema } from "../../../lib/llm/schema";
import { buildSystemPrompt, buildUserPrompt, PROMPT_VERSION } from "../../../lib/llm/prompt";

export const runtime = "nodejs";

const RequestSchema = z.object({
    note: z.string().min(50).max(8000),
});

export async function POST(req: Request) {
    const startTime = Date.now();
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

        console.log(`[NoteExtract API] Processing note of length: ${note.length}`);

        // Initialize the Braintrust logger and wrap the OpenAI client per documentation
        const logger = initLogger({
            projectName: "careflow-copilot",
            apiKey: process.env.BRAINTRUST_API_KEY,
        });

        // wrapOpenAI() automatically captures all AI calls as traces
        const client = wrapOpenAI(
            new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            }),
        );

        let completion;

        // Try paths commonly used for Structured Outputs
        if ((client as any).chat?.completions?.parse) {
            completion = await (client as any).chat.completions.parse({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: buildSystemPrompt() },
                    { role: "user", content: buildUserPrompt(note) },
                ],
                response_format: zodResponseFormat(NoteExtractSchema, "note_extract"),
                temperature: 0.2,
                store: false,
            });
        } else {
            throw new Error("OpenAI SDK version does not support structured output '.parse()' helper.");
        }

        const result = completion.choices[0].message.parsed;
        if (!result) {
            throw new Error("Failed to parse the response structure from OpenAI.");
        }

        // You can also use logger.log() for custom traces (e.g., multimodal inputs, metadata)
        // We omit raw note content to preserve PHI safety bounds
        logger.log({
            input: "Redacted note for extraction",
            output: "Schema populated successfully",
            metadata: {
                prompt_version: PROMPT_VERSION,
                note_length_chars: note.length,
                model: completion.model || "gpt-4o-mini",
                red_flags_count: result.redFlags.length,
                success: true,
                latency_ms: Date.now() - startTime,
            },
        });

        return NextResponse.json({
            prompt_version: PROMPT_VERSION,
            model: completion.model || "gpt-4o-mini",
            result: result,
        });
    } catch (error: unknown) {
        const errObj = error as {
            name?: string,
            status?: number,
            message?: string,
            request_id?: string,
            code?: string,
            type?: string
        };

        // If it failed, log the error failure to braintrust too
        const logger = initLogger({
            projectName: "careflow-copilot",
            apiKey: process.env.BRAINTRUST_API_KEY,
        });
        logger.log({
            input: "Failed note extraction",
            output: errObj.message || "Unknown error",
            metadata: {
                success: false,
                latency_ms: Date.now() - startTime,
            }
        });

        console.error("[NoteExtract API] Error:", errObj);

        // Specific handling for common OpenAI account issues
        if (errObj.code === 'insufficient_quota') {
            return NextResponse.json(
                {
                    error: "OpenAI Quota Exceeded",
                    message: "The API key has insufficient credits or has reached its quota. Even for new accounts, OpenAI requires a minimum prepaid balance (usually $5) to activate the API. Please check your billing dashboard: https://platform.openai.com/settings/organization/billing",
                    request_id: errObj.request_id || "unknown"
                },
                { status: 402 } // Payment Required / Quota Exceeded
            );
        }

        if (errObj.status === 401) {
            return NextResponse.json(
                {
                    error: "OpenAI Authentication Failed",
                    message: "The API key in .env.local is either invalid or lacks the necessary permissions. If using a 'Project API Key', ensure it has 'Read/Write' access to the Chat model in your OpenAI Project settings.",
                    request_id: errObj.request_id || "unknown"
                },
                { status: 401 }
            );
        }

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
            {
                error: "Internal Server Error",
                message: errObj.message || "An unexpected error occurred during note analysis.",
                code: errObj.code
            },
            { status: 500 }
        );
    }
}
