import { Award, Clock, Star } from 'lucide-react'
import React from 'react'
import { useTheme } from "../../utils/useTheme";

// ✅ Fix 1: removed useTheme from here — plain function, no hooks
const deriveClassificationAndNotes = (data) => {
    let answers = [];

    if (Array.isArray(data?.questionAnswers)) {
        answers = data.questionAnswers;
    }

    if (!answers.length) {
        try {
            answers = JSON.parse(
                localStorage.getItem("lastQuizQuestionAnswers") || "[]"
            );
        } catch {
            answers = [];
        }
    }

    const important = answers.filter((a) => a.importantQuestion === true);
    const bad = answers.filter((a) => a.badQuestion === true);
    const ok = answers.filter((a) => a.isCorrect === true && a.badQuestion !== true);

    return { important, ok, bad, notes: [] };
}

const QuestionClassificationHighLights = ({ data, subjectEntry, isSubjectView }) => {
    // ✅ Fix 2: isDark defined here in the component where JSX uses it
    const { theme } = useTheme();
    const isDark = theme === "dark";

    function formatTime(seconds) {
        const secs = Number(seconds || 0);
        if (!secs) return "0s";
        const hours = Math.floor(secs / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        const remainingSeconds = secs % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m ${remainingSeconds}s`;
    }

    const num = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
    const derived = deriveClassificationAndNotes(data);

    const classificationSource =
        (data.questionClassification &&
            (data.questionClassification.important?.length ||
                data.questionClassification.ok?.length ||
                data.questionClassification.bad?.length))
            ? data.questionClassification
            : derived;

    const classificationTotalBase =
        classificationSource.important.length +
        classificationSource.ok.length +
        classificationSource.bad.length || 1;

    const classificationData = [
        { name: "Important", value: classificationSource.important?.length || 0, color: "#f59e0b", icon: "⭐" },
        { name: "Got It",    value: classificationSource.ok?.length || 0,        color: "#10b981", icon: "👍" },
        { name: "Difficult", value: classificationSource.bad?.length || 0,       color: "#ef4444", icon: "🚫" },
    ];

    const sourceIsSubject = isSubjectView && subjectEntry;

    if (
        (!Array.isArray(data.subjects) || data.subjects.length === 0) &&
        data.raw?.bySubject &&
        typeof data.raw.bySubject === "object"
    ) {
        data.subjects = Object.entries(data.raw.bySubject).map(([sid, v]) => ({
            subjectId: sid,
            subjectName: v.subjectName ?? v.subject_name ?? v.name ?? sid,
            totalCorrectUnique:   Number(v.totalCorrectUnique   ?? v.correct   ?? 0),
            totalIncorrectUnique: Number(v.totalIncorrectUnique ?? v.incorrect ?? 0),
            totalUniqueAttended:  Number(v.totalUniqueAttended  ?? v.attended  ?? 0),
            totalQuestions:       Number(v.totalQuestions ?? 0),
            mastery:              Number(v.mastery ?? 0),
            raw: v,
        }));
    }

    const statsSource = sourceIsSubject
        ? (subjectEntry?.raw ?? subjectEntry ?? {})
        : (data.raw?.overall?.stats ?? data.raw?.stats ?? data.stats ?? {});

    const s = statsSource.stats ?? statsSource.overall ?? statsSource.summary ?? statsSource;

    let effectiveStats = s;
    const subSource = data.raw?._submoduleSource;

    if (subSource && !s.attendedTotal && !s.totalCorrect && !s.totalIncorrect) {
        let attended = 0, correct = 0, incorrect = 0, uniqueQs = 0;
        const subs = subSource.subModulesFlat?.subModules ?? subSource.subModules ?? [];
        subs.forEach((sm) => {
            attended  += Number(sm.attendedTotal ?? sm.attended ?? 0);
            correct   += Number(sm.totalCorrect  ?? sm.correct  ?? 0);
            incorrect += Number(sm.totalIncorrect ?? sm.incorrect ?? 0);
            uniqueQs  += Number(sm.totalQuestions ?? 0);
        });
        effectiveStats = { attendedTotal: attended, totalCorrect: correct, totalIncorrect: incorrect, totalUniqueQuestions: uniqueQs };
    }

    const card_totalCorrect        = num(effectiveStats.totalCorrect   ?? effectiveStats.correct   ?? 0);
    const card_totalIncorrect      = num(effectiveStats.totalIncorrect ?? effectiveStats.incorrect ?? 0);
    const card_totalUniqueAttended = num(s.totalUniqueAttended ?? s.totalUniqueAttempted ?? s.attendedTotal ?? s.attended ?? 0);
    const uniqueAttended           = Number(card_totalUniqueAttended || (card_totalCorrect + card_totalIncorrect));

    const baseTotalTime = sourceIsSubject
        ? (num(subjectEntry.totalTime) ?? 0)
        : (num(data.stats?.totalTime) ?? num(data.stats?.totalTimeSpent) ?? 0);

    const backendAvgTime = sourceIsSubject
        ? (subjectEntry?.raw?.avgTime ?? subjectEntry?.raw?.avgTimeSpent ?? subjectEntry?.raw?.avg_time_spent)
        : (data.stats?.avgTime ?? data.stats?.avgTimeSpent ?? data.raw?.avgTime);

    let displayAvgTimeSeconds = 0;
    if (Number(backendAvgTime) > 0) {
        displayAvgTimeSeconds = backendAvgTime < 1000
            ? Math.round(backendAvgTime * 60)
            : Math.round(backendAvgTime);
    } else if (uniqueAttended > 0 && baseTotalTime > 0) {
        displayAvgTimeSeconds = Math.round(baseTotalTime / uniqueAttended);
    }

    return (
        <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-2xl p-6"
            onMouseEnter={e => {
                e.currentTarget.style.border = isDark
                    ? '1px solid rgba(220,226,233,1)'
                    : '1px solid rgba(99,102,241,0.5)';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 16px 3px rgba(220,226,233,0.2)'
                    : '0 4px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.border = isDark
                    ? '1px solid rgba(220,226,233,0.8)'
                    : '1px solid #E2E8F0';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)'
                    : '0 4px 16px rgba(99,102,241,0.08)';
            }}
            style={{
                border: isDark ? "1px solid rgba(220,226,233,0.8)" : "1px solid #E2E8F0",
                backgroundColor: isDark ? "#111827" : "#FFFFFF",
                boxShadow: isDark
                    ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)"
                    : "0 4px 16px rgba(99,102,241,0.08)",
                transition: "border 0.3s ease, box-shadow 0.3s ease",
            }}
        >
            {/* Question Classification */}
            <div
                onMouseEnter={e => { e.currentTarget.style.border = isDark ? '1px solid rgba(220,226,233,1)' : '1px solid rgba(99,102,241,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.border = isDark ? '1px solid rgba(220,226,233,0.8)' : '1px solid #E2E8F0'; }}
                style={{
                    backgroundColor: isDark ? "#111827" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(220,226,233,0.8)" : "1px solid #E2E8F0",
                    transition: "border 0.3s ease",
                }}
                className="p-6 rounded-2xl shadow-xl"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg" style={{ color: isDark ? "#E5E7EB" : "#0f172a" }}>Question Classification</h3>
                        <p className="text-sm" style={{ color: isDark ? "#6B7280" : "#64748b" }}>How you marked questions</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {classificationData.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="text-3xl">{item.icon}</div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold" style={{ color: isDark ? "#9CA3AF" : "#64748b" }}>{item.name}</span>
                                    <span className="font-bold text-lg" style={{ color: item.color }}>{item.value}</span>
                                </div>
                                <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: isDark ? "#1F2937" : "#E2E8F0" }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${classificationTotalBase ? (item.value / classificationTotalBase) * 100 : 0}%`,
                                            backgroundColor: item.color,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Highlights */}
            <div
                onMouseEnter={e => { e.currentTarget.style.border = isDark ? '1px solid rgba(220,226,233,1)' : '1px solid rgba(99,102,241,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.border = isDark ? '1px solid rgba(220,226,233,0.8)' : '1px solid #E2E8F0'; }}
                style={{
                    backgroundColor: isDark ? "#111827" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(220,226,233,0.8)" : "1px solid #E2E8F0",
                    transition: "border 0.3s ease",
                }}
                className="p-6 rounded-2xl shadow-xl"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg" style={{ color: isDark ? "#E5E7EB" : "#0f172a" }}>Highlights</h3>
                        <p className="text-sm" style={{ color: isDark ? "#6B7280" : "#64748b" }}>Your best achievements</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div
                        className="p-5 rounded-2xl transition-colors"
                        style={{
                            backgroundColor: isDark ? "rgba(31,41,55,0.5)" : "#F8FAFC",
                            border: isDark ? "1px solid #374151" : "1px solid #E2E8F0",
                        }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Clock className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="font-medium text-sm" style={{ color: isDark ? "#D1D5DB" : "#64748b" }}>Avg Time Spent</span>
                        </div>
                        <div className="text-3xl font-bold tracking-tight" style={{ color: isDark ? "#FFFFFF" : "#0f172a" }}>
                            {formatTime(displayAvgTimeSeconds)}
                        </div>
                    </div>

                    <div
                        className="p-5 rounded-2xl transition-colors"
                        style={{
                            backgroundColor: isDark ? "rgba(31,41,55,0.5)" : "#F8FAFC",
                            border: isDark ? "1px solid #374151" : "1px solid #E2E8F0",
                        }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Clock className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="font-medium text-sm" style={{ color: isDark ? "#D1D5DB" : "#64748b" }}>Time Spent</span>
                        </div>
                        <div className="text-3xl font-bold tracking-tight" style={{ color: isDark ? "#FFFFFF" : "#0f172a" }}>
                            {formatTime(baseTotalTime || 0)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestionClassificationHighLights;