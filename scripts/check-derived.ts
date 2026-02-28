import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function check() {
    const root = process.cwd();
    const metricsPath = join(root, 'data/derived/metrics.json');

    if (!existsSync(metricsPath)) {
        console.error(`[Error] metrics.json not found at ${metricsPath}`);
        process.exit(1);
    }

    const raw = readFileSync(metricsPath, 'utf8');
    const data = JSON.parse(raw);

    const errors: string[] = [];

    // Required keys
    const topKeys = ['generated_at', 'kpis', 'series', 'breakdowns', 'top_conditions', 'notes'];
    for (const k of topKeys) {
        if (data[k] === undefined) errors.push(`Missing key: ${k}`);
    }

    // KPIs
    const kpis = ['total_encounters', 'avg_los_days', 'revisit_rate_30d'];
    for (const k of kpis) {
        if (data.kpis?.[k] === undefined) errors.push(`Missing KPI: ${k}`);
    }

    // Non-empty checks (if dataset present)
    if (data.kpis?.total_encounters > 0) {
        if (!data.series?.encounters_by_day?.length) errors.push('Series: encounters_by_day is empty');
        if (!data.breakdowns?.encounters_by_class?.length) errors.push('Breakdowns: encounters_by_class is empty');
        if (!data.top_conditions?.length) errors.push('Top conditions array is empty');
    }

    if (errors.length > 0) {
        console.error(`[Fail] Validation failed with ${errors.length} errors:`);
        errors.forEach(e => console.error(` - ${e}`));
        process.exit(1);
    }

    console.log(`[PASS] metrics.json is valid.`);
    console.log('\n--- Summary ---');
    console.log(`- Total Encounters:    ${data.kpis.total_encounters}`);
    console.log(`- Avg LOS (days):      ${data.kpis.avg_los_days}`);
    console.log(`- Revisit Rate (30d):  ${data.kpis.revisit_rate_30d}`);
    console.log(`- Days in Series:      ${data.series.encounters_by_day.length}`);
    console.log(`- Top Condition:       ${data.top_conditions[0]?.display || 'N/A'}`);
}

check();
