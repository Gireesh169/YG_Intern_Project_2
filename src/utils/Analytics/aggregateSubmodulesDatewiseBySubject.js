export function aggregateSubmodulesDatewiseBySubject(raw, subjectId) {
    if (!raw || !subjectId) return [];

    const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const datewise =
        Array.isArray(raw?.datewise?.stats) ? raw.datewise.stats :
            Array.isArray(raw?.datewise) ? raw.datewise :
                [];

    const byDay = Object.create(null);

    datewise.forEach((dayEntry) => {
        const day = dayEntry.date ?? dayEntry.day ?? dayEntry.label;
        if (!day) return;

        /* -------- SUBJECT MATCH (robust) -------- */
        let matchesSubject = false;

        // Case 1: top-level subjectId
        if (dayEntry.subjectId && String(dayEntry.subjectId) === String(subjectId)) {
            matchesSubject = true;
        }

        // Case 2: subjectId exists on modules
        if (!matchesSubject && Array.isArray(dayEntry.modules)) {
            matchesSubject = dayEntry.modules.some(
                (m) =>
                    m.subjectId &&
                    String(m.subjectId) === String(subjectId)
            );
        }

        if (!matchesSubject) return;
        /* ---------------------------------------- */

        if (!byDay[day]) {
            byDay[day] = { correct: 0, attended: 0 };
        }

        const modules = Array.isArray(dayEntry.modules) ? dayEntry.modules : [];

        modules.forEach((mod) => {
            const subModules = Array.isArray(mod.subModules) ? mod.subModules : [];

            subModules.forEach((sm) => {
                byDay[day].correct += toNum(
                    sm.totalCorrect ??
                    sm.totalCorrectUnique ??
                    sm.correct ??
                    0
                );

                byDay[day].attended += toNum(
                    sm.attendedTotal ??
                    sm.totalUniqueAttended ??
                    sm.attended ??
                    0
                );
            });
        });
    });

    return Object.entries(byDay)
        .map(([day, v]) => {
            const attempted = toNum(v.attended);
            const score = attempted > 0
                ? Math.round((toNum(v.correct) / attempted) * 100)
                : 0;

            return {
                day,
                questionsAttempted: attempted,
                score,
            };
        })
        .sort((a, b) => {
            const da = Date.parse(a.day);
            const db = Date.parse(b.day);
            if (!isNaN(da) && !isNaN(db)) return da - db;
            return String(a.day).localeCompare(String(b.day));
        });
}