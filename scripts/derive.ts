import { existsSync, readdirSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import extract from 'extract-zip';

async function main() {
    const rootPath = process.cwd();
    const rawZipPath = join(rootPath, 'data/raw/fhir-100.zip');
    const rawDirPath = join(rootPath, 'data/raw/fhir');
    const tmpPath = join(rootPath, '.tmp/fhir');

    let activeSource: string | null = null;
    let isZipSource = false;

    // Check for source
    if (existsSync(rawZipPath)) {
        console.log(`[Source] Found zip at ${rawZipPath}`);
        // Prep tmp folder
        if (existsSync(tmpPath)) {
            rmSync(tmpPath, { recursive: true, force: true });
        }
        mkdirSync(tmpPath, { recursive: true });

        // Unzip
        try {
            console.log(`[Unzip] Extracting to ${tmpPath}...`);
            await extract(rawZipPath, { dir: tmpPath });
            activeSource = tmpPath;
            isZipSource = true;
        } catch (err: any) {
            throw new Error(`Failed to extract zip: ${err.message}`);
        }
    } else if (existsSync(rawDirPath)) {
        console.log(`[Source] Found extracted FHIR data at ${rawDirPath}`);
        activeSource = rawDirPath;
    }

    if (!activeSource) {
        console.error('\n[Error] Dataset missing!');
        console.error('Expected either:');
        console.error(' - data/raw/fhir-100.zip (will be unzipped to .tmp/fhir)');
        console.error(' - data/raw/fhir/ (extracted NDJSON files)');
        process.exit(1);
    }

    // Locate ndjson files
    console.log(`[Process] Scanning ${activeSource} for clinical data...`);
    const files = readdirSync(activeSource, { recursive: true }) as string[];

    const matchedFiles = {
        Patient: [] as string[],
        Encounter: [] as string[],
        Condition: [] as string[]
    };

    files.forEach(file => {
        // filter for ndjson and match resource types
        if (file.endsWith('.ndjson')) {
            if (file.includes('Patient')) matchedFiles.Patient.push(file);
            if (file.includes('Encounter')) matchedFiles.Encounter.push(file);
            if (file.includes('Condition')) matchedFiles.Condition.push(file);
        }
    });

    console.log('\n[Summary] Found clinical records:');
    console.log(` - Patients:   ${matchedFiles.Patient.length} files`);
    console.log(` - Encounters: ${matchedFiles.Encounter.length} files`);
    console.log(` - Conditions: ${matchedFiles.Condition.length} files`);

    if (matchedFiles.Patient.length > 0) {
        console.log('\nFirst few matches:');
        [...matchedFiles.Patient, ...matchedFiles.Encounter, ...matchedFiles.Condition].slice(0, 5).forEach(f => {
            console.log(` - ${f}`);
        });
    }

    // Cleanup if zip
    if (isZipSource && existsSync(tmpPath)) {
        console.log(`\n[Cleanup] Removing temporary folder ${tmpPath}...`);
        rmSync(tmpPath, { recursive: true, force: true });
    }

    console.log('\nPipeline step completed successfully.');
}

main().catch(err => {
    console.error(`\n[Fatal Error] ${err.message}`);
    process.exit(1);
});
