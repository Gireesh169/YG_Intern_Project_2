import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { aggregateSubmodulesDatewise } from "../../utils/Analytics/aggregateSubmodulesDatewise";
import { buildFixedDateRangeData } from "../../utils/Analytics/buildFixedDateRangeData.JS";
import { useTheme } from "../../utils/useTheme"; 

const LineCharts = ({
  data = {},
  subjectEntry = null,
  isSubjectView = false,
  activityRange,
  setActivityRange,
}) => {
  const { theme } = useTheme();                  
  const isDark = theme === "dark";

  const rawActivity = Array.isArray(data.activity) ? data.activity : [];
  const baseActivity =
    rawActivity.length > 0
      ? rawActivity.map((item) => {
          const correct = Number(item.correct ?? item.correctAnswers ?? 0);
          const wrong = Number(item.wrong ?? item.incorrectAnswers ?? 0);
          const unattempted = Number(item.unattempted ?? item.unattemptedQuestions ?? 0);
          const attempted = Number(
            item.attempted ?? item.count ?? item.totalQuestionsAttempted ?? correct + wrong,
          );
          return {
            day: item.day || item.label || item.date || null,
            correct,
            wrong,
            unattempted,
            attempted,
          };
        })
      : [];

  const getActivityByRange = (range) => {
    let days;
    switch (range) {
      case "1w": days = 7; break;
      case "1m": days = 30; break;
      case "3m": days = 90; break;
      case "6m": days = 180; break;
      case "1y": days = 365; break;
      default: days = 30;
    }
    if (baseActivity.length >= days) return baseActivity.slice(baseActivity.length - days);
    const missing = days - baseActivity.length;
    const padded = [];
    for (let i = missing; i > 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      padded.push({
        day: d.toISOString().split("T")[0],
        correct: 0, wrong: 0, unattempted: 0, attempted: 0,
      });
    }
    padded.push(...baseActivity);
    return padded;
  };

  const processedActivityWithBreakdown = getActivityByRange(activityRange);

  let lineChartData = [];

  const derivedFromSubmodules =
    Array.isArray(data._derivedDatewiseFromSubmodules) &&
    data._derivedDatewiseFromSubmodules.length
      ? data._derivedDatewiseFromSubmodules
      : null;

  if (derivedFromSubmodules) {
    lineChartData = derivedFromSubmodules.map((r) => ({
      day: r.day,
      questionsAttempted: Number(r.questionsAttempted ?? r.attempted ?? 0) || 0,
      score: Number(r.score ?? r.avgScore ?? 0) || 0,
    }));
  } else {
    const raw = data.raw ?? data ?? {};
    const _toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

    const datewiseArray = Array.isArray(raw?.datewise)
      ? raw.datewise
      : Array.isArray(raw?.datewise?.stats)
        ? raw.datewise.stats
        : Array.isArray(data?.datewise)
          ? data.datewise
          : null;

    if (Array.isArray(datewiseArray) && datewiseArray.length) {
      lineChartData = datewiseArray
        .map((r) => {
          const day = r.day ?? r.date ?? r.label;
          const questionsAttempted =
            Number(r.attended ?? r.attendedTotal ?? r.questionsAttempted ?? r.attempted ?? r.count ?? r.total ?? 0) || 0;
          const correct = Number(r.correct ?? r.correctAnswers ?? r.totalCorrect ?? 0) || 0;
          const avgScore = r.avgScore ?? r.averageScore ?? r.score ?? null;
          const score = questionsAttempted
            ? Math.round(avgScore != null ? Number(avgScore) : correct ? (correct / (questionsAttempted || 1)) * 100 : 0)
            : 0;
          return { day, questionsAttempted, score };
        })
        .filter(Boolean);
    }

    if ((!lineChartData || lineChartData.length === 0) && raw) {
      const aggregated = aggregateSubmodulesDatewise(raw);
      if (Array.isArray(aggregated) && aggregated.length) {
        lineChartData = aggregated.map((r) => ({
          day: r.day,
          questionsAttempted: Number(r.questionsAttempted ?? r.attempted ?? 0) || 0,
          score: Number(r.score ?? r.avgScore ?? 0) || 0,
        }));
      }
    }

    if ((!lineChartData || lineChartData.length === 0) && processedActivityWithBreakdown?.length) {
      lineChartData = processedActivityWithBreakdown.map((item) => ({
        day: item.day,
        questionsAttempted: Number(item.attempted || 0) || 0,
        score: item.attempted ? Math.round((item.correct / (item.attempted || 1)) * 100) : 0,
      }));
    }
  }

  // ✅ Fix 2: normalize BEFORE checking empty, then fallback if still empty
  lineChartData = lineChartData.map((d) => ({
    ...d,
    day: typeof d.day === "string" ? d.day.slice(0, 10) : d.day,
  }));

  if (!Array.isArray(lineChartData) || lineChartData.length === 0) {
    lineChartData = buildFixedDateRangeData([], activityRange);
  }

  let maxQuestionsAttempted = lineChartData.reduce(
    (max, d) => Math.max(max, Number(d.questionsAttempted || 0) || 0), 0,
  );
  if (!Number.isFinite(maxQuestionsAttempted) || maxQuestionsAttempted < 1)
    maxQuestionsAttempted = 5;

  const latestScore = lineChartData.length > 0
    ? Number(lineChartData[lineChartData.length - 1].score || 0) : 0;
  const prevScore = lineChartData.length > 1
    ? Number(lineChartData[lineChartData.length - 2].score || 0) : 0;

  return (
    <div
      className="p-6 rounded-2xl  duration-300"
      onMouseEnter={e => {
        e.currentTarget.style.border = isDark
          ? '1px solid rgba(220,226,233,1)'
          : '1px solid rgba(99,102,241,0.5)'
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
        border: isDark ? "1px solid rgba(220, 226, 233, 0.8)" : "1px solid #E2E8F0",
        backgroundColor: isDark ? "#111827" : "#FFFFFF",
        boxShadow: isDark
          ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)"
          : "0 4px 16px rgba(99,102,241,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3
              className="font-bold text-lg"
              style={{ color: isDark ? "#E5E7EB" : "#0f172a" }}
            >
              Score & Questions vs Days
            </h3>
            <p style={{ color: isDark ? "#6B7280" : "#64748b" }} className="text-sm">
              Green: Score per attempt · Blue: Questions per day
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div
              className="text-2xl font-bold"
              style={{ color: isDark ? "#E5E7EB" : "#0f172a" }}
            >
              {latestScore}%
            </div>
            <div className={`text-sm font-semibold ${latestScore >= prevScore ? "text-emerald-400" : "text-red-400"}`}>
              {latestScore >= prevScore ? "↑" : "↓"}{" "}
              {Math.abs(latestScore - prevScore).toFixed(1)}%
            </div>
          </div>

          <select
            value={activityRange}
            onChange={(e) => setActivityRange(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none cursor-pointer"
            style={{
              border: isDark ? "1px solid #1F2937" : "1px solid #E2E8F0",
              backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
              color: isDark ? "#E5E7EB" : "#0f172a",
            }}
          >
            <option value="1w">Last 1 Week</option>
            <option value="1m">Last 1 Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
          </select>
        </div>
      </div>

      <div
        className="h-80 rounded-xl p-4"
        style={{
          backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
          border: isDark ? "1px solid #1F2937" : "1px solid #E2E8F0",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={lineChartData}
            margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1F2937" : "#E2E8F0"} vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(val) => {
                if (!val) return "";
                const d = new Date(val);
                if (Number.isNaN(d.getTime())) return val;
                return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
              }}
              tick={{ fill: isDark ? "#6B7280" : "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: isDark ? "#1F2937" : "#E2E8F0" }}
              tickLine={false}
              label={{ value: "Date", position: "insideBottom", offset: 0, style: { fill: isDark ? "#6B7280" : "#94a3b8" } }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fill: "#10b981", fontSize: 12 }}
              tickLine={{ stroke: "#10b981" }}
              axisLine={{ stroke: isDark ? "#1F2937" : "#E2E8F0" }}
              label={{ value: "Avg Score (%)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#10b981", fontSize: 12 } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#3b82f6", fontSize: 12 }}
              tickLine={{ stroke: "#3b82f6" }}
              axisLine={{ stroke: isDark ? "#1F2937" : "#E2E8F0" }}
              domain={[0, Math.max(5, maxQuestionsAttempted + 2)]}
              label={{ value: "Questions Attempted", angle: 90, position: "insideRight", offset: 10, style: { fill: "#3b82f6", fontSize: 12 } }}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? "#111827" : "#ffffff",
                border: isDark ? "1px solid #1F2937" : "1px solid #E2E8F0",
                borderRadius: 8,
                color: isDark ? "#E5E7EB" : "#0f172a",
                fontSize: 12,
              }}
              labelStyle={{ color: isDark ? "#9CA3AF" : "#64748b" }}
            />
            <Line yAxisId="left" type="monotone" dataKey="score" name="Score (%)" stroke="#10b981" strokeWidth={3} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="questionsAttempted" name="Questions Attempted" stroke="#3b82f6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineCharts;