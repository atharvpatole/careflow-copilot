import { existsSync } from 'fs';
import { join } from 'path';

function validate() {
    const requirements = [
        'data/derived/metrics.json',
        'data/derived/forecast.json',
        'data/raw/fhir-1000.zip'
    ];

    for (const req of requirements) {
        const fullPath = join(process.cwd(), req);
        if (!existsSync(fullPath)) {
            console.error(`Missing required file: ${req}`);
            process.exit(1);
        }
    }

    console.log('All derived + raw data validated successfully.');
}

validate();
