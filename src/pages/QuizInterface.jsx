
// src/pages/QuizInterface.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import QuizCompletionScreen from "./QuizCompletionScreen";
import TrueFalseQuestion from "../components/quiz/TrueFalseQuestion";
import FillBlanksQuestion from "../components/quiz/FillBlanksQuestion";
import MatchFollowingQuestion from "../components/quiz/MatchFollowingQuestion";
import { CheckCircle, XCircle, Circle, Lightbulb, X, GripVertical } from "lucide-react";
import { supabaseService } from "../services/supabaseService";
import MultiSelectQuestion from "../components/quiz/MultiSelectQuestion";
import { imageSupabase } from "../config/imageSupabase";
import confetti from "canvas-confetti";
import { playCorrectSound, playIncorrectSound } from "../utils/soundUtils";
import LatexRenderer from "../components/common/LatexRenderer";
import MarkdownRenderer from "../components/common/MarkdownRenderer";
import { useDispatch, useSelector } from "react-redux";
import {
  setSubjectData,
  setModulesData,
  setTotalModules,
  setSubmodule,
  setAnalytics
} from "../slices/viewCoursesSlice.jsx";
import VoiceExplanationPlayer from "../components/common/VoiceExplanationPlayer";
import MainContent from "../components/Quizinterface/maincontent.jsx";
import QuizHeader from "../components/Quizinterface/QuizHeader.jsx";
import { useTheme } from "../utils/useTheme";
import { supabase } from "../config/supabase";
import toast from "react-hot-toast";

const getStorageKey = (submoduleId) => `quiz_progress_${submoduleId}`;

const normalizeQuestionType = (type) => {
  if (!type) return "mcq";
  const t = String(type).toLowerCase();
  if (t === "mcq") return "mcq";
  if (t === "multi") return "multi";
  if (t === "blanks" || t === "fillblanks" || t === "fill_in_the_blanks") return "fillblanks";
  if (t === "truefalse" || t === "true_false") return "truefalse";
  if (t === "match" || t === "matchfollowing" || t === "match_the_following") return "matchfollowing";
  if (t === "math" || t === "numeric" || t === "short_answer") return "math";
  return t;
};

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const toStringArray = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string") {
    const splitByPipe = value.includes("|") ? value.split("|") : value.split(",");
    return splitByPipe.map((v) => v.trim()).filter(Boolean);
  }
  return [];
};

const normalizeMappings = (rawMappings) => {
  const parsed = parseMaybeJson(rawMappings);

  if (Array.isArray(parsed)) {
    if (parsed.every((m) => typeof m === "number" || (typeof m === "string" && m.trim() !== ""))) {
      return parsed
        .map((rightIndex, leftIndex) => ({ leftIndex, rightIndex: Number(rightIndex) }))
        .filter((m) => Number.isInteger(m.rightIndex));
    }

    return parsed
      .map((m) => ({
        leftIndex: Number(m?.leftIndex ?? m?.left_index),
        rightIndex: Number(m?.rightIndex ?? m?.right_index),
      }))
      .filter((m) => Number.isInteger(m.leftIndex) && Number.isInteger(m.rightIndex));
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed)
      .map(([leftIndex, rightIndex]) => ({ leftIndex: Number(leftIndex), rightIndex: Number(rightIndex) }))
      .filter((m) => Number.isInteger(m.leftIndex) && Number.isInteger(m.rightIndex));
  }

  return [];
};

const QuizInterface = () => {
  const { subjectId, submoduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { signupData } = useSelector((state) => state.auth);
  const googleId = signupData?.googleId;
  const dispatch = useDispatch();
  const { subject, modules, totalModules, submodule, analytics } = useSelector((s) => s.viewCourse || {});

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSubmodule, setCurrentSubmodule] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timer, setTimer] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [questionViolations, setQuestionViolations] = useState({});

  const [showAnimation, setShowAnimation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, attempted: 0, percent: 0 });
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userResponses, setUserResponses] = useState([]);
  const [answers, setAnswers] = useState({});

  const [showAttemptWarning, setShowAttemptWarning] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [revisionData, setRevisionData] = useState(null);

  const currentQuestion = data?.[currentQuestionIndex];
  const explanationSource = currentQuestion;
  const questionExplanation =
    explanationSource?.explanationQuestion ??
    explanationSource?.explanation_question ??
    explanationSource?.explanation ??
    null;
  const answerExplanation =
    explanationSource?.explanationAnswer ??
    explanationSource?.explanation_answer ??
    explanationSource?.explanation ??
    null;

  const [showanswer, setShowanswer] = useState(false);
  const [moduleData, setModuleData] = useState(null);
  const [embeddedPdfSrc, setEmbeddedPdfSrc] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [enlargedImageSrc, setEnlargedImageSrc] = useState(null);

  const containerRef = useRef(null);
  const questionScrollRef = useRef(null);
  const questionBtnRefs = useRef([]);
  const mainContentRef = useRef(null);
  const imageWrapperRef = useRef(null);

  const [violations, setViolations] = useState(0);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const isTabActive = useRef(true);
  const [isPaused, setIsPaused] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);

  const [showRevisionPanel, setShowRevisionPanel] = useState(false);
  const [showQuestionExplanationPanel, setShowQuestionExplanationPanel] = useState(false);
  const [showAnswerExplanationPanel, setShowAnswerExplanationPanel] = useState(false);
  const [showConceptPanel, setShowConceptPanel] = useState(false);

  const answersRef = useRef({});
  const userResponsesRef = useRef([]);
  const revisionRef = useRef(null);
  const STORAGE_KEY = getStorageKey(submoduleId);
  const isQuizSubmittedRef = useRef(false);
  const [finalAnswers, setFinalAnswers] = useState(null);
  const questionNavRef = useRef(null);

  // -------------------------
  // Persist refs helpers
  // -------------------------
  const setAnswersAndRef = (updater) => {
    setAnswers((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      answersRef.current = { ...next };
      return next;
    });
    if (typeof updater !== "function") {
      answersRef.current = { ...(updater || {}) };
      setAnswers(updater);
    }
  };

  const setUserResponsesAndRef = (updater) => {
    setUserResponses((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      userResponsesRef.current = Array.isArray(next) ? [...next] : next;
      return next;
    });
    if (typeof updater !== "function") {
      userResponsesRef.current = Array.isArray(updater) ? [...updater] : updater;
      setUserResponses(updater);
    }
  };

  // -------------------------
  // Security: anti-cheat listeners
  // -------------------------
  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const logViolation = (type) => {
  setViolations((prev) => prev + 1);
  setIsOverlayVisible(true);
  console.warn(`[SECURITY] ${type} detected.`);

  // ✅ Record violation against current question
  const activeQid = data?.[currentQuestionIndex]?._id;
  if (activeQid) {
    setQuestionViolations((prev) => ({
      ...prev,
      [activeQid]: [
        ...(prev[activeQid] || []),
        { type, timestamp: new Date().toISOString() },
      ],
    }));
  }
};

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("Right-click is disabled during the quiz.");
      logViolation("Right Click Attempted");
    };

    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (
        e.key === "F12" ||
        (isCmdOrCtrl && e.shiftKey && key === "i") ||
        (isCmdOrCtrl && e.altKey && (key === "i" || key === "j" || key === "u")) ||
        (isCmdOrCtrl && key === "u")
      ) {
        e.preventDefault();
        e.stopPropagation();
        toast.error("Developer tools are disabled.");
        logViolation("DevTools Attempt");
        return false;
      }
      if (isCmdOrCtrl && (key === 'c' || key === 'v' || key === 'a')) {
        e.preventDefault();
        toast.error("Copy/Paste/Select All is disabled!");
        logViolation(`Shortcut: ${isMac ? 'Cmd' : 'Ctrl'}+${key.toUpperCase()}`);
        return false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabActive.current = false;
        setViolations((v) => v + 1);
        toast.error("Warning: Tab switch detected! Timer paused.", { duration: 5000 });
        logViolation("Tab Switch / Window Minimized");
      } else {
        isTabActive.current = true;
        setViolations((v) => v + 1);
      }
    };

    const handleWindowBlur = () => {
      isTabActive.current = false;
      setIsOverlayVisible(true);
      setViolations(v => v + 1);
      logViolation("Lost Focus");
    };

    const handleWindowFocus = () => {
      isTabActive.current = true;
      setIsOverlayVisible(false);
      setViolations(v => v + 1);
    };

    window.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [signupData, submoduleId]);

  // -------------------------
  // Load data from backend
  // -------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let rawQuestions = [];

        if (
          location.state?.isAutoQuiz &&
          Array.isArray(location.state.generatedQuestions)
        ) {
          rawQuestions = location.state.generatedQuestions;
          console.log("⚡ AUTO QUIZ MODE:", rawQuestions.length);
        } else {
          const response = await supabaseService.getSubModuleWithQuestions(submoduleId);
          console.log("SUBMODULE WITH QUESTIONS RESPONSE:", response);

          if (!subject) {
            const { subject: subjData, modules: mods, totalModules: tModules } = await supabaseService.getCourseDetails(subjectId);
            const textbookName = mods.find(mod => mod.subModules?.some(sub => sub.id === submoduleId))?.name || "";
            const chapterName = mods.flatMap(mod => mod.subModules || []).find(sub => sub.id === submoduleId)?.name || "";
            const subjectName = subjData?.name || "";
            setModuleData({ subjectName, textbookName, chapterName });
          } else {
            const mods = modules.length ? modules : (response?.modules || []);
            const textbookName = mods.find(mod => mod.subModules?.some(sub => sub.id === submoduleId))?.name || "";
            const chapterName = mods.flatMap(mod => mod.subModules || []).find(sub => sub.id === submoduleId)?.name || "";
            const subjectName = subject?.name || "";
            setModuleData({ subjectName, textbookName, chapterName });
          }

          if (response?.submodule) setCurrentSubmodule(response.submodule);

          rawQuestions =
            (response?.submodule?.questions && response.submodule.questions.length > 0)
              ? response.submodule.questions
              : (response?.questions || []);
          console.log("▶ NORMAL QUIZ MODE:", rawQuestions.length);
        }

        const transformed = rawQuestions.map((q) => {
          const normalizedExplanation =
            q.explanation ?? q.explanation_answer ?? q.explanation_question ??
            q.explanation_text ?? q.solution_text ?? q.solution ?? null;

          const base = {
            ...q,
            _id: q.id ?? q._id,
            questionText: q.question_text ?? q.questionText ?? "",
            questionType: normalizeQuestionType(q.question_type ?? q.questionType),
            imageName: q.image_name ?? q.imageName ?? null,
            imageCaption: q.image_caption ?? q.imageCaption ?? null,
            passageText: q.passage_text ?? q.passageText ?? q.passage ?? null,
            passageTitle: q.passage_title ?? q.passageTitle ?? null,
            explanation: normalizedExplanation,
            explanationQuestion: q.explanation_question ?? q.explanationQuestion ?? null,
            explanationAnswer: q.explanation_answer ?? q.explanationAnswer ?? null,
            sourceTextbookUrl: q.source_textbook_url ?? q.pdf_url ?? q.reference_pdf_url ?? null,
            pageNumber: q.page_number !== undefined && q.page_number !== null ? Number(q.page_number) : null,
            showConcept: q.show_concept ?? q.showConcept ?? false,
          };

          const normalizeOption = (opt, qCorrectAnswer, idx, questionId) => {
            if (opt == null) return { _id: `${questionId}_${idx}`, optionText: "", isCorrect: false };
            if (typeof opt === "string" || typeof opt === "number") {
              const text = String(opt);
              return { _id: `${questionId}_${idx}`, optionText: text, isCorrect: qCorrectAnswer != null && String(qCorrectAnswer) === text };
            }
            if (typeof opt === "object") {
              const text = opt.optionText ?? opt.option_text ?? opt.text ?? opt.label ?? (opt.title ? String(opt.title) : null) ?? null;
              const explicitIsCorrect = typeof opt.isCorrect === "boolean" ? opt.isCorrect : typeof opt.correct === "boolean" ? opt.correct : null;
              let isCorrect = !!explicitIsCorrect;
              if (explicitIsCorrect === null && qCorrectAnswer != null && text != null) isCorrect = String(qCorrectAnswer) === String(text);
              return {
                _id: opt._id ?? `${questionId}_${idx}`,
                optionText: text ?? JSON.stringify(opt),
                isCorrect,
                optionImageId: opt.optionImageId ?? opt.option_image_id ?? opt.imageId ?? null,
                optionImageName: opt.optionImageName ?? opt.option_image_name ?? opt.image_name ?? null,
                optionImageCaption: opt.optionImageCaption ?? opt.option_image_caption ?? opt.imageCaption ?? null,
                rawOption: opt,
              };
            }
            return { _id: `${questionId}_${idx}`, optionText: String(opt), isCorrect: false };
          };

          if (
            q.question_type === "mcq" ||
            q.question_type === "mcq_with_option_images" ||
            q.question_type === "passage_mcq" ||
            q.question_type === "image_mcq"
          ) {
            const qCorrect = q.correct_answer_text ?? q.correct_answer ?? q.correctAnswer ?? null;
            const opts = (q.options || []).map((opt, i) => normalizeOption(opt, qCorrect, i, base._id));
            opts.forEach((o) => { if (typeof o.optionText === "object") o.optionText = String(o.optionText); });
            return { ...base, options: opts };
          }

          if (q.question_type === "truefalse") {
            const tfOptions = Array.isArray(q.options) ? q.options.map((o) => String(o)) : ["True", "False"];
            return { ...base, options: tfOptions, correctAnswer: q.correct_answer ?? q.correctAnswer ?? q.correct };
          }

          if (q.question_type === "fillblanks") return { ...base, blanks: q.blanks || q.answers || [] };

          if (base.questionType === "matchfollowing") {
            const parsedOptions = parseMaybeJson(q.options);
            const optionsObject =
              parsedOptions && !Array.isArray(parsedOptions) && typeof parsedOptions === "object"
                ? parsedOptions
                : null;

            let leftItems = toStringArray(
              q.left_items ?? q.leftItems ?? optionsObject?.leftItems ?? optionsObject?.left_items
            );
            let rightItems = toStringArray(
              q.right_items ?? q.rightItems ?? optionsObject?.rightItems ?? optionsObject?.right_items
            );

            let correctMappings = normalizeMappings(
              q.correct_mappings ??
              q.correctMappings ??
              q.correctMappingsIndices ??
              optionsObject?.correctMappings ??
              optionsObject?.correct_mappings
            );

            // Fallback: options can be an array of pair objects, e.g. [{ left, right }, ...].
            if ((!leftItems.length || !rightItems.length) && Array.isArray(parsedOptions)) {
              const pairs = parsedOptions
                .map((item) => {
                  if (!item || typeof item !== "object") return null;
                  const left = item.left ?? item.leftItem ?? item.left_item ?? item.columnA ?? item.a;
                  const right = item.right ?? item.rightItem ?? item.right_item ?? item.columnB ?? item.b;
                  if (left == null || right == null) return null;
                  return { left: String(left), right: String(right) };
                })
                .filter(Boolean);

              if (pairs.length) {
                leftItems = pairs.map((p) => p.left);
                rightItems = Array.from(new Set(pairs.map((p) => p.right)));
                correctMappings = pairs
                  .map((p, leftIndex) => ({ leftIndex, rightIndex: rightItems.indexOf(p.right) }))
                  .filter((m) => m.rightIndex >= 0);
              }
            }

            return {
              ...base,
              leftItems,
              rightItems,
              correctMappings,
            };
          }

          if (q.question_type === "multi") {
            const correctMulti = q.multi ?? q.correct_answer ?? q.correct_answer_text ?? q.metadata?.multi ?? [];
            return {
              ...base,
              questionType: "multi",
              options: (q.options || []).map((opt, i) => ({
                _id: opt._id ?? `${base._id}_${i}`,
                optionText: opt.optionText ?? opt.option_text ?? String(opt),
              })),
              multi: Array.isArray(correctMulti) ? correctMulti : [],
            };
          }

          return base;
        });

        setData(transformed);
      } catch (e) {
        console.error("Error loading quiz data", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [submoduleId]);

  // -------------------------
  // Load & save progress locally
  // -------------------------
  useEffect(() => {
    if (!data.length) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        setAnswersAndRef(parsed.answers || {});
        setUserResponsesAndRef(parsed.userResponses || []);
        setStats(parsed.stats || { correct: 0, incorrect: 0, attempted: 0, percent: 0 });
        setTimer(parsed.timer || 0);
        console.log("Restored quiz progress");
      }
    } catch (err) {
      console.error("Failed to restore progress", err);
    }
  }, [data.length, STORAGE_KEY]);

  useEffect(() => {
    if (!data.length) return;
    if (isQuizSubmittedRef.current) return;
    try {
      const progress = {
        currentQuestionIndex,
        answers: answersRef.current,
        userResponses: userResponsesRef.current,
        stats,
        timer,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  }, [currentQuestionIndex, stats, timer, data.length, answers, userResponses]);

  const clearSavedProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    answersRef.current = {};
    userResponsesRef.current = [];
    setAnswers({});
    setUserResponses([]);
  };

  // -------------------------
  // Timer
  // -------------------------
  useEffect(() => {
    let interval;
    if (isRunning && isTabActive.current) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
        setQuestionTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, violations, isOverlayVisible]);

  useEffect(() => {
    const btn = questionBtnRefs.current[currentQuestionIndex];
    if (btn) btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentQuestionIndex]);

  // -------------------------
  // markAttemptTypeIfNotSet
  // -------------------------
  const markAttemptTypeIfNotSet = (qid, type) => {
    const prev = answersRef.current[qid] || {};
    if (prev.attempt_type && prev.attempt_type !== "not-attempted") return;
    const updated = { ...prev, attempt_type: type };
    answersRef.current = { ...answersRef.current, [qid]: updated };
    setAnswers({ ...answersRef.current });
  };

  // -------------------------
  // checkAnswer
  // -------------------------
  const checkAnswer = (userAnswer, isCorrectFlag, qIndex) => {
    if (!data.length) return;
    const q = data[qIndex];
    if (!q) return;
    const qid = q._id;
    markAttemptTypeIfNotSet(qid, "quiz");
    const now = new Date().toISOString();
    const prevForThis = answersRef.current[qid] || {};
    const timeSpent = prevForThis.timeSpent ?? questionTimer ?? 0;

    const answerObj = {
      ...prevForThis,
      userAnswer,
      isCorrect: !!isCorrectFlag,
      attempted: true,
      answeredAt: now,
      timeSpent,
      notes: prevForThis.notes ?? "",
      importance: !!prevForThis.importance,
      report: !!prevForThis.report,
    };

    const nextAnswers = { ...answersRef.current, [qid]: answerObj };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    const prevResponses = userResponsesRef.current || [];
    const existingIndex = prevResponses.findIndex((r) => r.questionId === qid);
    const responseData = {
      questionId: qid,
      userAnswer,
      isCorrect: !!isCorrectFlag,
      attempted: true,
      timeSpent,
      notes: answerObj.notes,
      importance: answerObj.importance,
      timestamp: now,
    };

    let nextResponses;
    if (existingIndex > -1) {
      nextResponses = [...prevResponses];
      nextResponses[existingIndex] = { ...nextResponses[existingIndex], ...responseData };
    } else {
      nextResponses = [...prevResponses, responseData];
    }

    userResponsesRef.current = nextResponses;
    setUserResponses(nextResponses);

    if (!prevForThis.attempted) {
      setStats((s) => ({
        ...s,
        correct: s.correct + (isCorrectFlag ? 1 : 0),
        incorrect: s.incorrect + (isCorrectFlag ? 0 : 1),
        attempted: (s.attempted || 0) + 1,
      }));
    }

    setIsCorrect(!!isCorrectFlag);

    if (isCorrectFlag) {
      playCorrectSound();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      playIncorrectSound();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1400);
  };

  // -------------------------
  // saveResponse
  // -------------------------
  const saveResponse = (index = currentQuestionIndex, timeSpent = questionTimer) => {
    if (!data.length) return;
    const q = data[index];
    if (!q) return;
    const qid = q._id;
    const prev = answersRef.current[qid] || {};
    const now = new Date().toISOString();

    const merged = {
      ...prev,
      userAnswer: prev.userAnswer ?? null,
      isCorrect: prev.isCorrect ?? false,
      attempted: !!prev.attempted,
      answeredAt: prev.answeredAt ?? now,
      timeSpent,
      notes: prev.notes ?? "",
      importance: !!prev.importance,
      is_revision: !!prev.is_revision,
      attempt_type: prev.attempt_type ?? "not-attempted",
      is_concept: !!prev.is_concept,
      is_questionExplanation: !!prev.is_questionExplanation,
      is_showAnswer: !!prev.is_showAnswer,
      report: !!prev.report,
      badQuestion: !!prev.report,
      importantQuestion: !!prev.importance,
    };

    answersRef.current = { ...answersRef.current, [qid]: merged };
    setAnswers({ ...answersRef.current });

    const prevResponses = userResponsesRef.current || [];
    const existingIndex = prevResponses.findIndex((r) => r.questionId === qid);
    const responseData = {
      questionId: qid,
      userAnswer: merged.userAnswer,
      isCorrect: !!merged.isCorrect,
      attempted: !!merged.attempted,
      timeSpent: merged.timeSpent,
      notes: merged.notes,
      importance: merged.importance,
      report: merged.report,
      badQuestion: merged.badQuestion,
      importantQuestion: merged.importantQuestion,
      timestamp: now,
    };

    let nextResponses;
    if (existingIndex > -1) {
      nextResponses = [...prevResponses];
      nextResponses[existingIndex] = { ...nextResponses[existingIndex], ...responseData };
    } else {
      nextResponses = [...prevResponses, responseData];
    }
    userResponsesRef.current = nextResponses;
    setUserResponses(nextResponses);
  };

  // -------------------------
  // MCQ select
  // -------------------------
  const handleOptionSelect = (optionId) => {
    const q = data[currentQuestionIndex];
    if (!q) return;
    if (q.questionType === "multi") return;
    const selected = q.options?.find((o) => o._id === optionId);
    const correct = !!selected?.isCorrect;
    setSelectedOption(optionId);
    checkAnswer(optionId, correct, currentQuestionIndex);
  };

  const handleQuestionAnswer = (userAnswer, isCorrectFlag) => {
    checkAnswer(userAnswer, isCorrectFlag, currentQuestionIndex);
  };

  // -------------------------
  // Navigation
  // -------------------------
  const handleNext = () => {
    if (currentQuestionIndex < data.length - 1) {
      saveResponse();
      setSelectedOption(null);
      setIsCorrect(null);
      setQuestionTimer(0);
      setCurrentQuestionIndex((i) => i + 1);
      const nextQ = data[currentQuestionIndex + 1];
      if (nextQ) {
        const saved = answersRef.current[nextQ._id];
        setSelectedOption(saved?.userAnswer ?? null);
        setIsCorrect(saved?.isCorrect ?? null);
      }
      setShowQuestionExplanationPanel(false);
      setShowAnswerExplanationPanel(false);
      setShowConceptPanel(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      saveResponse();
      setSelectedOption(null);
      setIsCorrect(null);
      setQuestionTimer(0);
      setCurrentQuestionIndex((i) => i - 1);
      const prevQ = data[currentQuestionIndex - 1];
      if (prevQ) {
        const saved = answersRef.current[prevQ._id];
        setSelectedOption(saved?.userAnswer ?? null);
        setIsCorrect(saved?.isCorrect ?? null);
      }
      setShowQuestionExplanationPanel(false);
      setShowAnswerExplanationPanel(false);
      setShowConceptPanel(false);
    }
  };

  // -------------------------
  // Attempted count
  // -------------------------
  const attemptedCount = (data || []).reduce((acc, q) => {
    const a = answersRef.current[q._id];
    const r = (userResponsesRef.current || []).find((x) => x.questionId === q._id) || {};
    const attempted = !!(a?.attempted ?? r?.attempted);
    return acc + (attempted ? 1 : 0);
  }, 0);

  const allAttempted = data.length > 0 && attemptedCount === data.length;

  const buildLocalHistoryEntry = () => {
    const normalizeOptionText = (opt) => {
      if (typeof opt === "string" || typeof opt === "number") return String(opt);
      if (opt && typeof opt === "object") {
        return String(opt.optionText ?? opt.option_text ?? opt.text ?? opt.label ?? "");
      }
      return "";
    };

    const toAnswerText = (q, userAnswer) => {
      if (userAnswer == null) return "";

      if (q.questionType === "mcq") {
        const selected = (Array.isArray(q.options) ? q.options : []).find((o) => o?._id === userAnswer);
        return selected?.optionText ?? String(userAnswer);
      }

      if (q.questionType === "truefalse") {
        if (typeof userAnswer === "boolean") return userAnswer ? "True" : "False";
        return String(userAnswer);
      }

      if (typeof userAnswer === "object") {
        try {
          return JSON.stringify(userAnswer);
        } catch {
          return String(userAnswer);
        }
      }

      return String(userAnswer);
    };

    const toCorrectAnswer = (q) => {
      if (q.questionType === "mcq") {
        const correctOpt = (Array.isArray(q.options) ? q.options : []).find((o) => o?.isCorrect);
        return correctOpt?.optionText ?? q.correctAnswer ?? q.correct_answer_text ?? q.correct_answer ?? "Refer to explanation";
      }

      if (q.questionType === "truefalse") {
        const tf = q.correctAnswer ?? q.correct_answer;
        if (typeof tf === "boolean") return tf ? "True" : "False";
        return tf ?? "Refer to explanation";
      }

      if (q.questionType === "fillblanks") {
        const blanks = Array.isArray(q.blanks) ? q.blanks : [];
        return blanks.length ? blanks.join(", ") : "Refer to explanation";
      }

      if (q.questionType === "matchfollowing") {
        return "Match the correct pairs";
      }

      if (q.questionType === "multi") {
        return Array.isArray(q.multi) && q.multi.length ? q.multi.join(", ") : "Refer to explanation";
      }

      return q.correctAnswer ?? q.correct_answer_text ?? q.correct_answer ?? "Refer to explanation";
    };

    const questions = data.map((q, idx) => {
      const a = answersRef.current[q._id] || {};
      return {
        id: q._id ?? `${idx}`,
        question: q.questionText ?? q.question_text ?? `Question ${idx + 1}`,
        options: (Array.isArray(q.options) ? q.options : []).map(normalizeOptionText).filter(Boolean),
        correctAnswer: toCorrectAnswer(q),
        answerExplanation: q.explanationAnswer ?? q.explanation_answer ?? q.explanation ?? "",
        questionExplanation: q.explanationQuestion ?? q.explanation_question ?? "",
        attempted: !!a.attempted,
        isCorrect: !!a.isCorrect,
        important: !!a.importance,
        note: a.notes ?? "",
        userAnswer: toAnswerText(q, a.userAnswer),
      };
    });

    return {
      id: `local-${Date.now()}`,
      title: currentSubmodule?.name || moduleData?.chapterName || "Latest Quiz",
      date: new Date().toISOString(),
      questions,
    };
  };

  const persistLocalHistoryEntry = (entry) => {
    if (!entry) return;
    try {
      const key = "quizHistoryLocalEntries";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const list = Array.isArray(existing) ? existing : [];
      const next = [entry, ...list].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(next));

      // Backward compatibility for older readers.
      localStorage.setItem("lastQuizHistoryEntry", JSON.stringify(entry));
    } catch (e) {
      console.warn("Failed to persist local quiz history entry", e);
    }
  };

  // -------------------------
  // handleForceSubmit — bypasses allAttempted check (used by violations auto-submit)
  // -------------------------
  const handleForceSubmit = async () => {
    try {
      saveResponse();
      const questionAnswers = data.map((q) => {
        const a = answersRef.current[q._id] || {};
        return {
          questionId: q._id,
          userAnswer: a.userAnswer ?? null,
          isCorrect: !!a.isCorrect,
          attempted: !!a.attempted,
          is_revision: !!a.is_revision,
          attempt_type: a.attempt_type ?? "not-attempted",
          is_concept: !!a.is_concept,
          is_questionExplanation: !!a.is_questionExplanation,
          is_showAnswer: !!a.is_showAnswer,
          badQuestion: !!a.report,
          timeSpent: a.timeSpent ?? 0,
          notes: a.notes ?? "",
          importantQuestion: !!a.importance,
            violations: questionViolations[q._id] || [],
        };
      });

      isQuizSubmittedRef.current = true;
      const attempted = questionAnswers.filter((q) => q.attempted).length;
      const correct = questionAnswers.filter((q) => q.isCorrect).length;
      const incorrect = questionAnswers.filter((q) => !q.isCorrect).length;
      const percent = Math.round((correct / (data.length || 1)) * 100);

      setStats({ correct, incorrect, attempted, percent });

      const analyticsData = {
        subjectId,
        googleId,
        submoduleId,
        questionAnswers,
        totalTimeSpent: timer,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        summary: {
          correct,
          attempted,
          total: data.length,
          percent,
          violations,
          autoSubmitted: true,
          finishedAt: new Date().toISOString(),
        },
      };

      setIsRunning(false);
      localStorage.setItem("lastQuizQuestionAnswers", JSON.stringify(questionAnswers));
      persistLocalHistoryEntry(buildLocalHistoryEntry());
      localStorage.removeItem(STORAGE_KEY);
      await supabaseService.submitAnalytics(analyticsData);
      setFinalAnswers({ ...answersRef.current });
      setIsQuizCompleted(true);
    } catch (err) {
      console.error("Force submit error", err);
    }
  };

  // -------------------------
  // Violations watcher — warning at 3, auto-submit at 5
  // -------------------------
useEffect(() => {
  if (violations === 3) {
    toast.error("⚠️ Warning: Suspicious activity detected.", { duration: 4000 });
  }
  if (violations === 5) {
    toast.error("🚨 Multiple violations recorded. This will be reviewed.", { duration: 5000 });
  }
}, [violations]);

  // -------------------------
  // handleQuizSubmit — normal submit (requires all attempted)
  // -------------------------
  const handleQuizSubmit = async () => {
    try {
      if (!allAttempted) {
        setShowAttemptWarning(true);
        setTimeout(() => setShowAttemptWarning(false), 2400);
        return;
      }
      saveResponse();
      const questionAnswers = data.map((q) => {
        const a = answersRef.current[q._id] || {};
        return {
          questionId: q._id,
          userAnswer: a.userAnswer ?? null,
          isCorrect: !!a.isCorrect,
          attempted: !!a.attempted,
          is_revision: !!a.is_revision,
          attempt_type: a.attempt_type ?? "not-attempted",
          is_concept: !!a.is_concept,
          is_questionExplanation: !!a.is_questionExplanation,
          is_showAnswer: !!a.is_showAnswer,
          badQuestion: !!a.report,
          timeSpent: a.timeSpent ?? 0,
          notes: a.notes ?? "",
          importantQuestion: !!a.importance,
        };
      });

      isQuizSubmittedRef.current = true;
      const attempted = questionAnswers.filter((q) => q.attempted).length;
      const correct = questionAnswers.filter((q) => q.isCorrect).length;
      const incorrect = questionAnswers.filter((q) => !q.isCorrect).length;
      const percent = Math.round((correct / (data.length || 1)) * 100);
      setStats({ correct, incorrect, attempted, percent });

      const analyticsData = {
        subjectId,
        googleId,
        submoduleId,
        questionAnswers,
        totalTimeSpent: timer,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        summary: {
          correct,
          attempted,
          total: data.length,
          percent,
          violations,
          finishedAt: new Date().toISOString(),
        },
      };

      setIsSubmitting(true);
      setIsRunning(false);
      localStorage.setItem("lastQuizQuestionAnswers", JSON.stringify(questionAnswers));
      persistLocalHistoryEntry(buildLocalHistoryEntry());
      localStorage.removeItem(STORAGE_KEY);
      console.log("Submitting analytics data:", analyticsData);
      await supabaseService.submitAnalytics(analyticsData);
      setFinalAnswers({ ...answersRef.current });
      setIsQuizCompleted(true);
    } catch (err) {
      console.error("Submit error", err);
      alert("Failed to submit quiz. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    clearSavedProgress();
    navigate("/analytics");
  };

  // -------------------------
  // Render guards
  // -------------------------
  if (isLoading || !data.length) {
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
            Loading Quiz...
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

  if (isQuizCompleted) {
    return (
      <QuizCompletionScreen
        quizStats={stats}
        totalTime={timer}
        questions={data}
        userAnswers={finalAnswers}
        onExit={handleExit}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F19]">
        <div className="p-6 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <XCircle size={24} className="text-red-400" />
          </div>
          <p className="text-[#E5E7EB] font-bold">Error loading question</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
          >
            Reload Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQid = currentQuestion._id;
  const savedAnswer = answersRef.current[currentQid] || {};
  const currentNotes = savedAnswer.notes ?? "";
  const importance = savedAnswer.importance ?? null;
  const isAnswered = !!savedAnswer.attempted;

  // -------------------------
  // Render
  // -------------------------
  return (
    <>
      {/* ============================================================
          SECURITY OVERLAY — sibling to quiz content, never a child.
          z-index 99999 floats it above everything.
          backdrop-filter gives Mac glass effect on the background.
          The modal box itself has filter:none — stays razor sharp.
      ============================================================ */}
      {isOverlayVisible && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            className="text-center space-y-5 rounded-3xl border p-10 shadow-2xl"
            style={{
              backgroundColor: isDark ? "#111827" : "#FFFFFF",
              borderColor: isDark ? "rgba(99,102,241,0.45)" : "rgba(99,102,241,0.2)",
              maxWidth: 400,
              width: "90vw",
              filter: "none",
            }}
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <span className="text-4xl">🔒</span>
            </div>

            <h2
              className="text-2xl font-bold"
              style={{ color: isDark ? "#F3F4F6" : "#111827" }}
            >
              Quiz Paused
            </h2>

            <p
              className="text-sm leading-relaxed"
              style={{ color: isDark ? "#9CA3AF" : "#4B5563" }}
            >
              You moved away from the secure quiz window.
              <br />
              <span className="font-bold text-indigo-500">Timer is currently frozen.</span>
            </p>

            <div className="text-xs font-mono py-2 px-4 bg-black/20 rounded-lg text-indigo-400">
              Return to this tab to resume
            </div>

            <p className="text-xs" style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}>
              Violation #{violations} recorded
            </p>

            <button
              onClick={() => {
                setIsOverlayVisible(false);
                isTabActive.current = true;
              }}
              className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white w-full"
              style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
            >
              Resume Quiz →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          QUIZ CONTENT — blur applied here only.
          Overlay above is a sibling so it is never blurred.
      ============================================================ */}
      <div
        className="min-h-screen px-4 md:px-10 lg:px-20 py-8 relative transition-colors duration-300"
        onContextMenu={(e) => e.preventDefault()}
        style={{
          backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
          backgroundSize: "28px 28px",
          userSelect: "none",
          WebkitUserSelect: "none",
          filter: isOverlayVisible ? "blur(20px)" : "none",
          opacity: isOverlayVisible ? 0.4 : 1,
          pointerEvents: isOverlayVisible ? "none" : "auto",
          transition: "filter 0.2s ease, opacity 0.2s ease",
        }}
      >
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-b from-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Answer feedback toast */}
        {showAnimation && (
          <div
            className="text-white px-5 py-4 rounded-2xl flex items-center gap-3 border"
            style={{
              background: "linear-gradient(135deg, rgba(17,24,39,0.95), rgba(17,24,39,0.95))",
              borderColor: isCorrect ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
              backdropFilter: "blur(12px)",
              boxShadow: isCorrect
                ? "0 0 32px rgba(34,197,94,0.2), 0 8px 32px rgba(0,0,0,0.5)"
                : "0 0 32px rgba(239,68,68,0.2), 0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCorrect
                  ? "bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-red-500/20 border border-red-500/30"
              }`}
            >
              {isCorrect
                ? <CheckCircle size={20} className="text-emerald-400" />
                : <XCircle size={20} className="text-red-400" />
              }
            </div>
            <div>
              <div className={`font-bold text-sm ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                {isCorrect ? "Correct!" : "Incorrect!"}
              </div>
              <div className="text-xs text-[#9CA3AF]">
                {isCorrect ? "Great job, keep going!" : "Don't worry, try again!"}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <QuizHeader
            data={data}
            userResponsesRef={userResponsesRef}
            answersRef={answersRef}
            setShowConceptPanel={setShowConceptPanel}
            setIsCorrect={setIsCorrect}
            setQuestionTimer={setQuestionTimer}
            setShowAnswerExplanationPanel={setShowAnswerExplanationPanel}
            setShowQuestionExplanationPanel={setShowQuestionExplanationPanel}
            setSelectedOption={setSelectedOption}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            currentQuestionIndex={currentQuestionIndex}
            timer={timer}
            questionBtnRefs={questionBtnRefs}
            questionScrollRef={questionScrollRef}
            saveResponse={saveResponse}
          />

          <MainContent
            isDark={isDark}
            mainContentRef={mainContentRef}
            showConceptPanel={showConceptPanel}
            moduleData={moduleData}
            isShaking={isShaking}
            savedAnswer={savedAnswer}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            data={data}
            setEnlargedImageSrc={setEnlargedImageSrc}
            containerRef={containerRef}
            imageWrapperRef={imageWrapperRef}
            showQuestionExplanationPanel={showQuestionExplanationPanel}
            answersRef={answersRef}
            selectedOption={selectedOption}
            isCorrect={isCorrect}
            handleOptionSelect={handleOptionSelect}
            currentQid={currentQid}
            setAnswers={setAnswers}
            handlePrevious={handlePrevious}
            handleNext={handleNext}
            showAttemptWarning={showAttemptWarning}
            attemptedCount={attemptedCount}
            revisionRef={revisionRef}
            showRevisionPanel={showRevisionPanel}
            showAnswerExplanationPanel={showAnswerExplanationPanel}
            revisionData={revisionData}
            embeddedPdfSrc={embeddedPdfSrc}
            currentSubmodule={currentSubmodule}
            setShowConceptPanel={setShowConceptPanel}
            handleQuestionAnswer={handleQuestionAnswer}
            handleQuizSubmit={handleQuizSubmit}
            isQuizCompleted={isQuizCompleted}
            isSubmitting={isSubmitting}
            setShowAnswerExplanationPanel={setShowAnswerExplanationPanel}
            setShowQuestionExplanationPanel={setShowQuestionExplanationPanel}
            setEmbeddedPdfSrc={setEmbeddedPdfSrc}
            setRevisionData={setRevisionData}
            setShowanswer={setShowanswer}
            markAttemptTypeIfNotSet={markAttemptTypeIfNotSet}
          />
        </div>

        {/* Enlarged Image Modal */}
        {enlargedImageSrc && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setEnlargedImageSrc(null)}
          >
            <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
              <button
                className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
                onClick={() => setEnlargedImageSrc(null)}
              >
                <X size={32} />
              </button>
              <img
                src={enlargedImageSrc}
                alt="Enlarged view"
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuizInterface;