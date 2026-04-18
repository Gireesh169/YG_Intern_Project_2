export function aggregateSubmodulesDatewise(raw) {
    if (!raw) return [];

    const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    // Prefer server-provided datewise arrays, but allow duplicates -> we'll collapse by day below.
    const serverDatewise =
        Array.isArray(raw?.datewise?.stats) && raw.datewise.stats.length ? raw.datewise.stats
            : Array.isArray(raw?.datewise) && raw.datewise.length ? raw.datewise
                : null;

    const collectMap = Object.create(null);

    const recordRow = (day, attempted, correct, avgScore) => {
        if (!day) return;
        const k = String(day);
        if (!collectMap[k]) collectMap[k] = { attempted: 0, correct: 0, weightedScoreSum: 0, scoreSamples: 0 };
        collectMap[k].attempted += toNum(attempted);
        collectMap[k].correct += toNum(correct);
        if (avgScore != null && avgScore !== "" && toNum(attempted) > 0) {
            collectMap[k].weightedScoreSum += toNum(avgScore) * toNum(attempted);
            collectMap[k].scoreSamples += toNum(attempted);
        } else if (toNum(attempted) > 0) {
            collectMap[k].weightedScoreSum += ((toNum(correct) / (toNum(attempted) || 1)) * 100) * toNum(attempted);
            collectMap[k].scoreSamples += toNum(attempted);
        }
    };

    // If server provided an array, iterate and record each row (we'll merge by day)
    if (Array.isArray(serverDatewise) && serverDatewise.length) {
        serverDatewise.forEach((r) => {
            const day = r.day ?? r.date ?? r.label;
            const attempted = r.attended ?? r.attendedTotal ?? r.questionsAttempted ?? r.attempted ?? r.count ?? r.total ?? 0;
            const correct = r.correct ?? r.correctAnswers ?? r.totalCorrect ?? 0;
            const avgScore = r.avgScore ?? r.averageScore ?? r.score ?? null;
            recordRow(day, attempted, correct, avgScore);

            // defensive: if entry contains nested modules/subjects with submodules, record them too
            if (Array.isArray(r.modules) || Array.isArray(r.subjects)) {
                const processModules = (mods = []) => {
                    (mods || []).forEach((m) => {
                        const subs = Array.isArray(m.subModules) ? m.subModules : Array.isArray(m.submodules) ? m.submodules : [];
                        subs.forEach((sm) => {
                            const samedayAttempt = sm.attended ?? sm.attendedTotal ?? sm.attempted ?? sm.count ?? (toNum(sm.totalCorrect) + toNum(sm.totalIncorrect));
                            const samedayCorrect = sm.correct ?? sm.correctAnswers ?? sm.totalCorrect ?? 0;
                            recordRow(day, samedayAttempt, samedayCorrect, sm.avgScore ?? sm.averageScore ?? sm.score ?? null);
                        });
                    });
                };
                if (Array.isArray(r.modules)) processModules(r.modules);
                if (Array.isArray(r.subjects)) r.subjects.forEach((s) => processModules(s.modules ?? []));
            }
        });
    } else {
        // Otherwise attempt to read per-submodule date maps and record each date entry
        const submodulesArr =
            raw?.subModulesFlat?.subModules
            ?? raw?.overallSubmodules
            ?? raw?.subModules
            ?? raw?.submodules
            ?? (Array.isArray(raw?.modules) ? raw.modules.flatMap((g) => (Array.isArray(g.subModules) ? g.subModules : [])) : [])
            ?? [];

        if (Array.isArray(submodulesArr) && submodulesArr.length) {
            submodulesArr.forEach((sm) => {
                if (!sm || typeof sm !== "object") return;
                const candidate = sm.byDate ?? sm.by_date ?? sm.datewise ?? sm.dates ?? sm.attemptsByDate ?? sm.stats ?? null;

                if (Array.isArray(candidate)) {
                    candidate.forEach((entry) => {
                        const date = entry.date ?? entry.day ?? entry.label;
                        const attempted = entry.attended ?? entry.attendedTotal ?? entry.attempted ?? entry.count ?? entry.total ?? (toNum(entry.correct) + toNum(entry.incorrect));
                        const correct = entry.correct ?? entry.correctAnswers ?? entry.totalCorrect ?? 0;
                        const avgScore = entry.avgScore ?? entry.averageScore ?? entry.score ?? null;
                        recordRow(date, attempted, correct, avgScore);
                    });
                } else if (candidate && typeof candidate === "object") {
                    Object.entries(candidate).forEach(([date, entry]) => {
                        const attempted = entry.attended ?? entry.attendedTotal ?? entry.attempted ?? entry.count ?? entry.total ?? (toNum(entry.correct) + toNum(entry.incorrect));
                        const correct = entry.correct ?? entry.correctAnswers ?? entry.totalCorrect ?? 0;
                        const avgScore = entry.avgScore ?? entry.averageScore ?? entry.score ?? null;
                        recordRow(date, attempted, correct, avgScore);
                    });
                } else if (sm.stats && typeof sm.stats === "object") {
                    const nested = sm.stats.byDate ?? sm.stats.datewise ?? sm.stats.dates ?? sm.stats.attemptsByDate ?? sm.stats;
                    if (Array.isArray(nested)) {
                        nested.forEach((entry) => {
                            const date = entry.date ?? entry.day ?? entry.label;
                            const attempted = entry.attended ?? entry.attendedTotal ?? entry.attempted ?? entry.count ?? entry.total ?? (toNum(entry.correct) + toNum(entry.incorrect));
                            const correct = entry.correct ?? entry.correctAnswers ?? entry.totalCorrect ?? 0;
                            const avgScore = entry.avgScore ?? entry.averageScore ?? entry.score ?? null;
                            recordRow(date, attempted, correct, avgScore);
                        });
                    } else if (nested && typeof nested === "object") {
                        Object.entries(nested).forEach(([date, entry]) => {
                            const attempted = entry.attended ?? entry.attendedTotal ?? entry.attempted ?? entry.count ?? entry.total ?? (toNum(entry.correct) + toNum(entry.incorrect));
                            const correct = entry.correct ?? entry.correctAnswers ?? entry.totalCorrect ?? 0;
                            const avgScore = entry.avgScore ?? entry.averageScore ?? entry.score ?? null;
                            recordRow(date, attempted, correct, avgScore);
                        });
                    }
                }
            });
        }
    }

    // Convert map -> array and compute avg score per day
    const datewiseRows = Object.entries(collectMap).map(([day, v]) => {
        const attempted = toNum(v.attempted || 0);
        const correct = toNum(v.correct || 0);
        let avgScore = 0;
        if (attempted > 0) {
            avgScore = v.scoreSamples ? Math.round((v.weightedScoreSum || 0) / (v.scoreSamples || attempted)) : Math.round((correct / (attempted || 1)) * 100);
        }
        return { day, questionsAttempted: attempted, correct, avgScore, score: avgScore };
    });

    // sort by date if possible
    datewiseRows.sort((a, b) => {
        const da = Date.parse(a.day);
        const db = Date.parse(b.day);
        if (!isNaN(da) && !isNaN(db)) return da - db;
        return String(a.day).localeCompare(String(b.day));
    });

    // final shape for chart
    return datewiseRows.map(r => ({ day: r.day, questionsAttempted: r.questionsAttempted, score: r.score }));
}