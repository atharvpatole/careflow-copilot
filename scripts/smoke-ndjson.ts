import { readNdjson, countNdjsonLines } from '../lib/fhir/ndjson';
import { existsSync, readdirSync, mkdirSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import extract from 'extract-zip';

async function runSmoke() {
    const root = process.cwd();
    const zipPath = join(root, 'data/raw/fhir-100.zip');
    const tmpDir = join(root, '.tmp/smoke-fhir');

    console.log('--- NDJSON Smoke Test ---');

    let testFile: string | null = null;

    if (existsSync(zipPath)) {
        console.log(`[Prep] Found zip at ${zipPath}. Extracting...`);
        if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
        mkdirSync(tmpDir, { recursive: true });
        await extract(zipPath, { dir: tmpDir });

        // Find first real file
        const items = readdirSync(tmpDir, { recursive: true }) as string[];
        console.log(`[Prep] Extracted ${items.length} items.`);

        for (const item of items) {
            const full = join(tmpDir, item);
            if (statSync(full).isFile() && item.endsWith('.ndjson')) {
                testFile = full;
                break;
            }
        }
    }

    if (!testFile) {
        console.error('[Error] No sample NDJSON files found for testing.');
        process.exit(1);
    }

    console.log(`[Test] File: ${testFile}`);

    // Test Reader
    console.log('[Test] Reading records...');
    let count = 0;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for await (const obj of readNdjson<any>(testFile)) {
            console.log(` - Record[${count}]: resourceType="${obj.resourceType}" | id="${obj.id}"`);
            count++;
            if (count >= 3) break;
        }
    } catch (err: unknown) {
        console.error(`[Error] Reader failed: ${(err as Error).message}`);
        process.exit(1);
    }

    if (count === 0) {
        console.warn('[Warn] Completed without reading any records.');
    }

    // Test Count
    console.log('[Test] Counting lines...');
    const total = await countNdjsonLines(testFile);
    console.log(` - Total valid lines: ${total}`);

    // Cleanup
    if (existsSync(tmpDir)) {
        console.log(`[Cleanup] Removing temporary files...`);
        rmSync(tmpDir, { recursive: true, force: true });
    }

    console.log('\nSmoke test PASSED.');
}

runSmoke().catch(err => {
    console.error(`\n[Smoke Failed] ${err.message}`);
    process.exit(1);
});
