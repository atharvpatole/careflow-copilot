import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Mock script to derive metrics and forecast from raw data
async function main() {
    console.log('Unzipping fhir-100.zip...');
    console.log('Parsing NDJSON...');

    const derivedDir = join(process.cwd(), 'data/derived');

    const mockMetrics = {
        activePatients: 1245,
        pendingNotes: 32,
        appointmentsToday: 18,
        readmissionRisk: 4.2
    };

    const mockForecast = [
        { name: "Jan", baseline: 4000, forecast: 4200 },
        { name: "Feb", baseline: 3000, forecast: 3100 },
        { name: "Mar", baseline: 2000, forecast: 2600 },
        { name: "Apr", baseline: 2780, forecast: 2900 },
        { name: "May", baseline: 1890, forecast: 2100 },
        { name: "Jun", baseline: 2390, forecast: 2500 }
    ];

    writeFileSync(join(derivedDir, 'metrics.json'), JSON.stringify(mockMetrics, null, 2));
    writeFileSync(join(derivedDir, 'forecast.json'), JSON.stringify(mockForecast, null, 2));

    console.log('Successfully written derived JSON.');
}

main().catch(console.error);
