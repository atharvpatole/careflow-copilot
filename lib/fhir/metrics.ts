import { readNdjson } from './ndjson';

export type MetricsOutput = {
    generated_at: string;
    kpis: {
        total_encounters: number;
        avg_los_days: number | null;
        revisit_rate_30d: number | null;
    };
    series: {
        encounters_by_day: { date: string; count: number }[];
    };
    breakdowns: {
        encounters_by_class: { class: string; count: number }[];
    };
    top_conditions: { code: string; display: string; count: number }[];
    notes: string[];
};

/**
 * Builds core metrics from raw FHIR NDJSON files.
 */
export async function buildMetrics(encounterFiles: string[], conditionFiles: string[]): Promise<MetricsOutput> {

    const encountersByDayMap = new Map<string, number>();
    const encountersByClassMap = new Map<string, number>();
    const patientEncounters = new Map<string, string[]>(); // patientRef -> [startDates]
    const conditionCountMap = new Map<string, { display: string; count: number }>();
    const notes: string[] = [];

    let totalEncounters = 0;
    let totalLosMs = 0;
    let validLosCount = 0;

    // Process Encounters
    for (const file of encounterFiles) {
        for await (const encounter of readNdjson<any>(file)) {
            totalEncounters++;

            // Encounters by class
            const className = encounter.class?.code || 'unknown';
            encountersByClassMap.set(className, (encountersByClassMap.get(className) || 0) + 1);

            // Encounters by day & LOS
            const start = encounter.period?.start;
            const end = encounter.period?.end;

            if (start) {
                const date = start.substring(0, 10); // YYYY-MM-DD
                encountersByDayMap.set(date, (encountersByDayMap.get(date) || 0) + 1);

                // Subject (for revisits)
                const patientRef = encounter.subject?.reference;
                if (patientRef) {
                    if (!patientEncounters.has(patientRef)) patientEncounters.set(patientRef, []);
                    patientEncounters.get(patientRef)!.push(start);
                }

                // LOS
                if (end) {
                    const losMs = new Date(end).getTime() - new Date(start).getTime();
                    if (losMs >= 0) {
                        totalLosMs += losMs;
                        validLosCount++;
                    }
                }
            } else {
                notes.push(`Encounter ${encounter.id} missing start period.`);
            }
        }
    }

    // Revisited rate 30d calculation
    let patientsMeetingRevisit = 0;
    let patientsWithMultipleEncs = 0;

    for (const [patientRef, starts] of patientEncounters.entries()) {
        if (starts.length >= 2) {
            patientsWithMultipleEncs++;
            // Sort start times
            const sortedDates = starts.map(s => new Date(s).getTime()).sort((a, b) => a - b);
            let metCondition = false;
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const diffDays = (sortedDates[i + 1] - sortedDates[i]) / (1000 * 60 * 60 * 24);
                if (diffDays <= 30) {
                    metCondition = true;
                    break;
                }
            }
            if (metCondition) patientsMeetingRevisit++;
        }
    }

    // Process Conditions
    for (const file of conditionFiles) {
        for await (const condition of readNdjson<any>(file)) {
            const coding = condition.code?.coding?.[0];
            if (coding?.code && coding?.display) {
                const key = coding.code;
                const entry = conditionCountMap.get(key) || { display: coding.display, count: 0 };
                entry.count++;
                conditionCountMap.set(key, entry);
            }
        }
    }

    // Prepare Output
    const encounters_by_day = Array.from(encountersByDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const encounters_by_class = Array.from(encountersByClassMap.entries())
        .map(([className, count]) => ({ class: className, count }))
        .sort((a, b) => b.count - a.count || a.class.localeCompare(b.class));

    const top_conditions = Array.from(conditionCountMap.entries())
        .map(([code, entry]) => ({ code, display: entry.display, count: entry.count }))
        .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
        .slice(0, 10);

    const avg_los_days = validLosCount > 0 ? (totalLosMs / validLosCount) / (1000 * 60 * 60 * 24) : null;
    const revisit_rate_30d = patientsWithMultipleEncs > 0 ? patientsMeetingRevisit / patientsWithMultipleEncs : null;

    return {
        generated_at: new Date().toISOString(),
        kpis: {
            total_encounters: totalEncounters,
            avg_los_days: avg_los_days ? parseFloat(avg_los_days.toFixed(2)) : null,
            revisit_rate_30d: revisit_rate_30d ? parseFloat(revisit_rate_30d.toFixed(3)) : null
        },
        series: {
            encounters_by_day
        },
        breakdowns: {
            encounters_by_class
        },
        top_conditions,
        notes
    };
}
