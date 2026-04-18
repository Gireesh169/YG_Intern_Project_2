// src/components/analytics/SubjectChapterBarChart.jsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * SubjectChapterBarChart
 * - Same normalization logic as before
 * - New theme prop for better contrast on gradients or white cards
 *
 * Props:
 * - modulesPayload = []
 * - totalQuestionsBySubject = {}
 * - bySubject = {}
 * - height = 280
 * - theme = "auto" | "dark" | "light"   // default "auto" -> dark-friendly
 */
export default function SubjectChapterBarChart({
  modulesPayload = [],
  totalQuestionsBySubject = {},
  bySubject = {},
  height = 280,
  theme = "auto",
}) {
  const n = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));

  // theme handling
  const isDark = theme === "dark" || theme === "auto";
  const AXIS_COLOR = isDark ? "#9CA3AF" : "#374151";
  const GRID_COLOR = isDark ? "#1F2937" : "rgba(15,23,42,0.04)";
  const TOOLTIP_BG = isDark ? "#111827" : "#ffffff";
  const TOOLTIP_BORDER = isDark ? "#1F2937" : "#e5e7eb";
  const TOOLTIP_COLOR = isDark ? "#E5E7EB" : "#0f172a";

  const COLORS = {
    correct: "#22C55E",
    wrong: "#EF4444",
    unattempted: "#1F2937",
    correctGlow: "#22C55E",
    wrongGlow: "#EF4444",
    stroke: isDark ? "#0B0F19" : "rgba(255,255,255,0.9)",
    strokeWidth: isDark ? 1 : 1,
  };

  // STEP 1 — normalize modulesPayload -> flat modules array (unchanged)
  const modules = useMemo(() => {
    if (!modulesPayload) return [];

    if (typeof modulesPayload === "object" && !Array.isArray(modulesPayload)) {
      if (Array.isArray(modulesPayload.modules)) return modulesPayload.modules;

      if (Array.isArray(modulesPayload.stats)) {
        const stats = modulesPayload.stats;
        const withModules = stats.find((s) => Array.isArray(s.modules));
        if (withModules) return withModules.modules;
        if (stats.every((s) => s && (s.moduleId || s.name || s.moduleName)))
          return stats;
      }
      return [];
    }

    if (Array.isArray(modulesPayload)) {
      const out = [];
      modulesPayload.forEach((m) => {
        if (!m) return;
        if (Array.isArray(m.modules)) out.push(...m.modules);
        else out.push(m);
      });
      return out;
    }

    return [];
  }, [modulesPayload]);

  // STEP 2 — compute chartData (unchanged logic)
  const chartData = useMemo(() => {
    if (!modules || !modules.length) return [];

    return modules.map((m) => {
      const subjectId =
        m.subjectId ?? m.subject_id ?? m.parentSubjectId ?? m.subject ?? null;
      const moduleName = (
        m.moduleName ??
        m.module_name ??
        m.name ??
        m.title ??
        "Untitled"
      ).toString();

      const totalCorrect = n(
        m.totalCorrectUnique ??
          m.total_correct_unique ??
          m.correctAnswers ??
          m.correct ??
          0,
      );

      const totalIncorrect = n(
        m.totalIncorrectUnique ??
          m.total_incorrect_unique ??
          m.incorrectAnswers ??
          m.incorrect ??
          0,
      );

      const moduleTotalQ = n(
        m.totalQuestions ?? m.total_questions ?? m.total ?? 0,
      );

      const moduleAttended = n(
        m.totalUniqueAttended ??
          m.total_unique_attended ??
          m.totalUniqueAttempted ??
          m.attended ??
          0,
      );

      const subjTotalQ =
        subjectId && totalQuestionsBySubject[subjectId]
          ? n(totalQuestionsBySubject[subjectId])
          : 0;
      const totalForModule = subjTotalQ > 0 ? subjTotalQ : moduleTotalQ;

      const attemptedUnique = Math.max(
        moduleAttended,
        totalCorrect + totalIncorrect,
        0,
      );
      const effectiveTotal =
        totalForModule || totalCorrect + totalIncorrect || attemptedUnique || 0;
      const unattempted = Math.max(effectiveTotal - attemptedUnique, 0);

      return {
        moduleId: m.moduleId ?? m.module_id ?? m.id ?? null,
        moduleName,
        correct: totalCorrect,
        wrong: totalIncorrect,
        unattempted,
        totalQ: effectiveTotal,
        attended: attemptedUnique,
      };
    });
  }, [modules, totalQuestionsBySubject, bySubject]);

  if (!chartData.length) {
    return (
      <div className="h-40 flex items-center justify-center text-[#6B7280] text-sm">
        No chapter/module data available.
      </div>
    );
  }

  // nicer tooltip that adapts to theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const rows = payload.map((p) => ({
      name: p.name,
      value: p.value,
      color: p.fill,
    }));
    return (
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          background: TOOLTIP_BG,
          color: TOOLTIP_COLOR,
          border: `1px solid ${TOOLTIP_BORDER}`,
          boxShadow: isDark
            ? "0 0 24px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.5)"
            : "0 6px 18px rgba(0,0,0,0.12)",
          minWidth: 160,
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 11,
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: `1px solid ${TOOLTIP_BORDER}`,
            color: isDark ? "#9CA3AF" : "#6B7280",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#6366F1",
              boxShadow: "0 0 4px #6366F1",
            }}
          />
          {label}
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
              gap: 16,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: r.color || "#ddd",
                  borderRadius: 2,
                  boxShadow: isDark ? `0 0 4px ${r.color}` : "none",
                }}
              />
              <div
                style={{ fontSize: 12, color: isDark ? "#9CA3AF" : "#374151" }}
              >
                {r.name}
              </div>
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: r.color || TOOLTIP_COLOR,
              }}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            vertical={false}
          />
          <XAxis
            dataKey="moduleName"
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={52}
          />
          <YAxis
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Questions",
              angle: -90,
              position: "insideLeft",
              style: { fill: AXIS_COLOR, fontSize: 11 },
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: isDark ? "rgba(99,102,241,0.06)" : "rgba(0,0,0,0.04)",
            }}
          />
          <Legend
            verticalAlign="top"
            wrapperStyle={{
              color: AXIS_COLOR,
              fontSize: 12,
              paddingBottom: 8,
            }}
          />

          {/* Bars: stroke + fill to pop on gradients and white backgrounds */}
          <Bar
            dataKey="correct"
            stackId="a"
            fill={COLORS.correct}
            name="Unique Correct"
            stroke={COLORS.stroke}
            strokeWidth={COLORS.strokeWidth}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="wrong"
            stackId="a"
            fill={COLORS.wrong}
            name="Unique Incorrect"
            stroke={COLORS.stroke}
            strokeWidth={COLORS.strokeWidth}
          />
          <Bar
            dataKey="unattempted"
            stackId="a"
            fill={COLORS.unattempted}
            name="Not Attempted"
            stroke={COLORS.stroke}
            strokeWidth={COLORS.strokeWidth}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
