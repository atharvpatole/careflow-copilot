# Careflow Copilot

Minimal, clean Next.js App Router application serving as a clinical copilot.
Includes a dashboard, ML-driven patient volume forecast, and LLM-powered clinical note extraction.

## Dataset
- **Synthetic Synthea FHIR Bulk Export NDJSON**: Uses a 100 patient dataset.
- **Exact placement**:
  - Valid: A zip file at `data/raw/fhir-100.zip` containing the `.ndjson` files.
  - Invalid: Do not place raw `.ndjson` files in `data/raw/` or `data/raw/fhir-100/`. Keep them zipped to avoid bloating the git repo.

## How It Works
- **Build-time Pipeline**: A build-time process (via \`npm run derive\`) unzips and parses the NDJSON to generate \`data/derived/metrics.json\` and \`data/derived/forecast.json\`.
- **Runtime APIs**: Runtime API routes (\`/api/metrics\`, \`/api/forecast\`) exclusively read from the derived JSON files to ensure high performance and low memory footprints.
- **LLM Extraction**: The \`/api/note-extract\` endpoint calls OpenAI (or a mock fallback) to perform clinical entity extraction.
- **Observability**: Production environments emit OTel traces directly to **Braintrust** for monitoring and evaluation.

## Environment Variables (Local + Vercel)

For local development (`.env.local`) and Vercel deployment, ensure the following exact environment variables are set:

```env
OPENAI_API_KEY=your_openai_api_key
BRAINTRUST_API_KEY=your_braintrust_api_key
BRAINTRUST_PARENT="project_name:careflow-copilot"
```

These unlock the LLM extraction pipeline and observability platform.

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

Steps for Vercel deployment:
1. **Push to GitHub**: Commit your changes and push to a GitHub repository.
2. **Import to Vercel**: Create a new project in Vercel and import your repository.
3. **Set Env Vars**: Assign the exact environment variables: `OPENAI_API_KEY`, `BRAINTRUST_API_KEY`, and `BRAINTRUST_PARENT`.
4. **Deploy**: Click Deploy. Vercel will automatically run the derivation scripts during build.
5. **Open Applications**: Navigate to `/dashboard`, `/forecast`, and `/note-analyzer` to verify they load.
6. **Verify Braintrust Traces**: Submit an extraction on `/note-analyzer` and confirm traces appear in your Braintrust dashboard.

## Project Structure
- \`/app\`: Next.js pages and API routes.
- \`/data/raw\`: Source FHIR datasets (zipped).
- \`/data/derived\`: Computed JSON for runtime.
- \`/scripts\`: Data processing scripts.
- \`/lib/fhir\`: NDJSON parsing and transformation logic.
- \`/lib/llm\`: Schema and prompt management.
- \`/lib/obs\`: Observability and tracing helpers.
- \`instrumentation.ts\`: OTel exporter configuration.
