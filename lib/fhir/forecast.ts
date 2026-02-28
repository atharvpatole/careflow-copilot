export type ForecastOutput = {
    generated_at: string;
    method: string;
    history: { date: string; count: number }[];
    forecast: { date: string; yhat: number; lower: number; upper: number }[];
};

export function buildForecast(dailyCounts: { date: string; count: number }[]): ForecastOutput {
    // 1. Sort history by date and take the last 28 days
    const sorted = [...dailyCounts].sort((a, b) => a.date.localeCompare(b.date));
    const recentHistory = sorted.slice(-28);

    // 2. Compute day-of-week averages (0 = Sunday, 1 = Monday ...)
    const weekdayTotals = new Array(7).fill(0);
    const weekdayCounts = new Array(7).fill(0);

    for (const entry of recentHistory) {
        // using UTC mapping to avoid local time skew: YYYY-MM-DD
        const dateObj = new Date(entry.date + 'T00:00:00Z');
        const dow = dateObj.getUTCDay();
        weekdayTotals[dow] += entry.count;
        weekdayCounts[dow]++;
    }

    const weekdayAverages = weekdayTotals.map((total, idx) =>
        weekdayCounts[idx] > 0 ? total / weekdayCounts[idx] : 0
    );

    // 3. Compute standard deviation of recent history for bounds
    let std = 0;
    if (recentHistory.length > 1) {
        const mean = recentHistory.reduce((sum, e) => sum + e.count, 0) / recentHistory.length;
        const variance = recentHistory.reduce((sum, e) => sum + Math.pow(e.count - mean, 2), 0) / (recentHistory.length - 1);
        std = Math.sqrt(variance);
    }

    // 4. Forecast next 14 days
    const forecast: ForecastOutput['forecast'] = [];

    if (recentHistory.length > 0) {
        const lastDateStr = recentHistory[recentHistory.length - 1].date;
        const lastDateObj = new Date(lastDateStr + 'T00:00:00Z');

        for (let i = 1; i <= 14; i++) {
            const nextDateObj = new Date(lastDateObj);
            nextDateObj.setUTCDate(nextDateObj.getUTCDate() + i);

            const dow = nextDateObj.getUTCDay();
            const yhatRaw = weekdayAverages[dow];
            const yhat = Math.round(yhatRaw);

            // Bounds logic
            const currentStd = std > 0 ? std : Math.sqrt(yhatRaw) + 1;

            let lower = Math.round(yhatRaw - 1.5 * currentStd);
            if (lower < 0) lower = 0;

            const upper = Math.round(yhatRaw + 1.5 * currentStd);

            // Format to YYYY-MM-DD
            const nextDateStr = nextDateObj.toISOString().substring(0, 10);

            forecast.push({
                date: nextDateStr,
                yhat,
                lower,
                upper
            });
        }
    }

    return {
        generated_at: new Date().toISOString(),
        method: "weekday-average-std-bounds",
        history: recentHistory,
        forecast
    };
}
