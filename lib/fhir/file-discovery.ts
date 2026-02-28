import { readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

/**
 * Finds NDJSON files in a directory that match a specific prefix.
 * Returns absolute paths sorted by filename.
 */
export function findNdjsonFiles(baseDir: string, prefix: string): string[] {
    const files = readdirSync(baseDir, { recursive: true }) as string[];

    const matches = files
        .filter(file => {
            const name = basename(file);
            return name.startsWith(prefix) && name.endsWith('.ndjson');
        })
        .map(file => join(baseDir, file))
        .filter(fullPath => statSync(fullPath).isFile());

    return matches.sort((a, b) => basename(a).localeCompare(basename(b)));
}
