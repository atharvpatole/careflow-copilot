import { z } from "zod";

export const NoteExtractSchema = z.object({
    summary: z.string().describe("A brief, overarching summary of the clinical note."),
    problems: z.array(z.object({
        label: z.string(),
        evidence: z.string(),
    })).max(10).describe("List of problems/diagnoses up to 10."),
    medications: z.array(z.object({
        label: z.string(),
        evidence: z.string(),
    })).max(10).describe("List of medications up to 10."),
    allergies: z.array(z.object({
        label: z.string(),
        evidence: z.string(),
    })).max(10).describe("List of allergies up to 10."),
    followUps: z.array(z.object({
        label: z.string(),
        evidence: z.string(),
    })).max(10).describe("List of follow up instructions or plans up to 10."),
    redFlags: z.array(z.object({
        label: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        evidence: z.string(),
    })).max(10).describe("List of critical red flags or severe warnings up to 10."),
});

export type NoteExtract = z.infer<typeof NoteExtractSchema>;
