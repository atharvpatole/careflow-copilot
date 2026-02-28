export function withTracing<T>(spanName: string, fn: () => T | Promise<T>): T | Promise<T> {
    // Mock tracing logic to wrap functions and emit spans
    const startTime = Date.now();
    try {
        const result = fn();
        if (result instanceof Promise) {
            return result.finally(() => {
                console.log(`[Trace] ${spanName} took ${Date.now() - startTime}ms`);
            });
        }
        console.log(`[Trace] ${spanName} took ${Date.now() - startTime}ms`);
        return result;
    } catch (err) {
        console.log(`[Trace] ${spanName} failed after ${Date.now() - startTime}ms`);
        throw err;
    }
}
