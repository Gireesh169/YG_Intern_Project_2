// src/pages/CourseDetail.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  setSubjectData,
  setModulesData,
  setTotalModules,
  setSubmodule,
  setAnalytics,
} from "../slices/viewCoursesSlice.jsx";

import {
  Calculator,
  Atom,
  Globe,
  BookOpen,
  Languages,
  Palette,
  Music,
  Code,
  Brain,
  FlaskConical,
  Dna,
  History,
  Users,
  RotateCcw,
} from "lucide-react";

import { supabaseService } from "../services/supabaseService.js";
import ModuleList from "../components/course/ModuleList.jsx";
import SubjectHeaderCard from "../components/course/SubjectHeaderCard.jsx";
import AutoQuizPanel from "../components/course/AutoQuizPanel.jsx";
import { useTheme } from "../utils/useTheme";

/* subjectIcons (same as your previous code) */
const subjectIcons = {
  mathematics: {
    icon: Calculator,
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  math: {
    icon: Calculator,
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  science: {
    icon: Atom,
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-50",
  },
  physics: {
    icon: Atom,
    color: "from-indigo-500 to-purple-500",
    bg: "bg-indigo-50",
  },
  chemistry: {
    icon: FlaskConical,
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50",
  },
  biology: { icon: Dna, color: "from-teal-500 to-cyan-500", bg: "bg-teal-50" },
  english: {
    icon: BookOpen,
    color: "from-rose-500 to-pink-500",
    bg: "bg-orange-50",
  },
  language: {
    icon: Languages,
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
  },
  history: {
    icon: History,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
  },
  geography: {
    icon: Globe,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
  },
  "social science": {
    icon: Users,
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
  },
  art: { icon: Palette, color: "from-rose-500 to-pink-500", bg: "bg-rose-50" },
  music: {
    icon: Music,
    color: "from-fuchsia-500 to-purple-500",
    bg: "bg-fuchsia-50",
  },
  computer: {
    icon: Code,
    color: "from-slate-500 to-gray-500",
    bg: "bg-slate-50",
  },
  default: {
    icon: Brain,
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
  },
};

const getSubjectIcon = (subjectName) => {
  if (!subjectName) return subjectIcons.default;
  const name = subjectName.toLowerCase();
  if (subjectIcons[name]) return subjectIcons[name];
  for (const [key, value] of Object.entries(subjectIcons)) {
    if (name.includes(key) || key.includes(name)) return value;
  }
  return subjectIcons.default;
};

const CourseDetail = () => {
  const { courseName, courseId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subject, modules, totalModules, submoduleAnalytics, analytics } =
    useSelector((s) => s.viewCourse || {});
  const { signupData } = useSelector((s) => s.auth || {});
  const googleId = signupData?.googleId;

  const [attemptedList, setAttemptedList] = useState([]);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [selectedSubModuleId, setSelectedSubModuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsCanonical, setAnalyticsCanonical] = useState(null);
  const [canonical1, setcanonical1] = useState(null);

  // Auto Quiz popup
  const [showAutoQuizPanel, setShowAutoQuizPanel] = useState(false);
  const [autoQuizModules, setAutoQuizModules] = useState([]); // unified data

  const [chapterSelection, setChapterSelection] = useState({});

  const { theme } = useTheme();
const isDark = theme === "dark";

  const subjectConfig = subject
    ? getSubjectIcon(subject.name)
    : subjectIcons.default;
  const IconComponent = subjectConfig.icon;
  const [autoQuizModule, setAutoQuizModule] = useState(null);

  const handleDirectAutoQuizForChapter = async (chapterId) => {
    try {
      const toastId = toast.loading("Generating quiz...");

      const questions = await supabaseService.getAutoQuiz([chapterId]);

      toast.dismiss(toastId);

      if (!questions || questions.length === 0) {
        toast.error("No questions available for this chapter.");
        return;
      }

      localStorage.removeItem("quiz_progress_auto-quiz");

      navigate(`/course/${subject.id}/auto-quiz`, {
        state: {
          isAutoQuiz: true,
          generatedQuestions: questions,
        },
      });
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to generate auto quiz");
      console.error(err);
    }
  };

  // derived counts

  const totalChapters = Array.isArray(modules)
    ? modules.reduce((acc, m) => acc + (m.subModules?.length || 0), 0)
    : 0;
  const completedChaptersCount = attemptedList.length || 0;
  const sortChaptersByNumber = (subModules = []) => {
    return [...subModules].sort((a, b) => {
      const getNum = (name = "") => {
        const match = name.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      return getNum(a.name) - getNum(b.name);
    });
  };

  // Fetch course details (subject + modules)
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);

        if (!courseId) throw new Error("Missing courseId");

        const shouldFetch = !subject || subject.id !== courseId;
        if (!shouldFetch) return;

        const {
          subject: subjData,
          modules: mods,
          totalModules: tModules,
        } = await supabaseService.getCourseDetails(courseId);

        if (subjData) dispatch(setSubjectData(subjData));
        dispatch(setModulesData(mods || []));
        dispatch(setTotalModules(tModules || 0));

        console.log("Fetched course details:", { subjData, mods, tModules });
      } catch (err) {
        console.error("Error fetching course details:", err);
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, subject, dispatch]);

  // Fetch canonical analytics (switched to get_analytics_subModule)
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    if (!googleId) return;

    hasFetched.current = true;
    let mounted = true;
    const fetchAnalytics = async () => {
      if (!googleId) return;
      try {
        // Use get_analytics_subModule for lighter payload

        let result = submoduleAnalytics;
        console.log(result);
        if (!result || (Array.isArray(result) && result.length === 0)) {
          result = await supabaseService.get_analytics_subModule(
            googleId,
            null,
          );
        }
        let canonical = analytics;
        if (
          !canonical ||
          (Array.isArray(canonical) && canonical.length === 0)
        ) {
          canonical = await supabaseService.getAnalytics(googleId, null);
        }
        dispatch(setSubmodule(result));
        dispatch(setAnalytics(canonical));
        setcanonical1(canonical);

        if (!mounted) return;
        setAnalyticsCanonical(result);

        // derive attempted list from result.subModules or result.subModulesFlat or result array
        // Assuming result structure based on "submodules flat" hint:
        // likely { subModules: [...] } or just [...]
        const candidates =
          result?.subModulesFlat?.subModules ||
          result?.subModules ||
          (Array.isArray(result) ? result : []);

        const raw = canonical?.raw ?? canonical ?? {};
        const bySubmodule =
          raw?.bySubmodule ??
          raw?.by_submodule ??
          canonical?.bySubmodule ??
          canonical?.by_submodule ??
          {};

        const attemptedIds = Object.entries(bySubmodule || {})
          .filter(([k, v]) => {
            const correct = Number(
              v.totalCorrectUnique ?? v.correct ?? v.correctAnswers ?? 0,
            );
            const incorrect = Number(
              v.totalIncorrectUnique ?? v.incorrect ?? 0,
            );
            const total = Number(
              v.total ?? v.totalQuestions ?? v.attended ?? 0,
            );
            return correct + incorrect + total > 0;
          })
          .map(([k]) => (isNaN(Number(k)) ? k : Number(k)));

        if (attemptedIds.length) {
          setAttemptedList(attemptedIds);
        } else {
          try {
            const resp = await supabaseService.getAttemptedSubModules(
              googleId,
              canonical,
              courseId,
            );
            setAttemptedList(resp.attemptedSubmodules || []);
          } catch (rpcErr) {
            console.warn(
              "getAttemptedSubModules failed, leaving attemptedList empty",
              rpcErr,
            );
            setAttemptedList([]);
          }
        }
      } catch (err) {
        console.error("Error loading analytics for course header:", err);
        setAnalyticsCanonical(null);
      }
    };

    fetchAnalytics();
    return () => {
      mounted = false;
    };
  }, [googleId, courseId]);

  // pre-select attempted chapters into chapterSelection
  // ❌ DISABLE AUTO-SELECTION: User requested control over selections.
  /*
  useEffect(() => {
    if (!Array.isArray(attemptedList)) return;
    setChapterSelection((prev) => {
      const out = { ...prev };
      attemptedList.forEach((id) => { if (out[id] === undefined) out[id] = true; });
      return out;
    });
  }, [attemptedList]);
  */

  // Helper: build modulesPayloadForChart like AnalyticsDashboard expects
  const modulesPayloadForChart = useMemo(() => {
    // analytics canonical may contain grouped modules: canonical.modules (groups by subject) OR raw.modules
    if (!analyticsCanonical) {
      // fallback: try use view modules (flat modules with subModules)
      if (!Array.isArray(modules)) return [];
      // convert each module to a shape that SubjectChapterBarChart normalizer accepts
      return modules.map((m) => {
        // include minimal fields — SubjectChapterBarChart works with moduleName/moduleId and counts if present
        return {
          moduleId: m.id,
          moduleName: m.name,
          // allow downstream to find totalQuestions via subModules aggregate if needed
          totalQuestions: Array.isArray(m.subModules)
            ? m.subModules.reduce((a, s) => a + (s.questionCount || 0), 0)
            : 0,
          // include subModules as modules may expect
          // also flatten subModules to have id/name for small chart usage if needed
          subModules: m.subModules || [],
        };
      });
    }

    // if analytics canonical has modules grouped by subject, find group that matches this subject
    const canonicalModules = Array.isArray(analyticsCanonical?.modules)
      ? analyticsCanonical.modules
      : Array.isArray(analyticsCanonical?.modules?.stats)
        ? analyticsCanonical.modules.stats
        : (analyticsCanonical?.modulesMeta?.stats ?? []);

    if (Array.isArray(canonicalModules) && canonicalModules.length) {
      // Try to find the group for this subject (subject may have id)
      const subjId = subject?.id ?? subject?.subjectId ?? subject?.key;
      const found = subjId
        ? canonicalModules.find(
            (g) =>
              String(g.subjectId ?? g.subject_id ?? g.id ?? g.key) ===
              String(subjId),
          )
        : null;
      if (found && Array.isArray(found.modules)) return found.modules;
      // else keep flattened groups – map to a flat modules array if any group.modules exists
      const withModules = canonicalModules.flatMap((g) =>
        Array.isArray(g.modules) ? g.modules : [],
      );
      if (withModules.length) return withModules;
    }

    // fallback to analytics raw.modules if present
    const raw = analyticsCanonical.raw ?? analyticsCanonical ?? {};
    if (Array.isArray(raw.modules)) return raw.modules;

    // last fallback: use view modules (converted above)
    if (Array.isArray(modules))
      return modules.map((m) => ({
        moduleId: m.id,
        moduleName: m.name,
        subModules: m.subModules || [],
      }));

    return [];
  }, [analyticsCanonical, modules, subject]);

  // build totalQuestionsBySubject & bySubject map from canonical analytics (same logic AnalyticsDashboard used)
  const totalQuestionsBySubject = useMemo(() => {
    const out = {};
    const raw = analyticsCanonical?.raw ?? analyticsCanonical ?? {};
    // candidate places
    const subjectsArr = Array.isArray(analyticsCanonical?.subjects)
      ? analyticsCanonical.subjects
      : Array.isArray(analyticsCanonical?.subjects?.stats)
        ? analyticsCanonical.subjects.stats
        : (analyticsCanonical?.subjectsMeta?.stats ??
          raw?.subjects ??
          analyticsCanonical?.stats?.subjects ??
          []);

    if (Array.isArray(subjectsArr)) {
      subjectsArr.forEach((s) => {
        const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.key;
        if (sid)
          out[sid] = Number(
            s.totalQuestions ?? s.total_questions ?? s.total ?? 0,
          );
      });
    }
    // fallback to raw.stats
    if (Object.keys(out).length === 0 && Array.isArray(raw?.stats)) {
      raw.stats.forEach((s) => {
        const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.subject;
        if (sid)
          out[sid] = Number(
            s.totalQuestions ?? s.total_questions ?? s.total ?? 0,
          );
      });
    }
    return out;
  }, [analyticsCanonical]);

  const bySubjectMap = useMemo(() => {
    const map = {};
    const raw = analyticsCanonical?.raw ?? analyticsCanonical ?? {};

    const subjectsArr = Array.isArray(analyticsCanonical?.subjects)
      ? analyticsCanonical.subjects
      : Array.isArray(analyticsCanonical?.subjects?.stats)
        ? analyticsCanonical.subjects.stats
        : [];

    if (subjectsArr.length) {
      subjectsArr.forEach((s) => {
        const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.key;
        if (sid)
          map[sid] = {
            attended: Number(
              s.totalUniqueAttended ??
                s.total_unique_attended ??
                s.attended ??
                s.attendedTotal ??
                0,
            ),
            raw: s,
          };
      });
    }
    // otherwise try raw.bySubject
    if (
      Object.keys(map).length === 0 &&
      raw?.bySubject &&
      typeof raw.bySubject === "object"
    ) {
      Object.entries(raw.bySubject).forEach(([sid, v]) => {
        map[sid] = {
          attended: Number(
            v.attended ?? v.attendedTotal ?? v.totalUniqueAttended ?? 0,
          ),
          raw: v,
        };
      });
    }
    // lastly try raw.stats
    if (Object.keys(map).length === 0 && Array.isArray(raw?.stats)) {
      raw.stats.forEach((s) => {
        const sid = s.subjectId ?? s.subject_id ?? s.id ?? s.subject;
        if (sid)
          map[sid] = {
            attended: Number(
              s.totalUniqueAttended ??
                s.totalUniqueAttempted ??
                s.attended ??
                s.attendedTotal ??
                0,
            ),
            raw: s,
          };
      });
    }
    return map;
  }, [analyticsCanonical]);

  // Small UI helpers
  const resetQuizData = async (googleIdArg, subModuleId) => {
    try {
      await supabaseService.resetQuiz(googleIdArg, subModuleId);
      toast.success("Quiz reset successfully!");
      // refresh attempted list
      if (googleIdArg && courseId) {
        // try deriving from analytics again (switched to get_analytics_subModule)
        try {
          const result = await supabaseService.get_analytics_subModule(
            googleIdArg,
            null,
          );
          const candidates =
            result?.subModulesFlat?.subModules ||
            result?.subModules ||
            (Array.isArray(result) ? result : []);

          const attemptedIds = candidates
            .filter((v) => {
              const correct = Number(
                v.totalCorrectUnique ?? v.correct ?? v.correctAnswers ?? 0,
              );
              const incorrect = Number(
                v.totalIncorrectUnique ?? v.incorrect ?? 0,
              );
              const total = Number(
                v.total ??
                  v.totalQuestions ??
                  v.attended ??
                  v.totalUniqueAttended ??
                  0,
              );
              return correct + incorrect + total > 0;
            })
            .map((v) => {
              const k = v.subModuleId ?? v.id;
              return isNaN(Number(k)) ? k : Number(k);
            });

          setAttemptedList(attemptedIds);
        } catch (e) {
          // fallback to RPC if available
          const resp = await supabaseService.getAttemptedSubModules(
            googleIdArg,
            courseId,
          );
          setAttemptedList(resp.attemptedSubmodules || []);
        }
      }
    } catch (error) {
      console.error("Error resetting quiz data:", error);
      toast.error("Failed to reset quiz");
    }
  };

  const continueHandler = () => {
    setConfirmationModal(false);
    if (selectedSubModuleId)
      navigate(`/course/${subject.id}/${selectedSubModuleId}`);
  };

  const getDifficultyConfig = (difficulty) => {
    const configs = {
      easy: {
        color: "bg-green-500",
        text: "text-green-700",
        border: "border-green-200",
        icon: "🟢",
      },
      medium: {
        color: "bg-yellow-500",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: "🟡",
      },
      hard: {
        color: "bg-red-500",
        text: "text-red-700",
        border: "border-red-200",
        icon: "🔴",
      },
    };
    return configs[(difficulty || "").toLowerCase()] || configs.medium;
  };

  const handleChapterToggle = (subModuleId) => {
    setChapterSelection((prev) => ({
      ...prev,
      [subModuleId]: !prev[subModuleId],
    }));
  };

  const handleGenerateAutoQuiz = async () => {
    // 1. Collect selected IDs
    const selectedIds = Object.entries(chapterSelection)
      .filter(([id, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) {
      toast.error("Please select at least one chapter.");
      return;
    }

    // 2. Generate (Call Backend)
    const toastId = toast.loading("Generating your quiz...");
    try {
      // Use the REAL backend service, not the dummy generator
      const questions = await supabaseService.getAutoQuiz(selectedIds);
      console.log("Auto Quiz Questions:", questions);

      if (!questions || questions.length === 0) {
        toast.dismiss(toastId);
        toast.error("No questions available for the selected chapters.");
        return;
      }

      toast.dismiss(toastId);
      toast.success("Quiz generated successfully!");

      // 2.5 Generate Submodule ID -> Name Map
      const subModuleMap = {};
      const shouldShowModuleName = modules.length > 1;

      modules.forEach((m) => {
        if (Array.isArray(m.subModules)) {
          m.subModules.forEach((s) => {
            const chapterId =
              s.id ??
              s.subModuleId ??
              s.sub_module_id ??
              s.chapterId ??
              s.chapter_id;

            if (chapterId == null) return;

            subModuleMap[chapterId] = shouldShowModuleName
              ? `${s.name} (${m.name})`
              : s.name;
          });
        }
      });

      // 3. Close panel & Navigate
      setShowAutoQuizPanel(false);
      localStorage.removeItem("quiz_progress_auto-quiz");

      navigate(`/course/${subject.id}/auto-quiz`, {
        state: {
          isAutoQuiz: true, // 🔑 REQUIRED
          generatedQuestions: questions,
          subModuleMap: subModuleMap,
          subjectName: subject.name,
        },
      });
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Auto Quiz Error:", error);
      toast.error("Failed to generate quiz. Please try again.");
    }
  };
  const handleStartLearning = () => {
    if (!subject?.id) {
      toast.error("Missing subject information.");
      return;
    }

    navigate(`/learn/${subject.id}`, {
      state: {
        subjectName: subject.name,
      },
    });
  };
  const handleAutoQuizForSubmodule = async (subModuleId) => {
    const toastId = toast.loading("Generating auto quiz...");

    try {
      // 🔑 IMPORTANT: send ID in ARRAY
      const questions = await supabaseService.getAutoQuiz([subModuleId]);

      if (!Array.isArray(questions) || questions.length === 0) {
        toast.dismiss(toastId);
        toast.error("No questions available for this quiz.");
        return;
      }

      toast.dismiss(toastId);
      toast.success("Auto quiz generated!");
      localStorage.removeItem("quiz_progress_auto-quiz");

      navigate(`/course/${subject.id}/${subModuleId}`, {
        state: {
          isAutoQuiz: true, // 🔑 REQUIRED
          generatedQuestions: questions,
        },
      });
    } catch (err) {
      toast.dismiss(toastId);
      console.error("AUTO QUIZ ERROR:", err);
      toast.error("Failed to generate auto quiz.");
    }
  };

  if (loading) {
    return (
      <div
  className="min-h-screen flex items-center justify-center transition-colors duration-300"
  style={{
    backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
    backgroundSize: "28px 28px",
  }}
>
  <div className="text-center space-y-4">
    <div className="relative w-16 h-16 mx-auto">
      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
      <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
      <div className="absolute inset-2 rounded-full border-t-2 border-cyan-400 animate-spin"
        style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
    </div>
    <p className="text-sm font-medium tracking-wide transition-colors"
      style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
      Loading Course Detail..
    </p>
    <div className="flex items-center gap-1.5 justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0s" }} />
      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
    </div>
  </div>
</div>
    );
  }

  if (!subject || !modules) {
    return (
     <div
  className="min-h-screen pt-4 flex items-center justify-center transition-colors duration-300"
  style={{ backgroundColor: isDark ? "#0B0F19" : "#F0F4FF" }}
>
        <div className="text-center">
          <Brain size={64} className="mx-auto text-purple-400 mb-4" />
          <p className="text-gray-600 text-lg">Course not found</p>
        </div>
      </div>
    );
  }

   return (
  <div
    className="min-h-screen pt-4 pb-12 transition-colors duration-300"
    style={{
      backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
    }}
  >
      <div className="max-w-6xl mx-auto px-6">
        {/* Restart Confirmation Modal */}
        {confirmationModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
            <div
  className="p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
  style={{
    background: isDark ? "#111827" : "#FFFFFF",
    border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
    boxShadow: isDark
      ? "0 0 0 1px #1F2937, 0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.08)"
      : "0 25px 50px rgba(0,0,0,0.15)",
  }}
>
              <div className="text-center mb-6">
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw size={32} className="text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Restart Quiz ?
                </h3>
                <p className="text-gray-600">
                  You can now retake the quiz from the beginning.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmationModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={continueHandler}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Restart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto Quiz POPUP */}

        {showAutoQuizPanel && (
          <AutoQuizPanel
            setShowAutoQuizPanel={setShowAutoQuizPanel}
            subject={subject}
            completedChaptersCount={completedChaptersCount}
            totalChapters={totalChapters}
            autoQuizModules={autoQuizModules}
            IconComponent={IconComponent}
            setChapterSelection={setChapterSelection}
            chapterSelection={chapterSelection}
            attemptedList={attemptedList}
            handleGenerateAutoQuiz={handleGenerateAutoQuiz}
          />
        )}

        {/* Course Header */}
        <SubjectHeaderCard
          courseId={courseId}
          subject={subject}
          subjectConfig={subjectConfig}
          IconComponent={IconComponent}
          totalModules={totalModules}
          modules={modules}
          googleId={googleId}
          modulesPayloadForChart={modulesPayloadForChart}
          totalQuestionsBySubject={totalQuestionsBySubject}
          bySubjectMap={bySubjectMap}
        />

        {/* Auto Quiz button */}
        <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={handleStartLearning}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-emerald-500/30 hover:border-emerald-500/60 hover:scale-105 transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
          >
            Start Learning
          </button>

          <button
            onClick={() => {
              setAutoQuizModules(modules);
              setChapterSelection({});
              setShowAutoQuizPanel(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-indigo-500/30 hover:border-indigo-500/60 hover:scale-105 transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
          >
            ⚡ Auto Quiz
          </button>
        </div>

        <ModuleList
          modules={modules}
          attemptedList={attemptedList}
          signupData={signupData}
          subject={subject}
          analyticsCanonical={analyticsCanonical}
          setAutoQuizModule={setAutoQuizModule}
          setChapterSelection={setChapterSelection}
          setShowAutoQuizPanel={setShowAutoQuizPanel}
          handleDirectAutoQuizForChapter={handleDirectAutoQuizForChapter}
          startQuizHandler={(subModule) => {
            const chapterId =
              subModule.id ??
              subModule.subModuleId ??
              subModule.sub_module_id ??
              subModule.chapterId ??
              subModule.chapter_id;

            if (chapterId == null) {
              toast.error("Chapter ID missing");
              return;
            }

            navigate(`/course/${subject.id}/${chapterId}`);
          }}
          setSelectedSubModuleId={setSelectedSubModuleId}
          setConfirmationModal={setConfirmationModal}
          sortChaptersByNumber={sortChaptersByNumber}
          getDifficultyConfig={getDifficultyConfig}
          setAutoQuizModules={setAutoQuizModules}
          handleAutoQuizForSubmodule={handleAutoQuizForSubmodule}
        />
      </div>
    </div>
  );
};

export default CourseDetail;
