export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('Registering Node.js specific instrumentation...');
    }
}
