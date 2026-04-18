// src/pages/AnalyticsDashboard.jsx
import React from "react";
import { connect } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CartesianGrid, XAxis,YAxis, Tooltip,ResponsiveContainer,BarChart, Bar,} from "recharts";

import {
  Clock,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Award,
  Target,
  Activity,
  Calendar,
  Zap,
} from "lucide-react";

import { supabaseService } from "../services/supabaseService";
import SubjectChapterBarChart from "../components/analytics/SubjectChapterBarChart";
import StudentSubjectHeatmap from "../components/analytics/StudentSubjectHeatmap";
import { setCanonical, setActiveSubjects, setSubCanonical } from "../slices/analyticsSlice";
import { setSubmodule, setAnalytics } from "../slices/viewCoursesSlice";
import StatsCards from "../components/analytics/StatsCards";
import LineCharts from "../components/analytics/LineCharts";
import SubjectChapterChart from "../components/analytics/SubjectChapterChart";
import QuestionClassificationHighLights from "../components/analytics/QuestionClassificationHighLights";

/* withRouter HOC so component itself has no hooks inside */
function withRouter(Component) {
  return function WrappedComponent(props) {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    return <Component {...props} router={{ params, navigate, location }} />;
  };
}

/* small helpers */
function formatTime(seconds) {
  const secs = Number(seconds || 0);
  if (!secs) return "0s";
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSeconds = secs % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}
/* SUBJECT-SPECIFIC datewise aggregation
   - sums correct & attended per day
   - filters by subjectId BEFORE aggregation
   - score = sum(correct) / sum(attended)
*/
function aggregateSubmodulesDatewiseBySubject(raw, subjectId) {
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
function applyRangeToDatewise(data, range) {
  if (!Array.isArray(data)) return [];

  let days;
  switch (range) {
    case "1w": days = 7; break;
    case "1m": days = 30; break;
    case "3m": days = 90; break;
    case "6m": days = 180; break;
    case "1y": days = 365; break;
    default: days = 30;
  }

  if (data.length <= days) return data;

  return data.slice(data.length - days);
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



/* aggregate submodule-level per-date data into [{ day, questionsAttempted, score }] */
/* Improved: merges duplicate day entries into a single summed row */
function aggregateSubmodulesDatewise(raw) {
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

function createEmptyAnalytics() {
  return {
    stats: {
      totalTimeSpent: 0,
      totalUniqueQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      attendedTotal: 0,
      totalUniqueAttended: 0,
      avgTime: 0,
      avgTimeUnique: 0,
      averageScore: 0,
      finalAccuracy: 0,
      coverage: 0,
      mastery: 0,
      bestScore: 0,
      coverageBySubject: {},
      totalCorrectUnique: 0,
      totalIncorrectUnique: 0,
    },
    byDate: {},
    bySubmodule: {},
    byModule: {},
    bySubject: {},
    byGrade: {},
    questionClassification: { important: [], ok: [], bad: [], common: [] },
    timeline: [],
    activity: [],
    subjects: [],
    modules: [],
    raw: {},
  };
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
      console.log("DEBUG: using redux canonical:", reduxCanonical);
      console.log("DEBUG: fetchId:", fetchId);
      let canonical = reduxCanonical;;
      let activeSubjects = reduxActiveSubjects;
      if (!canonical || !Object.keys(canonical).length) {
        console.log("INFO: fetching canonical analytics from server");
        canonical = await supabaseService.getAnalytics(googleId, fetchId);
      }
      if (!activeSubjects || !activeSubjects.length) {
        console.log("INFO: fetching active subjects from server");
        const subjectsResp = await supabaseService.getSubjects("", false, true);
        activeSubjects = subjectsResp.subjects || [];
      }
      // STEP 1️⃣ — Fetch ONLY active subjects


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

          if (!subCanonical || !Object.keys(subCanonical).length) {
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
    if (
      (!Array.isArray(data.subjects) || data.subjects.length === 0) &&
      data.raw?.bySubject &&
      typeof data.raw.bySubject === "object"
    ) {
      data.subjects = Object.entries(data.raw.bySubject).map(([sid, v]) => ({
        subjectId: sid,
        subjectName: v.subjectName ?? v.subject_name ?? v.name ?? sid,
        totalCorrectUnique: Number(v.totalCorrectUnique ?? v.correct ?? 0),
        totalIncorrectUnique: Number(v.totalIncorrectUnique ?? v.incorrect ?? 0),
        totalUniqueAttended: Number(v.totalUniqueAttended ?? v.attended ?? 0),
        totalQuestions: Number(v.totalQuestions ?? 0),
        mastery: Number(v.mastery ?? 0),
        raw: v,
      }));
    }
    const statsSource = sourceIsSubject
      ? (subjectEntry?.raw ?? subjectEntry ?? {})
      : (
        data.raw?.overall?.stats ??
        data.raw?.stats ??
        data.stats ??
        {}
      );
    const s =
      statsSource.stats ??
      statsSource.overall ??
      statsSource.summary ??
      statsSource;
    // 🔥 Fallback: derive totals from submodule analytics if overall stats are zero
    const subSource = data.raw?._submoduleSource;
    let effectiveStats = s;
    if (
      subSource &&
      !s.attendedTotal &&
      !s.totalCorrect &&
      !s.totalIncorrect
    ) {
      let attended = 0;
      let correct = 0;
      let incorrect = 0;
      let uniqueQs = 0;
      const subs =
        subSource.subModulesFlat?.subModules ??
        subSource.subModules ??
        [];
      subs.forEach((sm) => {
        attended += Number(sm.attendedTotal ?? sm.attended ?? 0);
        correct += Number(sm.totalCorrect ?? sm.correct ?? 0);
        incorrect += Number(sm.totalIncorrect ?? sm.incorrect ?? 0);
        uniqueQs += Number(sm.totalQuestions ?? 0);
      });
      effectiveStats = {
        attendedTotal: attended,
        totalCorrect: correct,
        totalIncorrect: incorrect,
        totalUniqueQuestions: uniqueQs,
      };
      console.log("Derived effectiveStats from submodule source:", effectiveStats);
    }
    const card_attendedTotal = num(
      effectiveStats.attendedTotal ??
      effectiveStats.attended ??
      effectiveStats.attempted ??
      effectiveStats.totalQuestionsAttempted ??
      effectiveStats.total_attempted ??
      0
    );
    const card_totalCorrect = num(
      effectiveStats.totalCorrect ??
      effectiveStats.correct ??
      effectiveStats.correctAnswers ??
      effectiveStats.correct_answers ??
      0
    );
    const card_totalIncorrect = num(
      effectiveStats.totalIncorrect ??
      effectiveStats.incorrect ??
      effectiveStats.wrong ??
      effectiveStats.wrongAnswers ??
      effectiveStats.incorrect_answers ??
      0
    );
    const card_totalUniqueQuestions = num(
      s.totalUniqueQuestions ??
      s.totalQuestions ??
      s.total_questions ??
      0
    );
    const card_totalUniqueAttended = num(
      s.totalUniqueAttended ??
      s.totalUniqueAttempted ??
      s.attendedTotal ??
      s.attended ??
      0
    );
    const card_totalCorrectUnique = num(
      s.totalCorrectUnique ??
      s.correctUnique ??
      s.totalCorrect ??
      0
    );
    const card_totalIncorrectUnique = num(
      s.totalIncorrectUnique ??
      s.incorrectUnique ??
      s.totalIncorrect ??
      0
    );
    // ---------- FIX COVERAGE ----------
    const totalPool =
      num(effectiveStats.totalUniqueQuestions) ||
      num(effectiveStats.totalQuestions) ||
      num(card_totalUniqueQuestions) ||
      num(card_attendedTotal) || // final fallback
      0;
    const attempted =
      num(effectiveStats.attendedTotal) ||
      num(effectiveStats.attended) ||
      (num(effectiveStats.totalCorrect) + num(effectiveStats.totalIncorrect));
    // Safe & honest coverage
    const computedCoverage =
      totalPool > 0
        ? Math.min(100, Math.round((attempted / totalPool) * 100))
        : attempted > 0
          ? 100 // fallback when pool is unknown but activity exists
          : 0;
    // ---------- ACCURACY ----------
    const displayAccuracy =
      card_totalCorrect + card_totalIncorrect > 0
        ? Math.round(
          (card_totalCorrect /
            (card_totalCorrect + card_totalIncorrect)) * 100
        )
        : 0;
    // ---------- FIX MASTERY ----------
    // const computedMastery = displayAccuracy; // mastery = accuracy
    const computedMastery = 0
    const backendAvgScoreSubject = sourceIsSubject ? num(subjectEntry.raw?.averageScore ?? subjectEntry.raw?.avgScore ?? subjectEntry.raw?.avg_score) : NaN;
    const backendAvgScoreOverall = !sourceIsSubject ? num(data.stats?.averageScore ?? data.stats?.avgScore ?? data.stats?.avg_score) : NaN;
    const backendAvgScore = sourceIsSubject ? backendAvgScoreSubject : backendAvgScoreOverall;

    const computedAttempts = card_totalCorrect + card_totalIncorrect;
    const card_avgScore = Number.isFinite(backendAvgScore) && !Number.isNaN(backendAvgScore) && backendAvgScore > 0
      ? Math.round(backendAvgScore)
      : (computedAttempts ? Math.round((card_totalCorrect / computedAttempts) * 100) : 0);
    const totalQuestionsPool = card_totalUniqueQuestions || 0;
    const totalQuestionsAttempted = Number(card_attendedTotal || (card_totalCorrect + card_totalIncorrect));
    let avgScore = card_avgScore;
    const uniqueAttended = Number(card_totalUniqueAttended || (card_totalCorrect + card_totalIncorrect));
    const backendAccuracy = sourceIsSubject
      ? (subjectEntry.raw?.accuracy ?? subjectEntry.raw?.finalAccuracy ?? subjectEntry.raw?.final_accuracy ?? subjectEntry.raw?.avgScore ?? subjectEntry.raw?.avg_score)
      : (data.stats?.accuracy ?? data.stats?.finalAccuracy ?? data.stats?.final_accuracy ?? data.stats?.avgScore ?? data.stats?.avg_score);
    const computedAccuracy = (card_totalCorrect + card_totalIncorrect) > 0
      ? Math.round((card_totalCorrect / (card_totalCorrect + card_totalIncorrect)) * 100)
      : 0;

    let coverageFromBackend = null;
    let masteryFromBackend = 0;

    if (sourceIsSubject) {
      const sraw = subjectEntry.raw ?? {};
      if (typeof sraw.coverage === "number") coverageFromBackend = Math.round(sraw.coverage);
      else if (typeof subjectEntry.coverage === "number") coverageFromBackend = Math.round(subjectEntry.coverage);

      if (typeof sraw.mastery === "number") masteryFromBackend = Math.round(sraw.mastery);
      else if (typeof subjectEntry.mastery === "number") masteryFromBackend = Math.round(subjectEntry.mastery);
    } else {
      if (typeof data.stats?.coverage === "number") coverageFromBackend = Math.round(data.stats.coverage);
      if (typeof data.stats?.mastery === "number") masteryFromBackend = Math.round(data.stats.mastery);
    }

    const completionRate =
      coverageFromBackend != null && coverageFromBackend > 0
        ? coverageFromBackend
        : computedCoverage;

    const mastery =
      masteryFromBackend != null && masteryFromBackend > 0
        ? masteryFromBackend
        : computedMastery;
    console.log("mastery:", mastery, "computed:", computedMastery, "from backend:", masteryFromBackend);


    const baseBestScore = sourceIsSubject ? (num(subjectEntry.bestScore) ?? 0) : (num(data.stats?.bestScore) ?? num(data.stats?.best_score) ?? 0);
    const bestScore = baseBestScore != null && !Number.isNaN(Number(baseBestScore)) ? Number(baseBestScore) : 0;
    const baseTotalTime = sourceIsSubject ? (num(subjectEntry.totalTime) ?? 0) : (num(data.stats?.totalTime) ?? num(data.stats?.totalTimeSpent) ?? 0);

    // activity + line chart
    const rawActivity = Array.isArray(data.activity) ? data.activity : [];
    const baseActivity = rawActivity.length > 0
      ? rawActivity.map((item) => {
        const correct = Number(item.correct ?? item.correctAnswers ?? 0);
        const wrong = Number(item.wrong ?? item.incorrectAnswers ?? 0);
        const unattempted = Number(item.unattempted ?? item.unattemptedQuestions ?? 0);
        const attempted = Number(item.attempted ?? item.count ?? item.totalQuestionsAttempted ?? correct + wrong);
        return { day: item.day || item.label || item.date || null, correct, wrong, unattempted, attempted };
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
        const d = new Date(); d.setDate(d.getDate() - i);
        padded.push({ day: d.toISOString().split("T")[0], correct: 0, wrong: 0, unattempted: 0, attempted: 0 });
      }
      padded.push(...baseActivity);
      return padded;
    };

    const processedActivityWithBreakdown = getActivityByRange(activityRange);

    // ---------- BUILD lineChartData: prefer datewise.attendedTotal (server) ----------
    let lineChartData = [];

    // 1) prefer derived submodule datewise if loadAnalytics attached it
    const derivedFromSubmodules = Array.isArray(data._derivedDatewiseFromSubmodules) && data._derivedDatewiseFromSubmodules.length
      ? data._derivedDatewiseFromSubmodules
      : null;

    if (derivedFromSubmodules) {
      // data already normalized to { day, questionsAttempted, score }
      lineChartData = derivedFromSubmodules.map((r) => ({
        day: r.day,
        questionsAttempted: Number(r.questionsAttempted ?? r.attempted ?? 0) || 0,
        score: Number(r.score ?? r.avgScore ?? 0) || 0,
      }));
    } else {
      // 2) fallback: try server-provided datewise.stats array (common canonical shapes)
      const raw = data.raw ?? data ?? {};
      const _toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

      const datewiseArray =
        Array.isArray(raw?.datewise) ? raw.datewise
          : Array.isArray(raw?.datewise?.stats) ? raw.datewise.stats
            : Array.isArray(data?.datewise) ? data.datewise
              : null;

      if (Array.isArray(datewiseArray) && datewiseArray.length) {
        // If backend already provided array of day objects with attended/attendedTotal, use it first.
        lineChartData = datewiseArray.map((r) => {
          const day = r.day ?? r.date ?? r.label;
          const questionsAttempted = Number(r.attended ?? r.attendedTotal ?? r.questionsAttempted ?? r.attempted ?? r.count ?? r.total ?? 0) || 0;
          const correct = Number(r.correct ?? r.correctAnswers ?? r.totalCorrect ?? 0) || 0;
          const avgScore = r.avgScore ?? r.averageScore ?? r.score ?? null;
          const score = questionsAttempted ? Math.round((avgScore != null ? Number(avgScore) : (correct ? (correct / (questionsAttempted || 1)) * 100 : 0))) : 0;
          return { day, questionsAttempted, score };
        }).filter(Boolean);
      }

      // 3) if still empty try aggregate from submodules (server shapes that don't provide datewise)
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

      // 4) fallback to client-side activity array
      if ((!lineChartData || lineChartData.length === 0) && processedActivityWithBreakdown && processedActivityWithBreakdown.length) {
        lineChartData = processedActivityWithBreakdown.map((item) => ({
          day: item.day,
          questionsAttempted: Number(item.attempted || 0) || 0,
          score: item.attempted ? Math.round((item.correct / (item.attempted || 1)) * 100) : 0,
        }));
      }
    }


    console.log("DEBUG lineChartData (used by chart):", lineChartData);
    console.log("DEBUG raw used for charts (source):", (data.raw ?? data) || {});
    // 🔹 APPLY DROPDOWN RANGE (final step for ALL views)
    if (!Array.isArray(lineChartData) || lineChartData.length === 0) {
      // STEP 2: normalize day format so date matching works
      lineChartData = lineChartData.map((d) => ({
        ...d,
        day: typeof d.day === "string"
          ? d.day.slice(0, 10) // converts to YYYY-MM-DD
          : d.day,
      }));

      lineChartData = buildFixedDateRangeData([], activityRange);
    }



    // compute right-axis max (at least 5 so series is visible)
    let maxQuestionsAttempted = lineChartData.reduce((max, d) => Math.max(max, Number(d.questionsAttempted || 0) || 0), 0);
    if (!Number.isFinite(maxQuestionsAttempted) || maxQuestionsAttempted < 1) maxQuestionsAttempted = 5;

    const latestScore = lineChartData.length > 0 ? Number(lineChartData[lineChartData.length - 1].score || 0) : 0;
    const prevScore = lineChartData.length > 1 ? Number(lineChartData[lineChartData.length - 2].score || 0) : 0;

    const subjectBarData = this.buildSubjectBarData(data);
    console.log("DEBUG subjectBarData:", data.raw?.subjects?.stats);
    const subjects = data.raw?.subjects?.stats || [];
    console.log("DEBUG subjects for heatmap:", subjects);


    const derived = this.deriveClassificationAndNotes(data);

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
      classificationSource.bad.length ||
      1;


    const classificationData = [
      {
        name: "Important",
        value: classificationSource.important?.length || 0,
        color: "#f59e0b",
        icon: "⭐",
      },
      {
        name: "Got It",
        value: classificationSource.ok?.length || 0,
        color: "#10b981",
        icon: "👍",
      },
      {
        name: "Difficult",
        value: classificationSource.bad?.length || 0,
        color: "#ef4444",
        icon: "🚫",
      },
    ];


    const backendAvgTime =
      sourceIsSubject
        ? (subjectEntry?.raw?.avgTime ??
          subjectEntry?.raw?.avgTimeSpent ??
          subjectEntry?.raw?.avg_time_spent)
        : (data.stats?.avgTime ??
          data.stats?.avgTimeSpent ??
          data.raw?.avgTime);

    let displayAvgTimeSeconds = 0;

    if (Number(backendAvgTime) > 0) {
      displayAvgTimeSeconds =
        backendAvgTime < 1000
          ? Math.round(backendAvgTime * 60) // minutes → seconds
          : Math.round(backendAvgTime);     // already seconds
    } else if (uniqueAttended > 0 && baseTotalTime > 0) {
      displayAvgTimeSeconds = Math.round(baseTotalTime / uniqueAttended);
    }


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
          <h3 className="text-lg font-bold mb-4 text-gray-800">Submodule-wise Progress</h3>

          <div className={`grid ${colsClass} gap-6`}>
            {chartsArr.map((c) => (
              <div key={c.key} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{c.moduleName}</h4>
                  <div className="text-sm text-gray-500">{c.data.length} submodules</div>
                </div>

                {c.data.length === 0 ? (
                  <div className="text-gray-400 text-sm">No submodule data available for this module.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={c.data} margin={{ top: 6, right: 10, left: -10, bottom: 40 }} isAnimationActive={false}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} interval={0} angle={-25} textAnchor="end" />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={{ stroke: "#e5e7eb" }} />
                        <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
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
      <div className="min-h-screen bg-[#0f0f1a] p-4 md:p-8 pt-20 md:pt-24">
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
              }} className="flex items-center gap-2 text-purple-900 hover:text-purple-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Subject
              </button>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-800 to-indigo-600 bg-clip-text text-transparent">
                {isSubjectView ? `${viewCourse?.subject?.name || subjectEntry?.subjectName || "Subject"} Analytics Dashboard` : "Your Analytics Dashboard"}
              </h1>
              <p className="text-gray-600 mt-2">Track your progress and performance</p>
              <p className="text-l  mt-1" style={{ color: isDark ? "#E5E7EB" : "#6B7280" }}>Mode: Live backend</p>
              {isSubjectView && <div className="mt-3"></div>}
            </div>
            <div className="flex items-center gap-4" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Mastery & Coverage */}
          <StatsCards
            mastery={mastery}
            completionRate={completionRate}
            card_attendedTotal={card_attendedTotal}
            card_totalCorrect={card_totalCorrect}
            card_totalIncorrect={card_totalIncorrect}
            card_avgScore={card_avgScore}
            card_totalUniqueAttended={card_totalUniqueAttended}
            card_totalUniqueQuestions={card_totalUniqueQuestions}
            card_totalCorrectUnique={card_totalCorrectUnique}
            card_totalIncorrectUnique={card_totalIncorrectUnique}
            displayAccuracy={displayAccuracy}
          />



          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Line Chart */}
            <LineCharts
              latestScore={latestScore}
              prevScore={prevScore}
              activityRange={activityRange}
              lineChartData={lineChartData}
              maxQuestionsAttempted={maxQuestionsAttempted}
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

          {!isSubjectView && subjects.length > 0 && <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <StudentSubjectHeatmap subjects={subjects} />
          </div>}

          {isSubjectView && renderSubmoduleCharts}
          {
            /* Question Classification & Highlights */
          }
          <QuestionClassificationHighLights
            classificationData={classificationData}
            displayAvgTimeSeconds={displayAvgTimeSeconds}
            formatTime={formatTime}
            baseTotalTime={baseTotalTime}
            classificationTotalBase={classificationTotalBase}
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
      <div style={{ padding: 40, fontFamily: "Inter, system-ui, sans-serif", color: "#111" }}>
        <h2 style={{ color: "#7c3aed" }}>Something went wrong rendering Analytics</h2>
        <p style={{ color: "#333" }}>The dashboard crashed while rendering. The error is shown below — please paste it here so I can fix it.</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eee", color: "#a33" }}>
          {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
        </pre>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer" }}>More info</summary>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
            {this.state.info && (this.state.info.componentStack || JSON.stringify(this.state.info, null, 2))}
          </pre>
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
