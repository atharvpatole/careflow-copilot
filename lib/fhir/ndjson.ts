import { createReadStream, existsSync } from 'fs';
import * as readline from 'readline';

/**
 * Memory-safe NDJSON reader using Node streams and readline.
 * Yields parsed objects line-by-line.
 */
export async function* readNdjson<T = any>(filePath: string): AsyncGenerator<T> {
    if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let lineNumber = 0;
    for await (const line of rl) {
        lineNumber++;
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
            yield JSON.parse(trimmed) as T;
        } catch (err: any) {
            throw new Error(
                `Invalid JSON at ${filePath}:${lineNumber} - ${err.message}\nLine: ${trimmed.substring(0, 100)}${trimmed.length > 100 ? '...' : ''
                }`
            );
        }
    }
}

/**
 * Streaming count of lines in an NDJSON file.
 */
export async function countNdjsonLines(filePath: string): Promise<number> {
    if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let count = 0;
    for await (const line of rl) {
        if (line.trim()) {
            count++;
        }
    }
    return count;
}
