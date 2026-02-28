async function run() {
    const note = `
CHIEF COMPLAINT: Patient presents with persistent headache and mild nausea for the past 3 days.

HPI: 45-year-old male reporting a throbbing, bifrontal headache that started 3 days ago. He rates the pain as 6/10. He also complains of mild intermittent nausea, but no vomiting. He denies visual changes, fever, neck stiffness, or weakness. He reports taking over-the-counter Ibuprofen 400mg with minimal relief. 

PAST MEDICAL HISTORY:
- Hypertension

MEDICATIONS:
- Lisinopril 10mg daily
- Ibuprofen 400mg PRN for pain

ALLERGIES:
- Penicillin (causes hives)

ASSESSMENT & PLAN:
1. Tension-type headache. Recommended rest, hydration, and adjusting pain management to Acetaminophen. 
2. Nausea: likely related to headache. Recommended small, frequent meals.
3. Hypertension: well controlled. Continue current Lisinopril.
4. Red flag screen negative. If symptoms worsen, develop visual changes, or neck stiffness, patient should seek immediate emergency care (High severity potential if missed).
5. Follow up in clinic in 1 week if no improvement.
`;

    console.log(`Sending note of length: ${note.length}`);

    try {
        const res = await fetch("http://localhost:3000/api/note-extract", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ note })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API Error: ${res.status} ${res.statusText} \n${text}`);
        }

        const data = await res.json();
        console.log("Success! Data received:");
        console.log(`- Summary Length: ${data.result.summary.length} chars`);
        console.log(`- Problems Count: ${data.result.problems.length}`);
        console.log(`- Medications Count: ${data.result.medications.length}`);
        console.log(`- Allergies Count: ${data.result.allergies.length}`);
        console.log(`- FollowUps Count: ${data.result.followUps.length}`);
        console.log(`- RedFlags Count: ${data.result.redFlags.length}`);

        console.log("\nRaw Result object from schema:");
        console.log(JSON.stringify(data.result, null, 2));

    } catch (error) {
        console.error("Smoke test failed:", error);
        process.exit(1);
    }
}

run();
