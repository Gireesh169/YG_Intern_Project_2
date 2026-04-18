// src/pages/AnalyticsDashboard.jsx
import React from "react";
import { connect } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabaseService } from "../../../services/supabaseService";
import StatsCards from "../../../components/analytics/StatsCards";
import LineCharts from "../../../components/analytics/LineCharts";
import SubjectChapterChart from "../../../components/analytics/SubjectChapterChart";
import QuestionClassificationHighLights from "../../../components/analytics/QuestionClassificationHighLights";
import { aggregateSubmodulesDatewiseBySubject } from "../../../utils/Analytics/aggregateSubmodulesDatewiseBySubject";
import { aggregateSubmodulesDatewise } from "../../../utils/Analytics/aggregateSubmodulesDatewise";
import { createEmptyAnalytics } from "../../../utils/Analytics/createEmptyAnalytics";

function withRouter(Component) {
  return function WrappedComponent(props) {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    return <Component {...props} router={{ params, navigate, location }} />;
  };
}

function buildTimelineAndActivityFromByDate(byDateObj = {}) {
  const entries = Object.entries(byDateObj || {});
  if (!entries.length) return { timeline: [], activity: [] };
  entries.sort((a, b) => {
    const da = Date.parse(a[0]);
    const db = Date.parse(b[0]);
    if (!isNaN(da) && !isNaN(db)) return da - db;
    return a[0].localeCompare(b[0]);
  });
  const timeline = [];
  const activity = [];
  entries.forEach(([date, d]) => {
    const correct = Number(d.correctAnswers ?? d.correct ?? d.totalCorrect ?? d.total_correct ?? 0);
    const incorrect = Number(d.incorrectAnswers ?? d.incorrect ?? d.totalIncorrect ?? d.total_incorrect ?? 0);
    const attemptedRaw = Number(d.attended ?? d.attendedTotal ?? d.totalQuestionsAttempted ?? d.total ?? correct + incorrect);
    const attempted = attemptedRaw || 0;
    const totalQuestions = Number(d.totalQuestions ?? d.total ?? attempted);
    const answered = correct + incorrect;
    const unattempted = Number(d.unattemptedQuestions ?? Math.max(totalQuestions - answered, 0));
    const score = attempted ? Math.round((correct / attempted) * 100) : 0;
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    timeline.push({ label: date, score, accuracy });
    activity.push({ day: date, correct, wrong: incorrect, unattempted, attempted });
  });
  return { timeline, activity };
}

function findSubjectEntry(data, subjectIdOrKey) {
  if (!data) return null;
  if (Array.isArray(data.subjects) && data.subjects.length) {
    const found = data.subjects.find((s) => {
      const sid = s.subjectId ?? s.subject_id ?? s.id;
      const short = s.short_key ?? s.subject_key ?? s.key ?? s.subjectKey;
      const name = s.subjectName ?? s.subject_name ?? s.name;
      return String(sid) === String(subjectIdOrKey) || String(short) === String(subjectIdOrKey) || String(name) === String(subjectIdOrKey);
    });
    if (found) {
      return {
        subjectId: found.subjectId ?? found.subject_id ?? found.id,
        subjectName: found.subjectName ?? found.subject_name ?? found.name ?? "",
        totalCorrect: Number(found.totalCorrect ?? found.total_correct ?? found.correct ?? 0),
        totalIncorrect: Number(found.totalIncorrect ?? found.total_incorrect ?? found.incorrect ?? 0),
        attendedTotal: Number(found.attendedTotal ?? found.attended ?? found.totalUniqueAttended ?? 0),
        totalQuestions: Number(found.totalQuestions ?? found.total_questions ?? found.total ?? 0),
        avgTime: Number(found.avgTime ?? found.avgTimeSpent ?? found.avg_time_spent ?? 0),
        bestScore: Number(found.bestScore ?? found.best_score ?? 0),
        totalTime: Number(found.totalTime ?? found.total_time_spent ?? found.totalTimeSpent ?? 0),
        totalUniqueAttended: Number(found.totalUniqueAttended ?? found.total_unique_attended ?? 0),
        totalCorrectUnique: Number(found.totalCorrectUnique ?? found.total_correct_unique ?? 0),
        totalIncorrectUnique: Number(found.totalIncorrectUnique ?? found.total_incorrect_unique ?? 0),
        raw: found,
      };
    }
  }

  if (data.raw && data.raw.bySubject && typeof data.raw.bySubject === "object") {
    const candidate = data.raw.bySubject[subjectIdOrKey] ?? data.raw.bySubject[String(subjectIdOrKey)];
    if (candidate) {
      return {
        subjectId: subjectIdOrKey,
        subjectName: candidate.subjectName ?? candidate.subject_name ?? candidate.name ?? "",
        totalCorrect: Number(candidate.totalCorrect ?? candidate.correct ?? candidate.correctAnswers ?? 0),
        totalIncorrect: Number(candidate.totalIncorrect ?? candidate.incorrect ?? candidate.incorrectAnswers ?? 0),
        attendedTotal: Number(candidate.attended ?? candidate.attendedTotal ?? candidate.totalUniqueAttended ?? 0),
        totalQuestions: Number(candidate.totalQuestions ?? candidate.total ?? 0),
        avgTime: Number(candidate.avgTime ?? candidate.avgTimeSpent ?? 0),
        bestScore: Number(candidate.bestScore ?? candidate.best_score ?? 0),
        totalTime: Number(candidate.totalTime ?? candidate.total_time_spent ?? 0),
        totalUniqueAttended: Number(candidate.totalUniqueAttended ?? candidate.total_unique_attended ?? 0),
        totalCorrectUnique: Number(candidate.totalCorrectUnique ?? candidate.total_correct_unique ?? 0),
        totalIncorrectUnique: Number(candidate.totalIncorrectUnique ?? candidate.total_incorrect_unique ?? 0),
        raw: candidate,
      };
    }
  }

  if (data.bySubject && typeof data.bySubject === "object") {
    const candidate = data.bySubject[subjectIdOrKey] ?? data.bySubject[String(subjectIdOrKey)];
    if (candidate) {
      return {
        subjectId: subjectIdOrKey,
        subjectName: candidate.subjectName ?? candidate.subject_name ?? candidate.name ?? "",
        totalCorrect: Number(candidate.correct ?? candidate.correctAnswers ?? 0),
        totalIncorrect: Number(candidate.incorrect ?? candidate.incorrectAnswers ?? 0),
        attendedTotal: Number(candidate.attended ?? candidate.totalQuestionsAttempted ?? 0),
        totalQuestions: Number(candidate.totalQuestions ?? candidate.total ?? 0),
        avgTime: Number(candidate.avgTime ?? candidate.avgTimeSpent ?? 0),
        bestScore: Number(candidate.bestScore ?? candidate.best_score ?? 0),
        totalTime: Number(candidate.totalTime ?? candidate.total_time_spent ?? 0),
        totalUniqueAttended: Number(candidate.totalUniqueAttended ?? candidate.total_unique_attended ?? 0),
        totalCorrectUnique: Number(candidate.totalCorrectUnique ?? candidate.total_correct_unique ?? 0),
        totalIncorrectUnique: Number(candidate.totalIncorrectUnique ?? candidate.total_incorrect_unique ?? 0),
        raw: candidate,
      };
    }
  }

  return null;
}

function renderMasteryCircle(props) {
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

class AdminOverallStats extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      data: createEmptyAnalytics(),
      loading: false,
      activityRange: "1m",
      lastError: null,
      chartVersion: 0,
      // ← track theme in state so re-renders happen on toggle
      isDark: localStorage.getItem("theme") !== "light",
    };
    this.setActivityRange = this.setActivityRange.bind(this);
    this.loadAnalytics = this.loadAnalytics.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
  }

  componentDidMount() {
    this.loadAnalytics();
    // ← listen for theme toggle events fired by useTheme hook
    window.addEventListener("themeChange", this.handleThemeChange);
  }

  componentWillUnmount() {
    window.removeEventListener("themeChange", this.handleThemeChange);
  }

  handleThemeChange(e) {
    this.setState({ isDark: e.detail !== "light" });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.canonical !== this.props.canonical) {
      console.log("🔄 updated canonical:", this.props.canonical);
    }
  }

  async loadAnalytics() {
    const googleId = this.props.canonical?.user?.googleId;
    if (!googleId) return;

    const params = this.props.router?.params || {};
    const { subjectId, chapterId, subModuleId } = params;
    const isSubjectView = !!subjectId;
    const isChapterView = !!chapterId && !subjectId;

    let fetchId = null;
    if (isSubjectView) fetchId = subjectId;
    else if (isChapterView) fetchId = chapterId;
    else if (subModuleId) fetchId = subModuleId;

    this.setState({ loading: true, lastError: null });

    try {
      const canonical = this.props.canonical;
      const { subjects: activeSubjects } = await supabaseService.getSubjects("", false, true);
      const activeSubjectIds = new Set(activeSubjects.map(s => String(s.id)));

      const normalized = createEmptyAnalytics();

      if (canonical && typeof canonical === "object") {
        const overallStats = canonical.overall?.stats ?? canonical.overall ?? canonical.stats ?? {};
        normalized.stats = { ...normalized.stats, ...overallStats };

        normalized.subjects = (
          Array.isArray(canonical.subjects)
            ? canonical.subjects
            : canonical.subjectsMeta?.stats ?? canonical.raw?.subjects ?? []
        ).filter(s => {
          const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.key;
          return sid != null && activeSubjectIds.has(String(sid));
        });

        normalized.modules = Array.isArray(canonical.modules) ? canonical.modules : canonical.modulesMeta?.stats ?? canonical.raw?.modules ?? [];
        normalized.subModulesFlat = canonical.subModulesFlat ?? canonical.raw?.subModulesFlat ?? { grade: null, subModules: [] };

        let byDate = {};
        if (Array.isArray(canonical.datewise) && canonical.datewise.length) {
          canonical.datewise.forEach((r) => {
            const day = r.day ?? r.date ?? r.label;
            if (!day) return;
            byDate[day] = {
              attempted: Number(r.questionsAttempted ?? r.attempted ?? r.count ?? r.attended ?? 0),
              correct: Number(r.correct ?? 0),
              incorrect: Number(r.incorrect ?? 0),
              avgScore: Number(r.avgScore ?? r.score ?? 0),
              attended: r.attended ?? r.attendedTotal ?? null,
            };
          });
        } else {
          byDate = canonical.raw?.byDate ?? canonical.byDate ?? canonical.raw?.datewise ?? canonical.datewise ?? canonical.raw?.datewise?.stats ?? {};
        }

        const { timeline, activity } = buildTimelineAndActivityFromByDate(byDate || {});
        normalized.byDate = byDate;
        normalized.timeline = timeline;
        normalized.activity = activity;
        normalized.raw = canonical.raw ?? canonical;
      }

      this.setState((s) => ({ data: normalized, loading: false, chartVersion: (s.chartVersion || 0) + 1 }));

      const rawMain = normalized.raw ?? {};
      let serverHasStrictAttended = false;
      if (Array.isArray(rawMain?.datewise) && rawMain.datewise.length) {
        serverHasStrictAttended = rawMain.datewise.some((r) => Number(r.attended ?? r.attendedTotal ?? r.questionsAttempted ?? r.attempted ?? 0) > 0);
      } else if (Array.isArray(rawMain?.datewise?.stats) && rawMain.datewise.stats.length) {
        serverHasStrictAttended = rawMain.datewise.stats.some((r) => Number(r.attended ?? r.attendedTotal ?? r.questionsAttempted ?? r.attempted ?? 0) > 0);
      } else if (normalized.byDate && typeof normalized.byDate === "object" && Object.keys(normalized.byDate).length) {
        serverHasStrictAttended = Object.values(normalized.byDate).some((entry) => entry && Number(entry.attended ?? entry.attempted ?? 0) > 0);
      }

      if (!serverHasStrictAttended) {
        try {
          const subCanonical = await supabaseService.get_analytics_subModule(googleId, fetchId);
          const rawSub = subCanonical ?? subCanonical?.raw ?? {};
          const fromSub = isSubjectView
            ? aggregateSubmodulesDatewiseBySubject(rawSub, subjectId)
            : aggregateSubmodulesDatewise(rawSub);

          if (Array.isArray(fromSub) && fromSub.length) {
            const chartRows = fromSub.map((r) => ({
              day: r.day,
              questionsAttempted: Number(r.questionsAttempted ?? r.attempted ?? 0) || 0,
              score: Number(r.score ?? r.avgScore ?? 0) || 0,
            }));
            normalized.raw = normalized.raw || {};
            normalized.raw._submoduleSource = subCanonical;
            normalized._derivedDatewiseFromSubmodules = chartRows;
            this.setState((s) => ({ data: normalized, chartVersion: (s.chartVersion || 0) + 1 }));
          }
        } catch (subErr) {
          console.warn("Submodule analytics fetch failed:", subErr);
        }
      }
    } catch (err) {
      console.error("Analytics load error:", err);
      this.setState({ data: createEmptyAnalytics(), loading: false, lastError: err });
    }
  }

  setActivityRange(range) {
    this.setState({ activityRange: range });
  }

  buildSubjectBarData(canonical) {
    const n = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
    const subjectsArray = Array.isArray(canonical?.subjects?.stats) ? canonical.subjects.stats : [];
    return subjectsArray.map((s) => {
      const totalQ = n(s.totalQuestions);
      const attended = n(s.totalUniqueAttended ?? s.attendedTotal);
      const correct = n(s.totalCorrectUnique ?? s.totalCorrect);
      const wrong = n(s.totalIncorrectUnique ?? s.totalIncorrect);
      const unattempted = Math.max(totalQ - attended, 0);
      return {
        subjectId: s.subjectId,
        subject: s.subjectName || "Unknown",
        correct, wrong, unattempted,
        attended, totalQ,
        mastery: n(s.mastery),
        accuracy: n(s.accuracy),
        avgScore: n(s.avgScore),
      };
    });
  }

  deriveClassificationAndNotes(data) {
    let answers = [];
    if (Array.isArray(data?.questionAnswers)) answers = data.questionAnswers;
    if (!answers.length) {
      try { answers = JSON.parse(localStorage.getItem("lastQuizQuestionAnswers") || "[]"); }
      catch { answers = []; }
    }
    const important = answers.filter((a) => a.importantQuestion === true);
    const bad = answers.filter((a) => a.badQuestion === true);
    const ok = answers.filter((a) => a.isCorrect === true && a.badQuestion !== true);
    console.log("STEP 3 COUNTS", { important: important.length, ok: ok.length, bad: bad.length });
    return { important, ok, bad, notes: [] };
  }

  render() {
    const { data, loading, activityRange, isDark } = this.state;

    const { signupData, viewCourse } = this.props;
    const params = this.props.router?.params || {};
    const subjectId = params.subjectId;
    const moduleIdParam = params.chapterId ?? params.moduleId ?? null;
    const isSubjectView = !!subjectId;

    // Theme-aware colors
    const bg = isDark ? "#0B0F19" : "#F0F4FF";
    const cardBg = isDark ? "#111827" : "#FFFFFF";
    const cardBorder = isDark ? "#1F2937" : "#E2E8F0";
    const textPrimary = isDark ? "#E5E7EB" : "#0F172A";
    const textSecondary = isDark ? "#9CA3AF" : "#475569";
    const textMuted = isDark ? "#E5E7EB" : "#94A3B8";
    const gridColor = isDark ? "#1F2937" : "#E2E8F0";
    const tickColor = isDark ? "#9CA3AF" : "#64748B";
    const tooltipStyle = {
      background: isDark ? "#111827" : "#FFFFFF",
      border: `1px solid ${cardBorder}`,
      borderRadius: 8,
      color: textPrimary,
      fontSize: 12,
    };

    let subjectEntry = isSubjectView ? findSubjectEntry(data, subjectId) : null;
    if (isSubjectView) {
      try {
        const statsArr = Array.isArray(data.raw?.stats) ? data.raw.stats : Array.isArray(data.stats) ? data.stats : null;
        if (Array.isArray(statsArr) && statsArr.length) {
          const found = statsArr.find((it) => {
            const sid = it.subjectId ?? it.subject_id ?? it.id ?? it.subject;
            return String(sid) === String(subjectId);
          });
          if (found) {
            subjectEntry = {
              subjectId: found.subjectId ?? found.subject_id ?? found.id ?? null,
              subjectName: found.subjectName ?? found.subject_name ?? found.name ?? "",
              totalCorrect: Number(found.totalCorrect ?? found.total_correct ?? found.correct ?? 0),
              totalIncorrect: Number(found.totalIncorrect ?? found.total_incorrect ?? found.incorrect ?? 0),
              attendedTotal: Number(found.attendedTotal ?? found.attended ?? found.attended_total ?? found.totalUniqueAttended ?? 0),
              totalQuestions: Number(found.totalQuestions ?? found.total_questions ?? found.total ?? 0),
              avgTime: Number(found.avgTime ?? found.avgTimeSpent ?? found.avg_time_spent ?? 0),
              bestScore: Number(found.bestScore ?? found.best_score ?? 0),
              totalTime: Number(found.totalTime ?? found.total_time_spent ?? found.totalTimeSpent ?? 0),
              totalUniqueAttended: Number(found.totalUniqueAttended ?? found.total_unique_attended ?? found.totalUserUniqueAttemptedQs ?? 0),
              totalCorrectUnique: Number(found.totalCorrectUnique ?? found.total_correct_unique ?? 0),
              totalIncorrectUnique: Number(found.totalIncorrectUnique ?? found.total_incorrect_unique ?? 0),
              raw: found,
            };
          }
        }
      } catch (e) {}
    }

    const num = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
    const derived = this.deriveClassificationAndNotes(data);

    // ── Submodule charts IIFE ──
    const renderSubmoduleCharts = (() => {
      const n = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));

      // ← define modulesPayloadForChart from data
      const modulesPayloadForChart = (() => {
        if (Array.isArray(data?.modules) && data.modules.length) return data.modules;
        if (Array.isArray(data?.raw?.modules) && data.raw.modules.length) return data.raw.modules;
        if (Array.isArray(data?.modulesMeta?.stats) && data.modulesMeta.stats.length) return data.modulesMeta.stats;
        return [];
      })();

      let flatSubs = null;
      if (Array.isArray(data.subModulesFlat)) flatSubs = data.subModulesFlat;
      else if (data.subModulesFlat && Array.isArray(data.subModulesFlat.subModules)) flatSubs = data.subModulesFlat.subModules;
      else if (Array.isArray(data.raw?.subModulesFlat)) flatSubs = data.raw.subModulesFlat;
      else if (data.raw?.subModulesFlat && Array.isArray(data.raw.subModulesFlat.subModules)) flatSubs = data.raw.subModulesFlat.subModules;
      else if (Array.isArray(data.raw?.subModules)) flatSubs = data.raw.subModules;
      else if (Array.isArray(data.raw?.submodules)) flatSubs = data.raw.submodules;

      if (flatSubs && (subjectId || moduleIdParam)) {
        flatSubs = flatSubs.filter((sm) => {
          const sid = sm.subjectId ?? sm.subject_id ?? sm.subject ?? sm.subjectKey ?? sm.grade ?? sm.gradeId;
          const mid = sm.moduleId ?? sm.module_id ?? sm.module ?? sm.moduleKey ?? sm.parentModuleId ?? sm.chapterId ?? sm.chapter_id;
          const matchesSubject = subjectId ? (sid != null && String(sid) === String(subjectId)) : true;
          const matchesModule = moduleIdParam ? (mid != null && String(mid) === String(moduleIdParam)) : true;
          return matchesSubject && matchesModule;
        });
      }

      let chartsArr = [];

      if (flatSubs && flatSubs.length > 0) {
        const moduleNameLookup = {};
        if (Array.isArray(modulesPayloadForChart)) {
          modulesPayloadForChart.forEach((m) => {
            const id = (m.moduleId ?? m.module_id ?? m.id);
            if (id) moduleNameLookup[String(id)] = m.moduleName ?? m.module_name ?? m.title ?? m.name ?? moduleNameLookup[String(id)] ?? `Module ${id}`;
          });
        }

        const byModule = {};
        flatSubs.forEach((sm) => {
          const moduleId = sm.moduleId ?? sm.module_id ?? sm.module ?? sm.moduleKey ?? sm.parentModuleId ?? sm.chapterId ?? "ungrouped";
          const moduleIdStr = String(moduleId ?? "ungrouped");
          const moduleNameFromPayload = sm.moduleName ?? sm.module_name ?? sm.moduleTitle ?? sm.module_title ?? null;
          const moduleName = moduleNameFromPayload ?? moduleNameLookup[moduleIdStr] ?? `Module ${moduleIdStr === "ungrouped" ? "" : moduleIdStr}`;
          const subName = sm.subModuleName ?? sm.submoduleName ?? sm.name ?? sm.title ?? sm.sub_module_name ?? sm.chapterName ?? sm.chapter_name ?? "Unknown";
          const totalQ = n(sm.totalQuestions ?? sm.total_questions ?? sm.total ?? sm.questionCount ?? sm.question_count ?? 0);
          const attended = n(sm.totalUniqueAttended ?? sm.total_unique_attended ?? sm.attended ?? sm.attendedTotal ?? sm.attended_total ?? (sm.totalAnswered ?? 0));
          const correct = n(sm.totalCorrectUnique ?? sm.total_correct_unique ?? sm.totalCorrect ?? sm.total_correct ?? sm.correctAnswers ?? sm.correct ?? 0);
          const wrong = n(sm.totalIncorrectUnique ?? sm.total_incorrect_unique ?? sm.totalIncorrect ?? sm.total_incorrect ?? sm.incorrect ?? 0);
          const unattempted = Math.max(totalQ - attended, 0);
          if (!byModule[moduleIdStr]) byModule[moduleIdStr] = { moduleName, items: [] };
          byModule[moduleIdStr].items.push({ name: String(subName), correct, wrong, unattempted, totalQ, attended });
        });

        chartsArr = Object.entries(byModule).map(([mid, v]) => ({
          moduleId: mid,
          moduleName: v.moduleName,
          data: v.items,
          key: `${this.state?.chartVersion ?? 0}-flat-${mid}`,
        }));
      } else if (modulesPayloadForChart && modulesPayloadForChart.length > 0) {
        chartsArr = modulesPayloadForChart.map((mod) => {
          const moduleName = mod.moduleName ?? mod.module_name ?? mod.title ?? mod.name ?? `Module ${mod.moduleId ?? mod.id ?? ""}`;
          const subs = Array.isArray(mod.submodules) ? mod.submodules : Array.isArray(mod.modules) ? mod.modules : Array.isArray(mod.chapters) ? mod.chapters : [];
          const dataArr = (subs || []).map((sm) => {
            const totalQ = n(sm.totalQuestions ?? sm.total_questions ?? sm.total ?? sm.questionCount ?? 0);
            const attended = n(sm.totalUniqueAttended ?? sm.total_unique_attended ?? sm.attended ?? sm.attendedTotal ?? 0);
            const correct = n(sm.totalCorrectUnique ?? sm.total_correct_unique ?? sm.correct ?? sm.totalCorrect ?? 0);
            const wrong = n(sm.totalIncorrectUnique ?? sm.total_incorrect_unique ?? sm.incorrect ?? sm.totalIncorrect ?? 0);
            const unattempted = Math.max(totalQ - attended, 0);
            return {
              name: (sm.subModuleName ?? sm.submoduleName ?? sm.name ?? sm.title ?? sm.chapterName ?? sm.chapter_name ?? "Unknown").toString(),
              correct, wrong, unattempted, totalQ, attended,
            };
          });
          return {
            moduleId: mod.moduleId ?? mod.module_id ?? mod.id ?? moduleName,
            moduleName,
            data: dataArr,
            key: `${this.state?.chartVersion ?? 0}-payload-${mod.moduleId ?? mod.module_id ?? mod.id ?? moduleName}`,
          };
        });
      }

      if (!chartsArr || chartsArr.length === 0) return null;

      const colsClass = chartsArr.length === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

      return (
        <div className="mt-6">
          <h3
            className="text-lg font-bold mb-4 transition-colors"
            style={{ color: textPrimary }}
          >
            Submodule-wise Progress
          </h3>

          <div className={`grid ${colsClass} gap-6`}>
            {chartsArr.map((c) => (
              <div
                key={c.key}
                className="p-6 rounded-2xl transition-colors"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4
                    className="font-semibold transition-colors"
                    style={{ color: textPrimary }}
                  >
                    {c.moduleName}
                  </h4>
                  <div
                    className="text-sm transition-colors"
                    style={{ color: textMuted }}
                  >
                    {c.data.length} submodules
                  </div>
                </div>

                {c.data.length === 0 ? (
                  <div
                    className="text-sm transition-colors"
                    style={{ color: textMuted }}
                  >
                    No submodule data available for this module.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={c.data}
                        margin={{ top: 6, right: 10, left: -10, bottom: 40 }}
                        isAnimationActive={false}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: tickColor, fontSize: 12 }}
                          tickLine={false}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                        />
                        <YAxis
                          tick={{ fill: tickColor, fontSize: 12 }}
                          tickLine={{ stroke: gridColor }}
                        />
                        <Tooltip
                          cursor={{ fill: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)" }}
                          contentStyle={tooltipStyle}
                          labelStyle={{ color: textSecondary }}
                        />
                        <Bar dataKey="correct" stackId="a" fill="#22C55E" name="Correct" />
                        <Bar dataKey="wrong" stackId="a" fill="#EF4444" name="Incorrect" />
                        <Bar dataKey="unattempted" stackId="a" fill={isDark ? "#1F2937" : "#CBD5E1"} name="Unattempted" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    })();

    return (
      <div
        className="min-h-screen p-4 md:p-8 pt-20 md:pt-24 transition-colors duration-300"
        style={{
          backgroundColor: bg,
          backgroundSize: "28px 28px",
        }}
      >
        {/* Glow blobs */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none"
          style={{ background: isDark ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)" : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)" }}
        />

        <div className="max-w-7xl mx-auto mb-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>

              {/* Back button */}
              <button
                onClick={() => {
                  const makeSlug = (s) => {
                    if (!s) return "course";
                    return String(s).trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
                  };
                  const courseName = viewCourse?.subject?.short_key || (viewCourse?.subject?.name ? makeSlug(viewCourse.subject.name) : "course");
                  this.props.router.navigate(`/courses/${courseName}/${subjectId}`);
                }}
                className="flex items-center gap-2 text-sm font-medium mb-3 transition-colors"
                style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A"}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569"}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Subject
              </button>

              {/* Title */}
              <h1
                className="text-3xl md:text-4xl font-bold transition-colors"
                style={{ color: textPrimary }}
              >
                {isSubjectView
                  ? `${viewCourse?.subject?.name || subjectEntry?.subjectName || "Subject"} `
                  : "Your "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)" }}
                >
                  {isSubjectView ? "Analytics" : "Analytics"}
                </span>
                {" "}
                <span style={{ color: textPrimary }}>Dashboard</span>
              </h1>

              <p
                className="mt-2 text-sm transition-colors"
                style={{ color: textSecondary }}
              >
                Track your progress and performance
              </p>
              <p
                className="text-xs mt-1 transition-colors"
                style={{ color: textMuted }}
              >
                Mode: Live backend
              </p>

              {isSubjectView && <div className="mt-3" />}
            </div>
            <div className="flex items-center gap-4" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          <StatsCards data={data} subjectEntry={subjectEntry} isSubjectView={isSubjectView} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineCharts
              data={data}
              subjectEntry={subjectEntry}
              isSubjectView={isSubjectView}
              activityRange={activityRange}
              setActivityRange={this.setActivityRange}
            />
            <SubjectChapterChart
              data={data}
              subjectEntry={subjectEntry}
              isSubjectView={isSubjectView}
              loading={loading}
              chartVersion={this.state.chartVersion}
              viewCourse={viewCourse}
            />
          </div>

          {isSubjectView && renderSubmoduleCharts}

          <QuestionClassificationHighLights
            data={data}
            subjectEntry={subjectEntry}
            isSubjectView={isSubjectView}
          />
        </div>
      </div>
    );
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    this.setState({ error, info });
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    const isDark = localStorage.getItem("theme") !== "light";
    return (
      <div style={{
        padding: 40,
        fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
        background: isDark ? "#0B0F19" : "#F0F4FF",
        minHeight: "100vh",
        color: isDark ? "#E5E7EB" : "#0F172A",
      }}>
        <h2 style={{ color: "#6366F1" }}>Something went wrong rendering Analytics</h2>
        <p style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
          The dashboard crashed while rendering. The error is shown below.
        </p>
        <pre style={{
          whiteSpace: "pre-wrap",
          background: isDark ? "#111827" : "#FFFFFF",
          padding: 12, borderRadius: 8,
          border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
          color: "#EF4444",
        }}>
          {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
        </pre>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", color: isDark ? "#9CA3AF" : "#475569" }}>More info</summary>
          <pre style={{
            whiteSpace: "pre-wrap",
            background: isDark ? "#111827" : "#FFFFFF",
            padding: 12, borderRadius: 8,
            border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
            color: isDark ? "#9CA3AF" : "#475569",
          }}>
            {this.state.info && (this.state.info.componentStack || JSON.stringify(this.state.info, null, 2))}
          </pre>
        </details>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    signupData: (state.auth || {}).signupData,
    viewCourse: state.viewCourse || {},
  };
} 

const Wrapped = connect(mapStateToProps)(withRouter((props) => (
  <ErrorBoundary>
    <AdminOverallStats {...props} />
  </ErrorBoundary>
)));

export default Wrapped;