import { z } from 'zod';

export const NoteExtractionSchema = z.object({
    patientStatus: z.string(),
    keyFindings: z.array(z.string()),
    recommendedAction: z.string(),
});

export type NoteExtractionType = z.infer<typeof NoteExtractionSchema>;
