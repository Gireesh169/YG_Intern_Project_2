
import {
  Activity,
  Award,
  CheckCircle,
  Star,
  Target,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import React from "react";

const num = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));


function useIsDark() {
  const getIsDark = () => {
    const theme =
      document.documentElement.getAttribute("data-theme") ||
      document.body.getAttribute("data-theme");

    return theme !== "light";
  };

  const [isDark, setIsDark] = React.useState(getIsDark);

  React.useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(getIsDark()));
    const opts = { attributes: true, attributeFilter: ["data-theme"] };
    obs.observe(document.documentElement, opts);
    obs.observe(document.body, opts);
    return () => obs.disconnect();
  }, []);

  return isDark;
}

/* ─── Tokens ────────────────────────────────────────────────── */
const T = {
  dark: {
    cardBg:    "#111827",
    border:    "#374151",
    trackBg:   "#374151",
    textPrim:  "#f3f4f6",
    textMuted: "#D1D5DB",
  },
  light: {
    cardBg:    "#ffffff",
    border:    "#e2e8f0",
    trackBg:   "#e2e8f0",
    textPrim:  "#0f172a",
    textMuted: "#64748b",


  },
};

/* ─── Stat card ─────────────────────────────────────────────── */
const StatCard = ({
  isDark, gradient,
  icon: Icon, iconColor,
  badgeBg, badgeIcon: BadgeIcon, badgeIconColor,
  value, label,
}) => {
  const t = isDark ? T.dark : T.light;
  return (
    <div
      className="relative p-[1px] rounded-2xl transition-all duration-300 hover:-translate-y-1"
      style={{ background: `linear-gradient(135deg, ${gradient})` }}
    >
      <div className="rounded-2xl p-6 h-full" style={{ backgroundColor: t.cardBg }}>
        <div className="flex items-center justify-between mb-4">
          <Icon className={`w-8 h-8 opacity-80 ${iconColor}`} />
          <div className="rounded-full p-2" style={{ backgroundColor: badgeBg }}>
            <BadgeIcon className={`w-5 h-5 ${badgeIconColor}`} />
          </div>
        </div>
        <div className="text-3xl font-bold mb-1" style={{ color: t.textPrim }}>{value}</div>
        <div className="text-xs font-medium uppercase tracking-widest" style={{ color: t.textMuted }}>{label}</div>
      </div>
    </div>
  );
};

/* ─── Progress card ─────────────────────────────────────────── */
const ProgressCard = ({ isDark, title, value, barGradient }) => {
  const t = isDark ? T.dark : T.light;
  return (
<div
  className="p-6 rounded-2xl flex items-center justify-between transition-all duration-300 hover:-translate-y-1"
  onMouseEnter={e => {
  e.currentTarget.style.border = isDark
    ? '1px solid rgba(220, 226, 233, 1)'
    : '1px solid rgba(99,102,241,0.6)';
  e.currentTarget.style.boxShadow = isDark
    ? '0 1px 20px rgba(0,0,0,0.1), 0 0 12px 3px rgba(220,226,233,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
    : '0 1px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.2)';
}}
onMouseLeave={e => {
  e.currentTarget.style.border = isDark
    ? '1px solid rgba(220, 226, 233, 0.8)'
    : '1px solid rgba(99,102,241,0.6)';   
  e.currentTarget.style.boxShadow = isDark
    ? '0 2px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
    : '0 1px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.2)';  
}}
style={{
  backgroundColor: isDark ? "#1A2235" : "#FFFFFF",
  border: isDark
    ? "2px solid rgba(220, 226, 233, 0.8)"
    : "1px solid rgba(99,102,241,0.6)",       
  boxShadow: isDark
    ? "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
    : "0 1px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.2)", 
  borderRadius: "1.5rem",
  transition: "all 0.3s ease",
}}
>
      <div>
        <h3 className="font-bold text-2xl mb-6" style={{ color: t.textPrim }}>{title}</h3>
        <div className="text-3xl font-bold" style={{ color: t.textPrim }}>{value}%</div>
        <div className="text-sm mt-1" style={{ color: t.textMuted }}>
          {title === "Mastery" ? "Your topic mastery" : "Questions coverage"}
        </div>
      </div>
      <div className="w-40">
        <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: t.trackBg }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${value}%`, background: barGradient }}
          />
        </div>
      </div>
    </div>
  );
};

/* ─── Main ──────────────────────────────────────────────────── */
const StatsCards = ({ data = {}, subjectEntry = null, isSubjectView = false }) => {
  const isDark = useIsDark();
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
      totalQuestions: Number(v.totalQuestions ?? 0),
      mastery: Number(v.mastery ?? 0),
      raw: v,
    }));
  }

  const statsSource = sourceIsSubject
    ? (subjectEntry?.raw ?? subjectEntry ?? {})
    : (data.raw?.overall?.stats ?? data.raw?.stats ?? data.stats ?? {});

  const s = statsSource.stats ?? statsSource.overall ?? statsSource.summary ?? statsSource;
  const subSource = data.raw?._submoduleSource;
  let effectiveStats = s;

  if (subSource && !s.attendedTotal && !s.totalCorrect && !s.totalIncorrect) {
    let attended = 0, correct = 0, incorrect = 0, uniqueQs = 0;
    const subs = subSource.subModulesFlat?.subModules ?? subSource.subModules ?? [];
    subs.forEach((sm) => {
      attended  += Number(sm.attendedTotal  ?? sm.attended  ?? 0);
      correct   += Number(sm.totalCorrect   ?? sm.correct   ?? 0);
      incorrect += Number(sm.totalIncorrect ?? sm.incorrect ?? 0);
      uniqueQs  += Number(sm.totalQuestions ?? 0);
    });
    effectiveStats = { attendedTotal: attended, totalCorrect: correct, totalIncorrect: incorrect, totalUniqueQuestions: uniqueQs };
  }

  const card_attendedTotal        = num(effectiveStats.attendedTotal ?? effectiveStats.attended ?? effectiveStats.attempted ?? effectiveStats.totalQuestionsAttempted ?? 0);
  const card_totalCorrect         = num(effectiveStats.totalCorrect  ?? effectiveStats.correct  ?? effectiveStats.correctAnswers  ?? 0);
  const card_totalIncorrect       = num(effectiveStats.totalIncorrect ?? effectiveStats.incorrect ?? effectiveStats.wrong ?? 0);
  const card_totalUniqueQuestions = num(s.totalUniqueQuestions ?? s.totalQuestions ?? s.total_questions ?? 0);
  const card_totalUniqueAttended  = num(s.totalUniqueAttended  ?? s.totalUniqueAttempted ?? s.attendedTotal ?? s.attended ?? 0);
  const card_totalCorrectUnique   = num(s.totalCorrectUnique   ?? s.correctUnique   ?? s.totalCorrect   ?? 0);
  const card_totalIncorrectUnique = num(s.totalIncorrectUnique ?? s.incorrectUnique ?? s.totalIncorrect ?? 0);

  const totalPool = num(effectiveStats.totalUniqueQuestions) || num(effectiveStats.totalQuestions) || num(card_totalUniqueQuestions) || num(card_attendedTotal) || 0;
  const attempted = num(effectiveStats.attendedTotal) || num(effectiveStats.attended) || (num(effectiveStats.totalCorrect) + num(effectiveStats.totalIncorrect));
  const computedCoverage = totalPool > 0 ? Math.min(100, Math.round((attempted / totalPool) * 100)) : attempted > 0 ? 100 : 0;

  const displayAccuracy = card_totalCorrect + card_totalIncorrect > 0
    ? Math.round((card_totalCorrect / (card_totalCorrect + card_totalIncorrect)) * 100) : 0;

  const backendAvgScore = sourceIsSubject
    ? num(subjectEntry.raw?.averageScore ?? subjectEntry.raw?.avgScore ?? subjectEntry.raw?.avg_score)
    : num(data.stats?.averageScore ?? data.stats?.avgScore ?? data.stats?.avg_score);
  const computedAttempts = card_totalCorrect + card_totalIncorrect;
  const card_avgScore = Number.isFinite(backendAvgScore) && backendAvgScore > 0
    ? Math.round(backendAvgScore)
    : computedAttempts ? Math.round((card_totalCorrect / computedAttempts) * 100) : 0;

  let coverageFromBackend = null, masteryFromBackend = 0;
  if (sourceIsSubject) {
    const sraw = subjectEntry.raw ?? {};
    if (typeof sraw.coverage === "number")              coverageFromBackend = Math.round(sraw.coverage);
    else if (typeof subjectEntry.coverage === "number") coverageFromBackend = Math.round(subjectEntry.coverage);
    if (typeof sraw.mastery === "number")               masteryFromBackend  = Math.round(sraw.mastery);
    else if (typeof subjectEntry.mastery === "number")  masteryFromBackend  = Math.round(subjectEntry.mastery);
  } else {
    if (typeof data.stats?.coverage === "number") coverageFromBackend = Math.round(data.stats.coverage);
    if (typeof data.stats?.mastery  === "number") masteryFromBackend  = Math.round(data.stats.mastery);
  }

  const completionRate = coverageFromBackend != null && coverageFromBackend > 0 ? coverageFromBackend : computedCoverage;
  const mastery        = masteryFromBackend  != null && masteryFromBackend  > 0 ? masteryFromBackend  : 0;

  // Badge colours
  const bb = (light, dark) => isDark ? dark : light;
  const bi = (light, dark) => isDark ? dark : light;

  return (
    <>
      {/* Mastery & Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProgressCard isDark={isDark} title="Mastery"  value={mastery}       barGradient="linear-gradient(90deg,#6366F1,#3B82F6)" />
        <ProgressCard isDark={isDark} title="Coverage" value={completionRate} barGradient="linear-gradient(90deg,#F59E0B,#06B6D4)" />
      </div>

      <div className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard isDark={isDark} gradient="#3B82F6,#06B6D4"
            icon={Target}      iconColor="text-blue-500"
            badgeBg={bb("#dbeafe","rgba(59,130,246,0.2)")}
            badgeIcon={Activity}   badgeIconColor={bi("text-blue-600","text-blue-300")}
            value={card_attendedTotal} label="Total Questions Attempted" />

          <StatCard isDark={isDark} gradient="#10B981,#06B6D4"
            icon={CheckCircle} iconColor="text-emerald-500"
            badgeBg={bb("#d1fae5","rgba(16,185,129,0.2)")}
            badgeIcon={Zap}        badgeIconColor={bi("text-emerald-600","text-emerald-300")}
            value={card_totalCorrect} label="Total Correct" />

          <StatCard isDark={isDark} gradient="#EF4444,#F59E0B"
            icon={XCircle}     iconColor="text-red-500"
            badgeBg={bb("#fee2e2","rgba(239,68,68,0.2)")}
            badgeIcon={TrendingUp} badgeIconColor={bi("text-red-600","text-red-300")}
            value={card_totalIncorrect} label="Total Incorrect" />

          <StatCard isDark={isDark} gradient="#6366F1,#06B6D4"
            icon={Award}       iconColor="text-indigo-500"
            badgeBg={bb("#e0e7ff","rgba(99,102,241,0.2)")}
            badgeIcon={Star}       badgeIconColor={bi("text-indigo-600","text-indigo-300")}
            value={`${card_avgScore}%`} label="Average Score" />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard isDark={isDark} gradient="#06B6D4,#6366F1"
            icon={Activity}    iconColor="text-cyan-500"
            badgeBg={bb("#cffafe","rgba(6,182,212,0.2)")}
            badgeIcon={Activity}   badgeIconColor={bi("text-cyan-600","text-cyan-300")}
            value={`${card_totalUniqueAttended}/${card_totalUniqueQuestions}`} label="Unique Attended / Total" />

          <StatCard isDark={isDark} gradient="#10B981,#3B82F6"
            icon={CheckCircle} iconColor="text-emerald-500"
            badgeBg={bb("#d1fae5","rgba(16,185,129,0.2)")}
            badgeIcon={Zap}        badgeIconColor={bi("text-emerald-600","text-emerald-300")}
            value={card_totalCorrectUnique} label="Unique Correct" />

          <StatCard isDark={isDark} gradient="#EF4444,#6366F1"
            icon={XCircle}     iconColor="text-red-500"
            badgeBg={bb("#fee2e2","rgba(239,68,68,0.2)")}
            badgeIcon={TrendingUp} badgeIconColor={bi("text-red-600","text-red-300")}
            value={card_totalIncorrectUnique} label="Unique Incorrect" />

          <StatCard isDark={isDark} gradient="#6366F1,#F59E0B"
            icon={Award}       iconColor="text-indigo-500"
            badgeBg={bb("#e0e7ff","rgba(99,102,241,0.2)")}
            badgeIcon={Star}       badgeIconColor={bi("text-indigo-600","text-indigo-300")}
            value={`${displayAccuracy}%`} label="Accuracy" />
        </div>
      </div>
    </>
  );
};

export default StatsCards;