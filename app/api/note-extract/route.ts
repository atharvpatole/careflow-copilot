import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { initLogger, wrapOpenAI } from "braintrust";
import { zodResponseFormat } from "openai/helpers/zod";
import { NoteExtractSchema } from "../../../lib/llm/schema";
import { buildSystemPrompt, buildUserPrompt, PROMPT_VERSION } from "../../../lib/llm/prompt";

export const runtime = "nodejs";

const RequestSchema = z.object({
    note: z.string().min(1),
});

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string) {
    const now = Date.now();
    let data = rateLimits.get(ip);

    if (!data || now > data.resetTime) {
        data = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
        rateLimits.set(ip, data);
        return { limitReached: false };
    }

    data.count++;

    if (data.count > RATE_LIMIT_MAX) {
        const retryAfterSeconds = Math.ceil((data.resetTime - now) / 1000);
        return { limitReached: true, retryAfter: retryAfterSeconds };
    }

    return { limitReached: false };
}

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const { limitReached, retryAfter } = checkRateLimit(ip);
        if (limitReached) {
            return NextResponse.json(
                { error: { code: "rate_limited", message: "Too many requests. Please try again later." } },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }

        const body = await req.json();
        const parsedBody = RequestSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json(
                { error: { code: "invalid_request", message: "Invalid request. Note cannot be empty." } },
                { status: 400 }
            );
        }

        const note = parsedBody.data.note;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: { code: "missing_api_key", message: "OpenAI API key is missing. Please configure OPENAI_API_KEY in your environment." } },
                { status: 500 }
            );
        }

        console.log(`[NoteExtract API] Processing note of length: ${note.length}`);

        // Initialize the Braintrust logger
        const logger = initLogger({
            projectName: "careflow-copilot",
            apiKey: process.env.BRAINTRUST_API_KEY,
        });

        // Use logger.traced() to create a proper span context.
        // wrapOpenAI creates child spans for OpenAI calls, so all logging
        // must happen inside a traced span — not at the top level.
        const response = await logger.traced(
            async (span) => {
                // wrapOpenAI() automatically captures all AI calls as child spans
                const client = wrapOpenAI(
                    new OpenAI({
                        apiKey: process.env.OPENAI_API_KEY,
                    }),
                );

                let completion;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((client as any).chat?.completions?.parse) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                // Log within the span context (not at top level)
                span.log({
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
            },
            { name: "note-extract" },
        );

        return response;
    } catch (error: unknown) {
        const errObj = error as {
            name?: string,
            status?: number,
            message?: string,
            request_id?: string,
            code?: string,
            type?: string
        };

        // Log the failure to Braintrust inside a traced span
        try {
            const logger = initLogger({
                projectName: "careflow-copilot",
                apiKey: process.env.BRAINTRUST_API_KEY,
            });
            await logger.traced(
                async (span) => {
                    span.log({
                        input: "Failed note extraction",
                        output: errObj.message || "Unknown error",
                        metadata: {
                            success: false,
                            latency_ms: Date.now() - startTime,
                        },
                    });
                },
                { name: "note-extract-error" },
            );
        } catch (logErr) {
            console.error("[NoteExtract API] Failed to log error to Braintrust:", logErr);
        }

        console.error("[NoteExtract API] Error:", errObj);

        // Specific handling for common OpenAI account issues
        if (errObj.code === 'insufficient_quota') {
            return NextResponse.json(
                {
                    error: {
                        code: "insufficient_quota",
                        message: "The API key has insufficient credits or has reached its quota. Even for new accounts, OpenAI requires a minimum prepaid balance (usually $5) to activate the API. Please check your billing dashboard: https://platform.openai.com/settings/organization/billing"
                    }
                },
                { status: 402 } // Payment Required / Quota Exceeded
            );
        }

        if (errObj.status === 401) {
            return NextResponse.json(
                {
                    error: {
                        code: "unauthorized",
                        message: "The API key in .env.local is either invalid or lacks the necessary permissions. If using a 'Project API Key', ensure it has 'Read/Write' access to the Chat model in your OpenAI Project settings."
                    }
                },
                { status: 401 }
            );
        }

        // Check if it's an OpenAI API error regarding parsing or similar issue
        if (errObj.name === 'LengthFinishReasonError' || errObj.status === 402 || errObj.status === 400 || errObj.message?.includes('parse')) {
            return NextResponse.json(
                {
                    error: {
                        code: "parse_error",
                        message: errObj.message || "Failed to parse OpenAI structure."
                    }
                },
                { status: 502 }
            );
        }

        return NextResponse.json(
            {
                error: {
                    code: errObj.code || "internal_error",
                    message: errObj.message || "An unexpected error occurred during note analysis."
                }
            },
            { status: 500 }
        );
    }
}
