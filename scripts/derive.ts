import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import extract from 'extract-zip';
import { buildMetrics } from '../lib/fhir/metrics';
import { findNdjsonFiles } from '../lib/fhir/file-discovery';

async function main() {
    const rootPath = process.cwd();
    const rawZipPath = join(rootPath, 'data/raw/fhir-1000.zip');
    const rawDirPath = join(rootPath, 'data/raw/fhir');
    const derivedDir = join(rootPath, 'data/derived');
    // Ensure all temporary writes happen inside data/derived which is our workspace area
    const tmpPath = join(derivedDir, '.tmp-fhir');

    let activeSource: string | null = null;
    let isZipSource = false;

    // Determine input source: Prefer Zip -> Dir -> Error
    if (existsSync(rawZipPath)) {
        console.log(`[Source] Found zip at ${rawZipPath}`);
        if (existsSync(tmpPath)) {
            rmSync(tmpPath, { recursive: true, force: true });
        }
        mkdirSync(tmpPath, { recursive: true });

        try {
            console.log(`[Unzip] Extracting to ${tmpPath}...`);
            await extract(rawZipPath, { dir: tmpPath });
            activeSource = tmpPath;
            isZipSource = true;
        } catch (err: unknown) {
            throw new Error(`Failed to extract zip: ${(err as Error).message}`);
        }
    } else if (existsSync(rawDirPath)) {
        console.log(`[Source] Found extracted FHIR data at ${rawDirPath}`);
        activeSource = rawDirPath;
    }

    if (!activeSource) {
        if (process.env.VERCEL) {
            console.log('[Info] Vercel environment detected. Data source omitted from build. Skipping data derivation.');
            return;
        }
        console.error('\n[Error] Dataset missing!');
        process.exit(1);
    }

    // Discover input files
    console.log(`[Discovery] Scanning ${activeSource}...`);
    const encounterFiles = findNdjsonFiles(activeSource, 'Encounter');
    const conditionFiles = findNdjsonFiles(activeSource, 'Condition');
    console.log(`[Discovery] Found ${encounterFiles.length} Encounter files.`);
    console.log(`[Discovery] Found ${conditionFiles.length} Condition files.`);

    // Build metrics
    console.log(`[Metrics] Starting aggregation...`);
    const metrics = await buildMetrics(encounterFiles, conditionFiles);
    console.log(`[Metrics] Processed ${metrics.kpis.total_encounters} total encounters.`);

    // Ensure derived dir exists
    if (!existsSync(derivedDir)) mkdirSync(derivedDir, { recursive: true });

    const metricsPath = join(derivedDir, 'metrics.json');
    writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
    console.log(`[Success] Written derived metrics to ${metricsPath}`);

    // Build Forecast
    console.log(`[Forecast] Generating 14-day projection...`);
    const { buildForecast } = await import('../lib/fhir/forecast');
    const forecastOutput = buildForecast(metrics.series.encounters_by_day);
    const forecastPath = join(derivedDir, 'forecast.json');
    writeFileSync(forecastPath, JSON.stringify(forecastOutput, null, 2));
    console.log(`[Success] Written forecast to ${forecastPath}`);

    // Cleanup temporary extraction folder
    if (isZipSource && existsSync(tmpPath)) {
        console.log(`[Cleanup] Removing temporary folder ${tmpPath}...`);
        rmSync(tmpPath, { recursive: true, force: true });
    }

    console.log('\nPipeline completed successfully.');
}

main().catch(err => {
    console.error(`\n[Fatal Error] ${err.message}`);
    process.exit(1);
});
