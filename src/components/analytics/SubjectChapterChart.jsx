import React from "react";
import {
  Bar, BarChart, CartesianGrid, LabelList,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import SubjectChapterBarChart from "./SubjectChapterBarChart";
import { Calendar } from "lucide-react";
import { useTheme } from "../../utils/useTheme";

const buildSubjectBarData = (canonical) => {
  const n = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));

  const resolveMastery = (s, sid) => {
    if (s && (s.mastery != null || s.masteryPercent != null || s.mastery_pct != null || s.mastery_percentage != null)) {
      return s.mastery ?? s.masteryPercent ?? s.mastery_pct ?? s.mastery_percentage ?? null;
    }
    try {
      const bySub = canonical?.raw?.bySubject;
      if (bySub && sid) {
        const cand = bySub[sid] ?? bySub[String(sid)];
        if (cand) return cand.mastery ?? cand.masteryPercent ?? cand.mastery_pct ?? cand.mastery_percentage ?? null;
      }
    } catch (e) {}
    if (Array.isArray(canonical?.subjects)) {
      const found = canonical.subjects.find((it) => {
        const id = it.subjectId ?? it.subject_id ?? it.id ?? it.key;
        return id != null && sid != null ? String(id) === String(sid) : false;
      });
      if (found && found.mastery != null) return found.mastery;
    }
    return null;
  };

  if (Array.isArray(canonical?.stats) && canonical.stats.length) {
    return canonical.stats.map((s) => {
      const subjectId = s.subjectId ?? s.subject_id ?? s.id ?? null;
      const subjectName = (s.subjectName ?? s.subject_name ?? s.name ?? "").toString();
      const totalQ = n(s.totalQuestions ?? s.total_questions ?? s.total ?? s.totalQ ?? 0);
      const totalUniqueAttended = n(s.totalUniqueAttended ?? s.total_unique_attended ?? s.totalUserUniqueAttemptedQs ?? s.totalUniqueAtt ?? 0);
      const correctUnique = n(s.totalCorrectUnique ?? s.total_correct_unique ?? s.correctUnique ?? s.correct ?? 0);
      const incorrectUnique = n(s.totalIncorrectUnique ?? s.total_incorrect_unique ?? s.incorrectUnique ?? s.incorrect ?? 0);
      const unattempted = Math.max(totalQ - totalUniqueAttended, 0);
      const masteryRaw = resolveMastery(s, subjectId);
      const mastery = masteryRaw != null && !Number.isNaN(Number(masteryRaw)) ? Math.round(Number(masteryRaw)) : 0;
      return { subjectId, subject: subjectName || "Unknown", correct: correctUnique, wrong: incorrectUnique, attended: totalUniqueAttended, totalQ, unattempted, mastery };
    });
  }

  if (Array.isArray(canonical?.modules) && canonical.modules.length) {
    return canonical.modules.map((group) => {
      const subjectId = group.subjectId ?? group.subject_id ?? group.id ?? null;
      const subjectName = (group.subjectName ?? group.subject_name ?? group.name ?? "").toString();
      const moduleEntries = Array.isArray(group.modules) ? group.modules : Array.isArray(group) ? group : [];
      const agg = moduleEntries.reduce((acc, m) => {
        acc.totalQ += n(m.totalQuestions ?? m.total_questions ?? m.total ?? 0);
        acc.attended += n(m.totalUniqueAttended ?? m.total_unique_attended ?? m.totalUserUniqueAttemptedQs ?? m.attended ?? 0);
        acc.correct += n(m.totalCorrectUnique ?? m.total_correct_unique ?? m.correctUnique ?? m.correct ?? 0);
        acc.wrong += n(m.totalIncorrectUnique ?? m.total_incorrect_unique ?? m.incorrectUnique ?? m.incorrect ?? 0);
        return acc;
      }, { correct: 0, wrong: 0, attended: 0, totalQ: 0 });
      const unattempted = Math.max(agg.totalQ - agg.attended, 0);
      const masteryRaw = resolveMastery(group, subjectId);
      const mastery = masteryRaw != null && !Number.isNaN(Number(masteryRaw)) ? Math.round(Number(masteryRaw)) : 0;
      return { subjectId, subject: subjectName || "Unknown", correct: agg.correct, wrong: agg.wrong, attended: agg.attended, totalQ: agg.totalQ || agg.correct + agg.wrong, unattempted, mastery };
    });
  }

  if (Array.isArray(canonical?.subjects) && canonical.subjects.length) {
    return canonical.subjects.map((s) => {
      const subjectId = s.subjectId ?? s.subject_id ?? s.id ?? s.key;
      const subjectName = (s.subjectName ?? s.subject_name ?? s.name ?? "").toString();
      const totalQ = n(s.totalQuestions ?? s.total_questions ?? s.total ?? 0);
      const totalUniqueAttended = n(s.totalUniqueAttended ?? s.total_unique_attended ?? s.totalUserUniqueAttemptedQs ?? s.attended ?? 0);
      const correctUnique = n(s.totalCorrectUnique ?? s.total_correct_unique ?? s.correctUnique ?? s.correct ?? 0);
      const incorrectUnique = n(s.totalIncorrectUnique ?? s.total_incorrect_unique ?? s.incorrectUnique ?? s.incorrect ?? 0);
      const unattempted = Math.max(totalQ - totalUniqueAttended, 0);
      const masteryRaw = resolveMastery(s, subjectId);
      const mastery = masteryRaw != null && !Number.isNaN(Number(masteryRaw)) ? Math.round(Number(masteryRaw)) : 0;
      return { subjectId, subject: subjectName || "Unknown", correct: correctUnique, wrong: incorrectUnique, attended: totalUniqueAttended, totalQ, unattempted, mastery };
    });
  }

  return [];
};

// Default mastery circle renderer
function defaultRenderMasteryCircle(props) {
  const { x, y, width, value } = props || {};
  const cx = (x || 0) + ((width || 0) / 2);
  const cy = (y || 0) - 16;
  const r = 14;
  const display = value == null || Number.isNaN(Number(value)) ? 0 : Math.round(Number(value));
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#6366F1" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
        {`${display}%`}
      </text>
    </g>
  );
}

const SubjectChapterChart = ({
  // ── new-style props (from AdminOverallStats / AnalyticsDashboard)
  data,
  subjectEntry,
  viewCourse,
  // ── old-style props (from original callers)
  modulesPayloadForChart: modulesPayloadProp,
  chartVersion,
  renderMasteryCircle: renderMasteryCircleProp,
  totalQuestionsBySubject,
  bySubjectMap,
  subjectBarData: subjectBarDataProp,
  // ── shared
  isSubjectView,
  loading,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ── Derive modulesPayloadForChart from data if not passed directly ──
  const modulesPayloadForChart = modulesPayloadProp ?? (() => {
    if (!data) return [];
    if (Array.isArray(data.modules) && data.modules.length) return data.modules;
    if (Array.isArray(data.raw?.modules) && data.raw.modules.length) return data.raw.modules;
    if (Array.isArray(data.modulesMeta?.stats) && data.modulesMeta.stats.length) return data.modulesMeta.stats;
    return [];
  })();

  // ── Derive subjectBarData from data if not passed directly ──
  const subjectBarData = subjectBarDataProp ?? (() => {
    if (!data) return [];
    return buildSubjectBarData(data);
  })();

  // ── Mastery circle renderer ──
  const renderMasteryCircle = renderMasteryCircleProp ?? defaultRenderMasteryCircle;

  // ── Theme colors ──
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const cardBorder = isDark ? "#1F2937" : "#E2E8F0";
  const textPrimary = isDark ? "#E5E7EB" : "#0F172A";
  const textMuted = isDark ? "#6B7280" : "#94A3B8";
  const gridColor = isDark ? "#1F2937" : "#E2E8F0";
  const tickColor = isDark ? "#9CA3AF" : "#64748B";
  const tooltipStyle = {
    background: isDark ? "#111827" : "#FFFFFF",
    border: `1px solid ${cardBorder}`,
    borderRadius: 8,
    color: textPrimary,
    fontSize: 12,
  };

  return (
<div
  className="p-6 rounded-2xl"
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
    transition: "border 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease",
  }}
>
      {isSubjectView ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.08)",
                  border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.25)"}`,
                }}
              >
                <Calendar className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3
                  className="font-bold text-lg transition-colors"
                  style={{ color: textPrimary }}
                >
                  Textbook-wise Progress
                </h3>
                <p
                  className="text-sm transition-colors"
                  style={{ color: textMuted }}
                >
                  X-axis: Textbooks & Ref · Y-axis: Number of questions ·
                  Green = Correct · Red = Incorrect · Gray = Unattempted
                </p>
              </div>
            </div>
          </div>

          {!loading ? (
            modulesPayloadForChart && modulesPayloadForChart.length > 0 ? (
              <SubjectChapterBarChart
                key={`${chartVersion || 0}-${modulesPayloadForChart.length}-${modulesPayloadForChart
                  .map((m) => m.moduleId ?? m.module_id ?? m.id ?? m.moduleName ?? m.module_name ?? (m.title || m.name) ?? "x")
                  .join(",")}`}
                modulesPayload={modulesPayloadForChart.slice()}
                totalQuestionsBySubject={totalQuestionsBySubject}
                bySubject={bySubjectMap}
                height={320}
                theme={isDark ? "dark" : "light"}
              />
            ) : (
              <div
                className="h-40 flex items-center justify-center text-sm transition-colors"
                style={{ color: textMuted }}
              >
                No chapter/module data available for this subject.
              </div>
            )
          ) : (
            <div
              className="h-40 flex items-center justify-center text-sm transition-colors"
              style={{ color: textMuted }}
            >
              Loading chapter-wise data…
            </div>
          )}
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.08)",
                  border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.25)"}`,
                }}
              >
                <Calendar className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3
                  className="font-bold text-lg transition-colors"
                  style={{ color: textPrimary }}
                >
                  Questions per Subject
                </h3>
                <p
                  className="text-sm transition-colors"
                  style={{ color: textMuted }}
                >
                  Based on your real attempts
                </p>
              </div>
            </div>
          </div>

          {/* Chart or empty */}
          {subjectBarData.length === 0 ? (
            <div
              className="h-40 flex items-center justify-center text-sm transition-colors"
              style={{ color: textMuted }}
            >
              No subject-wise data available.
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectBarData}
                  margin={{ top: 36, right: 10, left: -10, bottom: 40 }}
                  isAnimationActive={false}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="subject"
                    tick={{ fill: tickColor, fontSize: 12 }}
                    tickLine={{ stroke: gridColor }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: tickColor, fontSize: 12 }}
                    tickLine={{ stroke: gridColor }}
                    label={{
                      value: "Questions",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: tickColor, fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)" }}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: isDark ? "#9CA3AF" : "#64748B" }}
                  />
                  <Bar dataKey="correct" stackId="a" fill="#22C55E" name="Correct" />
                  <Bar dataKey="wrong" stackId="a" fill="#EF4444" name="Incorrect" />
                  <Bar
                    dataKey="unattempted"
                    stackId="a"
                    fill={isDark ? "#1F2937" : "#CBD5E1"}
                    name="Unattempted"
                  >
                    <LabelList dataKey="mastery" content={renderMasteryCircle} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubjectChapterChart;