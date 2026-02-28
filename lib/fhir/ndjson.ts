import { createReadStream } from 'fs';
import * as readline from 'readline';

export async function* parseNDJSON(filePath: string) {
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.trim()) {
            yield JSON.parse(line);
        }
    }
}
