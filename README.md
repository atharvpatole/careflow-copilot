# Careflow Copilot

Minimal, clean Next.js App Router application serving as a clinical copilot.
Includes a dashboard, ML-driven patient volume forecast, and LLM-powered clinical note extraction.

## Dataset
- **Synthetic Synthea FHIR Bulk Export NDJSON**: Uses a 100 patient dataset.
- **Raw Data Storage**: The dataset is stored as a ZIP in `data/raw/fhir-100.zip` (always committed as zipped; NOT unzipped in the repo).

## How It Works
- **Build-time Pipeline**: A build-time process (via \`npm run derive\`) unzips and parses the NDJSON to generate \`data/derived/metrics.json\` and \`data/derived/forecast.json\`.
- **Runtime APIs**: Runtime API routes (\`/api/metrics\`, \`/api/forecast\`) exclusively read from the derived JSON files to ensure high performance and low memory footprints.
- **LLM Extraction**: The \`/api/note-extract\` endpoint calls OpenAI (or a mock fallback) to perform clinical entity extraction.
- **Observability**: Production environments emit OTel traces directly to **Braintrust** for monitoring and evaluation.

## Braintrust Setup

To enable observability for the OpenAI extraction pipeline, add these variables to your `.env.local`:

```env
BRAINTRUST_API_KEY=your_api_key_here
BRAINTRUST_PARENT="project_name:careflow-copilot"
```

To test locally:
1. Run `npm run dev`
2. Submit a note in the `/note-analyzer` UI (or directly via `/api/note-extract`)
3. Verify traces and spans populate in your Braintrust project UI under the specified `project_name`.

## Local Setup

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Run derivation pipeline**:
   Ensure you have the raw data zip in \`data/raw/fhir-100.zip\`.
   \`\`\`bash
   npm run derive
   npm run validate
   \`\`\`

3. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Deployment
- **Vercel**: Optimized for Vercel deployment.
- **Bundle Optimization**: \`.vercelignore\` ensures only derived JSON and app code are deployed, keeping the serverless bundle size minimal.

## Project Structure
- \`/app\`: Next.js pages and API routes.
- \`/data/raw\`: Source FHIR datasets (zipped).
- \`/data/derived\`: Computed JSON for runtime.
- \`/scripts\`: Data processing scripts.
- \`/lib/fhir\`: NDJSON parsing and transformation logic.
- \`/lib/llm\`: Schema and prompt management.
- \`/lib/obs\`: Observability and tracing helpers.
- \`instrumentation.ts\`: OTel exporter configuration.
