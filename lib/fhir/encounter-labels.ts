/**
 * Human-friendly labels for FHIR encounter class codes.
 *
 * These codes come from the HL7 ActCode value set and are cryptic
 * for non-clinical users. This map provides plain-English labels
 * along with short descriptions so everyone can understand the data.
 *
 * @see https://www.hl7.org/fhir/v3/ActEncounterCode/vs.html
 */

export interface EncounterClassInfo {
    /** Plain-English label shown in charts and filters */
    label: string;
    /** One-line description shown in tooltips */
    description: string;
    /** Emoji for mobile-friendly visual cues */
    emoji: string;
}

export const ENCOUNTER_CLASS_LABELS: Record<string, EncounterClassInfo> = {
    AMB: {
        label: "Outpatient",
        description: "Walk-in or scheduled clinic visits",
        emoji: "🏥",
    },
    EMER: {
        label: "Emergency",
        description: "Emergency room visits",
        emoji: "🚨",
    },
    IMP: {
        label: "Inpatient",
        description: "Admitted and stayed overnight",
        emoji: "🛏️",
    },
    HH: {
        label: "Home Health",
        description: "Healthcare provided at home",
        emoji: "🏠",
    },
    VR: {
        label: "Virtual",
        description: "Telehealth / video consultations",
        emoji: "💻",
    },
    FLD: {
        label: "Field",
        description: "Healthcare provided in the field",
        emoji: "🚑",
    },
    SS: {
        label: "Short Stay",
        description: "Brief observation stays",
        emoji: "⏱️",
    },
    OBSENC: {
        label: "Observation",
        description: "Under observation but not admitted",
        emoji: "👁️",
    },
    PRENC: {
        label: "Pre-Admission",
        description: "Pre-admission testing or evaluation",
        emoji: "📋",
    },
};

/**
 * Returns the human-friendly label for an encounter class code.
 * Falls back to the original code if not mapped.
 */
export function getEncounterLabel(code: string): string {
    return ENCOUNTER_CLASS_LABELS[code]?.label ?? code;
}

/**
 * Returns the full info object for an encounter class code.
 */
export function getEncounterInfo(code: string): EncounterClassInfo {
    return (
        ENCOUNTER_CLASS_LABELS[code] ?? {
            label: code,
            description: `Encounter type: ${code}`,
            emoji: "📌",
        }
    );
}
