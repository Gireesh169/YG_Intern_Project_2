// src/pages/AnalyticsDashboard.jsx
import React from "react";
import { connect } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, } from "recharts";
import { supabaseService } from "../services/supabaseService";
import StudentSubjectHeatmap from "../components/analytics/StudentSubjectHeatmap";
import { setCanonical, setActiveSubjects, setSubCanonical } from "../slices/analyticsSlice";
import { setSubmodule, setAnalytics } from "../slices/viewCoursesSlice";
import StatsCards from "../components/analytics/StatsCards";
import LineCharts from "../components/analytics/LineCharts";
import SubjectChapterChart from "../components/analytics/SubjectChapterChart";
import QuestionClassificationHighLights from "../components/analytics/QuestionClassificationHighLights";
import { aggregateSubmodulesDatewiseBySubject } from "../utils/Analytics/aggregateSubmodulesDatewiseBySubject";
import { aggregateSubmodulesDatewise } from "../utils/Analytics/aggregateSubmodulesDatewise";
import { createEmptyAnalytics } from "../utils/Analytics/createEmptyAnalytics";
import { useTheme } from "../utils/useTheme";



const getIsDark = () =>
  document.documentElement.getAttribute("data-theme") === "dark" ||
  document.documentElement.classList.contains("dark");


/* withRouter HOC so component itself has no hooks inside */
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
function buildFixedDateRangeData(data = [], range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // local midnight

  const rangeDaysMap = {
    "1w": 7,
    "1m": 30,
    "3m": 90,
    "6m": 180,
    "1y": 365,
  };

  const days = rangeDaysMap[range] || 30;

  // Index real data by YYYY-MM-DD (LOCAL)
  const byDay = {};
  data.forEach((d) => {
    if (!d?.day) return;
    const key = String(d.day).slice(0, 10);
    byDay[key] = {
      score: Number(d.score) || 0,
      questionsAttempted: Number(d.questionsAttempted) || 0,
    };
  });

  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // ✅ LOCAL YYYY-MM-DD (NOT UTC)
    const key = date.toLocaleDateString("en-CA");

    result.push({
      day: key,
      score: byDay[key]?.score ?? 0,
      questionsAttempted: byDay[key]?.questionsAttempted ?? 0,
    });
  }

  return result;
}
/* extract a canonical subject-level object if present (keeps legacy behavior) */
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
/* Mastery circle renderer */
function renderMasteryCircle(props) {
  const { x, y, width, value } = props || {};
  const cx = (x || 0) + ((width || 0) / 2);
  const cy = (y || 0) - 16;
  const r = 14;
  const display = value == null || Number.isNaN(Number(value)) ? 0 : Math.round(Number(value));

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#7c3aed" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
        {`${display}%`}
      </text>
    </g>
  );
}

/* Dashboard class (no hooks inside) */
class AnalyticsDashboard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { data: createEmptyAnalytics(), loading: false, activityRange: "1m", lastError: null, chartVersion: 0 };
    this.setActivityRange = this.setActivityRange.bind(this);
    this.loadAnalytics = this.loadAnalytics.bind(this);
  }
  componentDidMount() {
    this.loadAnalytics();
  }
  componentDidUpdate(prevProps) {
    const prevG = prevProps.signupData?.googleId;
    const currG = this.props.signupData?.googleId;
    const prevParams = prevProps.router?.params || {};
    const params = this.props.router?.params || {};
    if (
      prevG !== currG ||
      prevParams.subjectId !== params.subjectId ||
      prevParams.chapterId !== params.chapterId ||
      prevParams.subModuleId !== params.subModuleId
    ) {
      this.loadAnalytics();
    }
  }

  async loadAnalytics() {
    const googleId = this.props.signupData?.googleId;
    if (!googleId) return;

    const hasUsableCanonical = (cand) => {
      if (!cand || typeof cand !== "object") return false;
      const stats = cand.overall?.stats ?? cand.stats ?? {};
      const attempted = Number(
        stats.attendedTotal ??
        stats.totalUniqueAttended ??
        stats.totalQuestions ??
        0,
      );
      const nonZeroCore = Number(stats.totalCorrect ?? 0) + Number(stats.totalIncorrect ?? 0);
      const hasByDate = Object.keys(cand.raw?.byDate ?? cand.byDate ?? {}).length > 0;
      const hasSubjects = Array.isArray(cand.subjects) && cand.subjects.length > 0;
      return attempted > 0 || nonZeroCore > 0 || hasByDate || hasSubjects;
    };

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
      // 1) Primary (broad) analytics call - powers most UI
      const reduxCanonical = this.props.reduxCanonical;
      const reduxActiveSubjects = this.props.reduxActiveSubjects;
      let canonical = reduxCanonical;;
      let activeSubjects = reduxActiveSubjects;
      if (!hasUsableCanonical(canonical)) {
        console.log("INFO: fetching canonical analytics from server");
        canonical = await supabaseService.getAnalytics(googleId, fetchId, { forceRefresh: true });
      }
      // STEP 1️⃣ — Fetch ONLY active subjects
      if (!activeSubjects || !activeSubjects.length) {
        console.log("INFO: fetching active subjects from server");
        const subjectsResp = await supabaseService.getSubjects("", false, true);
        activeSubjects = subjectsResp.subjects || [];
      }
      // Build a fast lookup set
      const activeSubjectIds = new Set(
        activeSubjects.map(s => String(s.id))
      );
      this.props.setAnalytics(canonical);
      this.props.setActiveSubjects(activeSubjects);
      console.log("DEBUG primary canonical:", canonical);

      const normalized = createEmptyAnalytics();

      if (canonical && typeof canonical === "object") {
        const overallStats = canonical.overall?.stats ?? canonical.overall ?? canonical.stats ?? {};
        normalized.stats = { ...normalized.stats, ...overallStats };

        normalized.subjects =
          (
            Array.isArray(canonical.subjects)
              ? canonical.subjects
              : canonical.subjectsMeta?.stats
              ?? canonical.raw?.subjects
              ?? []
          ).filter(s => {
            const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.key;
            return sid != null && activeSubjectIds.has(String(sid));
          });

        normalized.modules =
          Array.isArray(canonical.modules) ? canonical.modules : canonical.modulesMeta?.stats ?? canonical.raw?.modules ?? [];
        normalized.subModulesFlat = canonical.subModulesFlat ?? canonical.raw?.subModulesFlat ?? { grade: null, subModules: [] };

        // Build byDate: preserve attended if present
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

        normalized.raw = { ...(canonical.raw ?? canonical) };
      }

      // Set partial data so UI can render quickly
      this.setState((s) => ({ data: normalized, loading: false, chartVersion: (s.chartVersion || 0) + 1 }));

      // ------------------------------------------------------------------
      // Only fetch submodule analytics WHEN the main response lacks strict
      // attended/attendedTotal datewise rows we need for the line chart.
      // ------------------------------------------------------------------

      const rawMain = normalized.raw ?? {};
      // detect whether the main response has an array datewise with attended>0
      let serverHasStrictAttended = false;
      if (Array.isArray(rawMain?.datewise) && rawMain.datewise.length) {
        serverHasStrictAttended = rawMain.datewise.some((r) => {
          const attended = r.attended ?? r.attendedTotal ?? r.questionsAttempted ?? r.attempted ?? 0;
          return Number(attended) > 0;
        });
      } else if (Array.isArray(rawMain?.datewise?.stats) && rawMain.datewise.stats.length) {
        serverHasStrictAttended = rawMain.datewise.stats.some((r) => {
          const attended = r.attended ?? r.attendedTotal ?? r.questionsAttempted ?? r.attempted ?? 0;
          return Number(attended) > 0;
        });
      } else if (normalized.byDate && typeof normalized.byDate === "object" && Object.keys(normalized.byDate).length) {
        serverHasStrictAttended = Object.values(normalized.byDate).some((entry) => {
          if (!entry) return false;
          return Number(entry.attended ?? entry.attempted ?? 0) > 0;
        });
      }

      if (!serverHasStrictAttended) {
        try {
          console.log("INFO: main response missing strict attended rows — fetching submodule analytics for line chart");
          let subCanonical = this.props.reduxSubCanonical;

          if (!hasUsableCanonical(subCanonical)) {
            console.log("INFO: fetching submodule canonical analytics from server", subCanonical);
            subCanonical = await supabaseService.get_analytics_subModule(googleId, fetchId);
            console.log("fetchid", fetchId)
            this.props.setSubmodule(subCanonical);
          }

          console.log("DEBUG submodule canonical:", subCanonical);

          // derive datewise rows using the helper
          const rawSub = subCanonical ?? subCanonical?.raw ?? {};

          const fromSub = isSubjectView
            ? aggregateSubmodulesDatewiseBySubject(rawSub, subjectId)
            : aggregateSubmodulesDatewise(rawSub);


          if (Array.isArray(fromSub) && fromSub.length) {
            // Normalize into the same shape used by charts: { day, questionsAttempted, score }
            const chartRows = fromSub.map((r) => ({
              day: r.day,
              questionsAttempted: Number(r.questionsAttempted ?? r.attempted ?? 0) || 0,
              score: Number(r.score ?? r.avgScore ?? 0) || 0,
            }));

            // attach submodule source for the render logic to prefer
            normalized.raw = {
              ...(normalized.raw || {}),
              _submoduleSource: subCanonical,
            };

            normalized._derivedDatewiseFromSubmodules = chartRows;

            // Update state with the improved data so charts remount with the submodule-derived series
            this.setState((s) => ({ data: normalized, chartVersion: (s.chartVersion || 0) + 1 }));
          } else {
            console.log("INFO: submodule response did not produce attended-based rows. Keeping activity fallback.");
          }
        } catch (subErr) {
          console.warn("Submodule analytics fetch failed:", subErr);
          // keep existing normalized data (line chart will fallback to activity)
        }
      } else {
        console.log("INFO: primary response already had attended-based datewise; skipping submodule fetch.");
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
    console.log("Building subject bar data from canonical:", canonical);
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
      } catch (e) { }
      if (Array.isArray(canonical?.subjects)) {
        const found = canonical.subjects.find((it) => {
          const id = it.subjectId ?? it.subject_id ?? it.id ?? it.key;
          return id != null && sid != null ? String(id) === String(sid) : false;
        });
        if (found && (found.mastery != null)) return found.mastery;
      }
      return null;
    };

    if (Array.isArray(canonical.stats) && canonical.stats.length) {
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

        return {
          subjectId,
          subject: subjectName || "Unknown",
          correct: correctUnique,
          wrong: incorrectUnique,
          attended: totalUniqueAttended,
          totalQ,
          unattempted,
          mastery,
        };
      });
    }

    if (Array.isArray(canonical.modules) && canonical.modules.length) {
      return canonical.modules.map((group) => {
        const subjectId = group.subjectId ?? group.subject_id ?? group.id ?? null;
        const subjectName = (group.subjectName ?? group.subject_name ?? group.name ?? "").toString();

        const moduleEntries = Array.isArray(group.modules) ? group.modules : Array.isArray(group) ? group : [];

        const agg = moduleEntries.reduce(
          (acc, m) => {
            acc.totalQ += n(m.totalQuestions ?? m.total_questions ?? m.total ?? 0);
            acc.attended += n(m.totalUniqueAttended ?? m.total_unique_attended ?? m.totalUserUniqueAttemptedQs ?? m.attended ?? 0);
            acc.correct += n(m.totalCorrectUnique ?? m.total_correct_unique ?? m.correctUnique ?? m.correct ?? 0);
            acc.wrong += n(m.totalIncorrectUnique ?? m.total_incorrect_unique ?? m.incorrectUnique ?? m.incorrect ?? 0);
            return acc;
          },
          { correct: 0, wrong: 0, attended: 0, totalQ: 0 }
        );

        const unattempted = Math.max(agg.totalQ - agg.attended, 0);

        const masteryRaw = resolveMastery(group, subjectId);
        const mastery = masteryRaw != null && !Number.isNaN(Number(masteryRaw)) ? Math.round(Number(masteryRaw)) : 0;

        return {
          subjectId,
          subject: subjectName || "Unknown",
          correct: agg.correct,
          wrong: agg.wrong,
          attended: agg.attended,
          totalQ: agg.totalQ || agg.correct + agg.wrong,
          unattempted,
          mastery,
        };
      });
    }

    if (Array.isArray(canonical.subjects) && canonical.subjects.length) {
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

        return {
          subjectId,
          subject: subjectName || "Unknown",
          correct: correctUnique,
          wrong: incorrectUnique,
          attended: totalUniqueAttended,
          totalQ,
          unattempted,
          mastery,
        };
      });
    }

    return [];
  }
  deriveClassificationAndNotes(data) {
    let answers = [];

    // 1️⃣ Try backend
    if (Array.isArray(data?.questionAnswers)) {
      answers = data.questionAnswers;
    }

    // 2️⃣ Fallback to quiz (localStorage)
    if (!answers.length) {
      try {
        answers = JSON.parse(
          localStorage.getItem("lastQuizQuestionAnswers") || "[]"
        );
      } catch {
        answers = [];
      }
    }

    // 3️⃣ CALCULATE COUNTS (⬅️ ADD THIS PART)
    const important = answers.filter(
      (a) => a.importantQuestion === true
    );

    const bad = answers.filter(
      (a) => a.badQuestion === true
    );

    const ok = answers.filter(
      (a) => a.isCorrect === true && a.badQuestion !== true
    );

    console.log("STEP 3 COUNTS", {
      important: important.length,
      ok: ok.length,
      bad: bad.length,
    });

    // 4️⃣ RETURN DATA USED BY UI
    return {
      important,
      ok,
      bad,
      notes: [],
    };
  }

  render() {
     const isDark = getIsDark();
    const { data, loading, activityRange } = this.state;

    const { signupData, viewCourse } = this.props;
    const params = this.props.router?.params || {};
    const subjectId = params.subjectId;
    const moduleIdParam = params.chapterId ?? params.moduleId ?? null;
    const isSubjectView = !!subjectId;

    let subjectEntry = isSubjectView ? findSubjectEntry(data, subjectId) : null;
    if (isSubjectView) {
      try {
        const statsArr = Array.isArray(data.raw?.stats) ? data.raw.stats : Array.isArray(data.stats) ? data.stats : null;
        if (Array.isArray(statsArr) && statsArr.length) {
          const found = statsArr.find((it) => {
            const sid = it.subjectId ?? it.subject_id ?? it.id ?? it.subject ?? it.subjectId;
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
              totalCorrectUnique: Number(found.totalCorrectUnique ?? found.total_correct_unique ?? found.totalCorrectUnique ?? 0),
              totalIncorrectUnique: Number(found.totalIncorrectUnique ?? found.total_incorrect_unique ?? found.totalIncorrectUnique ?? 0),
              raw: found,
            };
          }
        }
      } catch (e) { }
    }
    const num = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
    const sourceIsSubject = isSubjectView && subjectEntry;
    // STEP 6: ensure subject-wise data exists for charts






    const baseBestScore = sourceIsSubject ? (num(subjectEntry.bestScore) ?? 0) : (num(data.stats?.bestScore) ?? num(data.stats?.best_score) ?? 0);
    const bestScore = baseBestScore != null && !Number.isNaN(Number(baseBestScore)) ? Number(baseBestScore) : 0;
    // const baseTotalTime = sourceIsSubject ? (num(subjectEntry.totalTime) ?? 0) : (num(data.stats?.totalTime) ?? num(data.stats?.totalTimeSpent) ?? 0);


    const subjectBarData = this.buildSubjectBarData(data);
    console.log("DEBUG subjectBarData:", data.raw?.subjects?.stats);
    const subjects = data.raw?.subjects?.stats || [];
    console.log("DEBUG subjects for heatmap:", subjects);





    // ------------------ compute modules payload + maps for SubjectChapterBarChart ------------------
    const totalQuestionsBySubject = {};
    if (Array.isArray(data.subjects) && data.subjects.length) {
      data.subjects.forEach((s) => {
        const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.key;
        if (sid) totalQuestionsBySubject[sid] = num(s.totalQuestions ?? s.total_questions ?? s.total ?? 0);
      });
    }
    if (Object.keys(totalQuestionsBySubject).length === 0 && Array.isArray(data.raw?.stats)) {
      data.raw.stats.forEach((s) => {
        const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.subject;
        if (sid) totalQuestionsBySubject[sid] = num(s.totalQuestions ?? s.total_questions ?? s.total ?? 0);
      });
    }

    const bySubjectMap = {};
    if (Array.isArray(data.subjects) && data.subjects.length) {
      data.subjects.forEach((s) => {
        const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.key;
        if (sid) {
          bySubjectMap[sid] = {
            attended: num(s.totalUniqueAttended ?? s.totalUniqueAttempted ?? s.attended ?? s.attendedTotal ?? 0),
            raw: s,
          };
        }
      });
    }
    if (Object.keys(bySubjectMap).length === 0 && data.raw?.bySubject && typeof data.raw.bySubject === "object") {
      Object.entries(data.raw.bySubject).forEach(([sid, v]) => {
        bySubjectMap[sid] = { attended: num(v.attended ?? v.attendedTotal ?? v.totalUniqueAttended ?? 0), raw: v };
      });
    }
    if (Object.keys(bySubjectMap).length === 0 && Array.isArray(data.raw?.stats)) {
      data.raw.stats.forEach((s) => {
        const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.subject;
        if (sid) {
          bySubjectMap[sid] = { attended: num(s.totalUniqueAttended ?? s.totalUniqueAttempted ?? s.attended ?? s.attendedTotal ?? 0), raw: s };
        }
      });
    }

    let modulesPayloadForChart = [];
    if (isSubjectView) {
      if (subjectEntry?.raw?.modules && Array.isArray(subjectEntry.raw.modules)) {
        modulesPayloadForChart = subjectEntry.raw.modules;
      } else {
        if (Array.isArray(data.raw?.stats)) {
          const found = data.raw.stats.find((it) => {
            const sid = it.subjectId ?? it.subject_id ?? it.id ?? it.subject;
            return String(sid) === String(subjectId);
          });
          if (found && Array.isArray(found.modules)) modulesPayloadForChart = found.modules;
        }
        if (modulesPayloadForChart.length === 0 && Array.isArray(viewCourse?.modules) && viewCourse.modules.length) {
          const group = viewCourse.modules.find((g) => {
            const sid = g.subjectId ?? g.subject_id ?? g.id ?? g.key;
            return sid && String(sid) === String(subjectId);
          });
          modulesPayloadForChart = (group && Array.isArray(group.modules) ? group.modules : viewCourse.modules) || [];
        }
        if (modulesPayloadForChart.length === 0 && Array.isArray(data.modules) && data.modules.length) {
          const group = data.modules.find((g) => {
            const sid = g.subjectId ?? g.subject_id ?? g.id ?? g.key;
            return sid && String(sid) === String(subjectId);
          });
          if (group && Array.isArray(group.modules)) modulesPayloadForChart = group.modules;
        }
      }

      if (moduleIdParam && Array.isArray(modulesPayloadForChart) && modulesPayloadForChart.length) {
        modulesPayloadForChart = modulesPayloadForChart.filter((m) => {
          const mid = m.moduleId ?? m.module_id ?? m.id ?? m.key ?? m.module ?? m.chapterId ?? m.chapter_id;
          return mid != null && String(mid) === String(moduleIdParam);
        });
      }
    }

    const renderSubmoduleCharts = (() => {
      const n = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));

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
          byModule[moduleIdStr].items.push({
            name: String(subName),
            correct,
            wrong,
            unattempted,
            totalQ,
            attended,
          });
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
          const subs = Array.isArray(mod.submodules)
            ? mod.submodules
            : Array.isArray(mod.modules)
              ? mod.modules
              : Array.isArray(mod.chapters)
                ? mod.chapters
                : [];

          const dataArr = (subs || []).map((sm) => {
            const totalQ = n(sm.totalQuestions ?? sm.total_questions ?? sm.total ?? sm.questionCount ?? 0);
            const attended = n(sm.totalUniqueAttended ?? sm.total_unique_attended ?? sm.attended ?? sm.attendedTotal ?? 0);
            const correct = n(sm.totalCorrectUnique ?? sm.total_correct_unique ?? sm.correct ?? sm.totalCorrect ?? 0);
            const wrong = n(sm.totalIncorrectUnique ?? sm.total_incorrect_unique ?? sm.incorrect ?? sm.totalIncorrect ?? 0);
            const unattempted = Math.max(totalQ - attended, 0);
            return {
              name: (sm.subModuleName ?? sm.submoduleName ?? sm.name ?? sm.title ?? sm.chapterName ?? sm.chapter_name ?? "Unknown").toString(),
              correct,
              wrong,
              unattempted,
              totalQ,
              attended,
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

      const colsClass = chartsArr.length === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

      return (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4 text-[#E5E7EB]">Submodule-wise Progress</h3>

          <div className={`grid ${colsClass} gap-6`}>
            {chartsArr.map((c) => (
              <div key={c.key} className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] hover:border-indigo-500/30 transition-colors">
  <div className="flex items-center justify-between mb-3">
    <h4 className="font-semibold text-[#E5E7EB]">{c.moduleName}</h4>
    <div className="text-sm text-[#6B7280]">{c.data.length} submodules</div>
  </div>

  {c.data.length === 0 ? (
    <div className="text-[#6B7280] text-sm">No submodule data available for this module.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={c.data} margin={{ top: 6, right: 10, left: -10, bottom: 40 }} isAnimationActive={false}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
<XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12 }} tickLine={false} interval={0} angle={-25} textAnchor="end" />
<YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} tickLine={{ stroke: "#1F2937" }} />
<Tooltip cursor={{ fill: "rgba(99,102,241,0.08)" }} contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 8, color: "#E5E7EB" }} />
                        <Bar dataKey="correct" stackId="a" fill="#10b981" name="Correct" />
                        <Bar dataKey="wrong" stackId="a" fill="#ef4444" name="Incorrect" />
                        <Bar dataKey="unattempted" stackId="a" fill="#6b7280" name="Unattempted" />
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
     <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8 pt-20 md:pt-24"
     
  >

     <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <div className="absolute inset-0" />

        {/* Glow blobs */}
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.12)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[120px]"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.10)",
          }}
        />
        <div
          className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(59,130,246,0.08)"
              : "rgba(59,130,246,0.08)",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(6,182,212,0.08)"
              : "rgba(6,182,212,0.08)",
            animationDelay: "4s",
          }}
        />

        {/* Top center beam */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(99,102,241,0.15), transparent)"
              : "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)",
          }}
        />
      </div>
          
     <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <div className="absolute inset-0" />

        {/* Glow blobs */}
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.12)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[120px]"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.10)",
          }}
        />
        <div
          className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(59,130,246,0.08)"
              : "rgba(59,130,246,0.08)",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(6,182,212,0.08)"
              : "rgba(6,182,212,0.08)",
            animationDelay: "4s",
          }}
        />

        {/* Top center beam */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(99,102,241,0.15), transparent)"
              : "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)",
          }}
        />
      </div>
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <button onClick={() => {
                const makeSlug = (s) => {
                  if (!s) return "course";
                  return String(s).trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
                };
                const courseName = viewCourse?.subject?.short_key || (viewCourse?.subject?.name ? makeSlug(viewCourse.subject.name) : "course");
                this.props.router.navigate(`/courses/${courseName}/${subjectId}`);
              }} className="flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors text-sm mb-3">
  <ArrowLeft className="w-4 h-4" /> Back to Subject
</button>
         <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB]">
  {isSubjectView
    ? `${viewCourse?.subject?.name || subjectEntry?.subjectName || "Subject"} Analytics `
    : "Your Analytics "}
  <span className="text-transparent bg-clip-text"
    style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)" }}>
    Dashboard
  </span>
</h1>
              <p className="text-[#9CA3AF] mt-2 text-sm">Track your progress and performance</p>
              <p className="text-xs  mt-1" style={{ color: isDark ? "#3b5de8ff" : "#6B7280" }}>Mode: Live backend</p>
              {isSubjectView && <div className="mt-3"></div>}
            </div>
            <div className="flex items-center gap-4" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Mastery & Coverage */}
          <StatsCards data={data} subjectEntry={subjectEntry} isSubjectView={isSubjectView} />



          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Line Chart */}
            {/*}  <LineCharts
              latestScore={latestScore}
              prevScore={prevScore}
              activityRange={activityRange}
              lineChartData={lineChartData}
              maxQuestionsAttempted={maxQuestionsAttempted}
              setActivityRange={this.setActivityRange}
            />*/}
            <LineCharts
              data={data}
              subjectEntry={subjectEntry}
              isSubjectView={isSubjectView}
              activityRange={activityRange}
              setActivityRange={this.setActivityRange}
            />

            {/* Right: Subject / Chapter chart */}
            <SubjectChapterChart
              isSubjectView={isSubjectView}
              loading={loading}
              modulesPayloadForChart={modulesPayloadForChart}
              chartVersion={this.state.chartVersion}
              renderMasteryCircle={renderMasteryCircle}
              totalQuestionsBySubject={totalQuestionsBySubject}
              bySubjectMap={bySubjectMap}
              subjectBarData={subjectBarData}
            />
          </div>

          {!isSubjectView && subjects.length > 0 && <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] hover:border-indigo-500/30 transition-colors"> 
            <StudentSubjectHeatmap subjects={subjects} />
          </div>}

          {isSubjectView && renderSubmoduleCharts}
          {
            /* Question Classification & Highlights */
          }
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

/* --- Simple ErrorBoundary to avoid white screen and show error details --- */
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
    return (
      <div style={{ padding: 40, fontFamily: "Plus Jakarta Sans, system-ui, sans-serif", background: "#0B0F19", minHeight: "100vh", color: "#E5E7EB" }}>
  <h2 style={{ color: "#6366F1" }}>Something went wrong rendering Analytics</h2>
  <p style={{ color: "#9CA3AF" }}>The dashboard crashed while rendering. The error is shown below — please paste it here so I can fix it.</p>
  <pre style={{ whiteSpace: "pre-wrap", background: "#111827", padding: 12, borderRadius: 8, border: "1px solid #1F2937", color: "#EF4444" }}>
          {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
        </pre>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer" }}>More info</summary>
         <pre style={{ whiteSpace: "pre-wrap", background: "#111827", padding: 12, borderRadius: 8, border: "1px solid #1F2937", color: "#9CA3AF" }}> </pre>
        </details>
      </div>
    );
  }
}

const mapDispatchToProps = {
  setCanonical,
  setActiveSubjects,
  setSubCanonical,
  setAnalytics,
  setSubmodule
};


/* Redux wiring */
function mapStateToProps(state) {
  return {
    signupData: (state.auth || {}).signupData,
    viewCourse: state.viewCourse || {},
    reduxCanonical: state.viewCourse?.analytics,
    reduxSubCanonical: state.viewCourse?.submoduleAnalytics,
    reduxActiveSubjects: state.viewAnalytics?.activeSubjects,
  };
}


// wrap with router & redux, but render inside the ErrorBoundary to avoid white-screen
const Wrapped = connect(mapStateToProps, mapDispatchToProps)(withRouter((props) => (
  <ErrorBoundary>
    <AnalyticsDashboard {...props} />
  </ErrorBoundary>
)));

export default Wrapped;

