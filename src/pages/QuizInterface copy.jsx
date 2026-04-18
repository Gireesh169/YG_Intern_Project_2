// src/pages/QuizInterface.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import QuizCompletionScreen from "./QuizCompletionScreen";
import TrueFalseQuestion from "../components/quiz/TrueFalseQuestion";
import FillBlanksQuestion from "../components/quiz/FillBlanksQuestion";
import MatchFollowingQuestion from "../components/quiz/MatchFollowingQuestion";
import { CheckCircle, XCircle, Circle } from "lucide-react";
import { supabaseService } from "../services/supabaseService";
import MultiSelectQuestion from "../components/quiz/MultiSelectQuestion";
import { imageSupabase } from "../config/imageSupabase";
import confetti from "canvas-confetti";
import { playCorrectSound, playIncorrectSound } from "../utils/soundUtils";
import LatexRenderer from "../components/common/LatexRenderer";
import VoiceExplanationPlayer from "../components/common/VoiceExplanationPlayer";


const getStorageKey = (submoduleId) => `quiz_progress_${submoduleId}`;

// ---- Question type normalizer (IMPORTANT) ----
const normalizeQuestionType = (type) => {
  if (!type) return "mcq";

  const t = String(type).toLowerCase();

  if (t === "mcq") return "mcq";
  if (t === "multi") return "multi";
  if (t === "blanks" || t === "fillblanks" || t === "fill_in_the_blanks") return "fillblanks";
  if (t === "truefalse" || t === "true_false") return "truefalse";
  if (t === "match" || t === "matchfollowing" || t === "match_the_following") return "matchfollowing";
  if (t === "math" || t === "numeric" || t === "short_answer") return "math";

  return t; // fallback → will show unsupported if truly unknown
};


const buildPublicImageUrl = (imagePath) => {
  if (!imagePath) return null;

  const { data } = imageSupabase
    .storage
    .from("question-assets")
    .getPublicUrl(imagePath);

  return data?.publicUrl || null;
};




const QuizInterface = () => {
  const { subModule_id, subjectId } = useParams();
  const submoduleId = subModule_id;
  const navigate = useNavigate();
  const { signupData } = useSelector((state) => state.auth);
  const googleId = signupData?.googleId;
  // -------------------------
  // Importance (⭐ / 👎) — per question
  // -------------------------



  // UI state
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timer, setTimer] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const [showAnimation, setShowAnimation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, attempted: 0, percent: 0 });
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userResponses, setUserResponses] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showAttemptWarning, setShowAttemptWarning] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // --- NEW state ---
  const [embeddedPdfSrc, setEmbeddedPdfSrc] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  // Resizable Passage State
  const [passageWidth, setPassageWidth] = useState(38); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);



  // Revision panel (horizontal column below question)
  const [showRevisionPanel, setShowRevisionPanel] = useState(false);

  // Refs
  const answersRef = useRef({});
  const userResponsesRef = useRef([]);
  const revisionRef = useRef(null);
  const STORAGE_KEY = getStorageKey(submoduleId);

  // Persist refs helper (keeps logic identical to your original)
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
  // Load data from backend
  // -------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await supabaseService.getSubModuleWithQuestions(submoduleId);
        const rawQuestions = response?.submodule?.questions || [];
        console.group("🟣 FULL RAW QUESTIONS FROM BACKEND");
        rawQuestions.forEach((q, i) => {
          console.log(`Q${i + 1}`, q);
        });
        console.groupEnd();
        console.log("BACKEND RAW page_number CHECK:", rawQuestions.map(q => ({
          id: q.id,
          page_number: q.page_number,
          source_textbook_url: q.source_textbook_url
        })));

        const transformed = rawQuestions.map((q) => {
          const base = {
            _id: q.id ?? q._id,

            questionText: q.question_text ?? q.questionText ?? "",
            questionType: normalizeQuestionType(q.question_type),

            imageName: q.image_name ?? null,
            imageCaption: q.image_caption ?? null,

            // ✅ PASSAGE SUPPORT (FIX)
            passageText:
              q.passage_text ??
              q.passageText ??
              q.passage ??
              null,

            passageTitle:
              q.passage_title ??
              q.passageTitle ??
              null,


            // ✅ explanation
            explanation:
              q.explanation ??
              q.solution_text ??
              q.solution ??
              null,

            // ✅ PDF URL
            sourceTextbookUrl:
              q.source_textbook_url ??
              q.pdf_url ??
              q.reference_pdf_url ??
              null,

            // ✅ PAGE NUMBER (THIS FIXES YOUR ISSUE)
            pageNumber:
              q.page_number !== undefined && q.page_number !== null
                ? Number(q.page_number)
                : null,

            // keep everything else if needed
            ...q,
          };


          // helper to normalize a single option (handles string or object)
          const normalizeOption = (opt, qCorrectAnswer, idx) => {
            if (opt == null) {
              return { _id: `${base._id}_${idx}`, optionText: "", isCorrect: false };
            }

            // If option is a primitive (string / number), coerce to string
            if (typeof opt === "string" || typeof opt === "number") {
              const text = String(opt);
              const isCorrect =
                // check explicit correct field on question first (could be string)
                (typeof qCorrectAnswer !== "undefined" && qCorrectAnswer != null && String(qCorrectAnswer) === text) ||
                false;
              return { _id: `${base._id}_${idx}`, optionText: text, isCorrect };
            }

            // If option is an object, attempt to pull known keys
            if (typeof opt === "object") {
              const text =
                opt.optionText ??
                opt.option_text ??
                opt.text ??
                opt.label ??
                (opt.title ? String(opt.title) : null) ??
                null;

              const explicitIsCorrect =
                typeof opt.isCorrect === "boolean"
                  ? opt.isCorrect
                  : typeof opt.correct === "boolean"
                    ? opt.correct
                    : null;

              // Determine correctness: prefer explicit flag, else compare by text against question's known correct field(s)
              let isCorrect = !!explicitIsCorrect;
              if (explicitIsCorrect === null) {
                const candidateCorrect =
                  q.correct_answer_text ?? q.correct_answer ?? q.correctAnswer ?? q.correct_option_text ?? null;
                if (candidateCorrect != null && text != null) {
                  isCorrect = String(candidateCorrect) === String(text);
                } else {
                  isCorrect = false;
                }
              }

              // preserve option image metadata if present
              const optionImageId = opt.optionImageId ?? opt.option_image_id ?? opt.imageId ?? null;
              const optionImageName =
                opt.optionImageName ??
                opt.option_image_name ??
                opt.image_name ??
                null;

              const optionImageCaption = opt.optionImageCaption ?? opt.option_image_caption ?? opt.imageCaption ?? null;

              return {
                _id: opt._id ?? `${base._id}_${idx}`,
                optionText: text ?? JSON.stringify(opt),
                isCorrect,
                optionImageId,
                optionImageName,       // ✅ STORE NAME
                optionImageCaption,
                rawOption: opt,
              };
            }

            // fallback: stringify unexpected shapes
            return { _id: `${base._id}_${idx}`, optionText: String(opt), isCorrect: false };
          };

          // MCQ (and MCQ-like types where options exist)
          // ✅ MCQ ONLY (explicit)
          if (
            q.question_type === "mcq" ||
            q.question_type === "mcq_with_option_images" ||
            q.question_type === "passage_mcq" ||
            q.question_type === "image_mcq"
          ) {

            const qCorrect = q.correct_answer_text ?? q.correct_answer ?? q.correctAnswer ?? null;
            const opts = (q.options || []).map((opt, i) => normalizeOption(opt, qCorrect, i));
            // Defensive check: if any option ended up with optionText as object, warn
            opts.forEach((o) => {
              if (typeof o.optionText === "object") {
                console.warn(`[QuizInterface] normalized option has non-string optionText for question ${base._id}`, o);
                o.optionText = String(o.optionText);
              }
            });
            return { ...base, options: opts };
          }

          // True/False
          if (q.question_type === "truefalse") {
            // ensure options are strings
            const tfOptions = Array.isArray(q.options) ? q.options.map((o) => String(o)) : ["True", "False"];
            return { ...base, options: tfOptions, correctAnswer: q.correct_answer ?? q.correctAnswer ?? q.correct };
          }

          // Fill in the blanks
          if (q.question_type === "fillblanks") {
            return { ...base, blanks: q.blanks || q.answers || [] };
          }

          // Match the following
          if (q.question_type === "matchfollowing" || q.question_type === "match_the_following") {
            return {
              ...base,
              leftItems: q.left_items || q.leftItems || [],
              rightItems: q.right_items || q.rightItems || [],
              correctMappings: q.correct_mappings || q.correctMappings || q.correctMappingsIndices || [],
            };
          }
          // ✅ MULTI — DO NOT AUTO-EVALUATE
          if (q.question_type === "multi") {
            const correctMulti =
              q.multi ??
              q.correct_answer ??
              q.correct_answer_text ??
              q.metadata?.multi ??
              [];

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



          // passage_multi, image_passage etc. just return base
          return base;
        });

        console.log(
          "PASSAGE CHECK FINAL:",
          transformed.map(q => ({
            id: q._id,
            passage: q.passageText
          }))
        );


        setData(transformed);
        console.group("🟢 TRANSFORMED QUESTIONS (FRONTEND)");
        transformed.forEach((q, i) => {
          console.log(`Q${i + 1}`, {
            id: q._id,
            passageText: q.passageText,
            passageTitle: q.passageTitle,
            questionType: q.questionType,
          });
        });
        console.groupEnd();

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
  }, [currentQuestionIndex, stats, timer, data.length]);


  const clearSavedProgress = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      answersRef.current = {};
      userResponsesRef.current = [];
      setAnswers({});
      setUserResponses([]);
    } catch (e) {
      console.error("Clear saved progress error", e);
    }
  };

  // -------------------------
  // Resizing Logic
  // -------------------------
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth =
          ((mouseMoveEvent.clientX - containerRect.left) / containerRect.width) * 100;
        // Limit width between 20% and 70%
        if (newWidth > 20 && newWidth < 70) {
          setPassageWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // -------------------------
  // Timer
  // -------------------------
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
        setQuestionTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  };

  // -------------------------
  // Core: checkAnswer & saveResponse (atomic, updates refs immediately)
  // -------------------------
  const checkAnswer = (userAnswer, isCorrectFlag, qIndex) => {
    if (!data.length) return;
    const q = data[qIndex];
    if (!q) return;
    const qid = q._id;

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
      report: !!prevForThis.report,        // ✅ ADD
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

    // 🎉 Celebration or ❌ Shake
    if (isCorrectFlag) {
      playCorrectSound(); // 🔊 Sound
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      playIncorrectSound(); // 🔊 Sound
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1400);
  };

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
      report: !!prev.report,               // ✅ ADD
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
  // MCQ select wrapper
  // -------------------------
  const handleOptionSelect = (optionId) => {
    const q = data[currentQuestionIndex];
    if (!q) return;

    // ✅ HARD BLOCK
    if (q.questionType === "multi") return;

    const selected = q.options?.find((o) => o._id === optionId);
    const correct = !!selected?.isCorrect;

    setSelectedOption(optionId);
    checkAnswer(optionId, correct, currentQuestionIndex);
  };


  // -------------------------
  // MULTI submit handler
  // -------------------------



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
      // ✅ ADD THIS
      setIsCorrect(null);
      setQuestionTimer(0);
      setCurrentQuestionIndex((i) => i + 1);
      const nextQ = data[currentQuestionIndex + 1];
      if (nextQ) {
        const saved = answersRef.current[nextQ._id];
        setSelectedOption(saved?.userAnswer ?? null);
        setIsCorrect(saved?.isCorrect ?? null);
      }
      // when changing question, hide revision panel by default (optional)
      setShowRevisionPanel(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      saveResponse();
      setSelectedOption(null);
      // ✅ ADD THIS
      setIsCorrect(null);
      setQuestionTimer(0);
      setCurrentQuestionIndex((i) => i - 1);
      const prevQ = data[currentQuestionIndex - 1];
      if (prevQ) {
        const saved = answersRef.current[prevQ._id];
        setSelectedOption(saved?.userAnswer ?? null);
        setIsCorrect(saved?.isCorrect ?? null);
      }
      setShowRevisionPanel(false);
    }
  };

  // -------------------------
  // Sidebar / status
  // -------------------------
  const getQuestionStatus = (index) => {
    const q = data[index];
    if (!q) return "not-visited";

    const qid = q._id;
    const ans = answersRef.current[qid] || {};
    const resp =
      (userResponsesRef.current || []).find((r) => r.questionId === qid) || {};

    const attempted = ans.attempted ?? resp.attempted ?? false;
    const correct = ans.isCorrect ?? resp.isCorrect;

    if (attempted) {
      return correct === false ? "incorrect" : "answered";
    }

    return "not-visited";
  };



  const attemptedCount = (data || []).reduce((acc, q) => {
    const a = answersRef.current[q._id];
    const r = (userResponsesRef.current || []).find((x) => x.questionId === q._id) || {};
    const attempted = !!(a?.attempted ?? r?.attempted);
    return acc + (attempted ? 1 : 0);
  }, 0);

  const allAttempted = data.length > 0 && attemptedCount === data.length;

  // -------------------------
  // Submit
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
          report: !!a.report,        // ✅ ADD (backend ignores for now)
          timeSpent: a.timeSpent ?? 0,
          notes: a.notes ?? "",
          importance: !!a.importance,
        };

      });

      const attempted = questionAnswers.filter((q) => q.attempted).length;
      const correct = questionAnswers.filter((q) => q.isCorrect).length;
      const percent = Math.round((correct / (data.length || 1)) * 100);

      setStats({ correct, incorrect: attempted - correct, attempted, percent });

      const analyticsData = {
        subjectId,
        googleId,
        subModuleId: submoduleId,
        questionAnswers,
        totalTimeSpent: timer,
        correctAnswers: correct,
        incorrectAnswers: attempted - correct,
        summary: {
          correct,
          attempted,
          total: data.length,
          percent,
          finishedAt: new Date().toISOString(),
        },
      };

      setIsSubmitting(true);
      setIsRunning(false);

      await supabaseService.submitAnalytics(analyticsData);

      clearSavedProgress();
      setIsQuizCompleted(true);
    } catch (err) {
      console.error("Submit error", err);
      alert("Failed to submit quiz. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------
  // Helpers for revision / PDF open
  // -------------------------
  const normalizedPdfInfoFromQuestion = (q) => {
    console.log("NORMALIZING PDF INFO FOR Q:", q?._id);
    console.log(q)
    if (!q) return { url: null, page: null, explanation: null };

    return {
      url: q.sourceTextbookUrl ?? null,
      page: q.pageNumber ?? null,
      explanation: q.explanation_answer ?? null,
    };
  };



  // Build a PDF URL that opens at the requested page.
  const buildPdfUrlAtPage = (url, page) => {
    if (!url) return null;
    const safePage = page && Number(page) > 0 ? Number(page) : 1;

    if (url.includes("#page=")) {
      return url.replace(/#page=\d+/, `#page=${safePage}`);
    }

    return `${url}#page=${safePage}`;
  };


  const handleShowRevision = () => {
    const q = data[currentQuestionIndex];
    if (!q) return;

    const qid = q._id;
    const prev = answersRef.current[qid] || {};

    const next = {
      ...prev,
      is_revision: !prev.is_revision, // ✅ TOGGLE
    };

    answersRef.current = {
      ...answersRef.current,
      [qid]: next,
    };

    setAnswers({ ...answersRef.current });
    setShowRevisionPanel(next.is_revision);
  };




  const handleOpenPdfFromRevision = () => {
    const q = data[currentQuestionIndex];
    if (!q) return;

    const pdfUrl =
      q.sourceTextbookUrl ??
      q.pdf_url ??
      q.reference_pdf_url ??
      null;

    const pageNumber =
      q.pageNumber ??
      q.page ??
      q.page_no ??
      q.pg ??
      null;

    if (!pdfUrl) {
      alert("No PDF source available for this question.");
      return;
    }

    const finalUrl = buildPdfUrlAtPage(pdfUrl, pageNumber);
    window.open(finalUrl, "_blank");
  };
  // -------------------------
  // Render guards
  // -------------------------
  if (isLoading || !data.length) {
    return (
      <div className="min-h-screen bg-[#f3e5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-xl font-semibold">Loading Quiz...</p>
        </div>
      </div>
    );
  }

  if (isQuizCompleted) {
    return <QuizCompletionScreen quizStats={stats} totalQuestions={data.length} totalTime={timer} />;
  }

  const currentQuestion = data[currentQuestionIndex];

  const currentQid = currentQuestion._id;
  // ✅ IMAGE URL (DECLARE ONCE)
  const questionImageUrl = currentQuestion?.imageName
    ? buildPublicImageUrl(currentQuestion.imageName)
    : null;


  const savedAnswer = answersRef.current[currentQid] || {};
  const currentNotes = savedAnswer.notes ?? "";
  const importance = savedAnswer.importance ?? null;
  const isAnswered = !!savedAnswer.attempted;

  const { url: currentPdfUrl, page: currentPdfPage, explanation: currentExplanation } = normalizedPdfInfoFromQuestion(
    currentQuestion
  );

  const toggleImportance = () => {
    const qid = currentQid;
    if (!qid) return;

    const prev = answersRef.current[qid] || {};

    const next = {
      ...prev,
      importance: !prev.importance, // ✅ boolean toggle
    };

    answersRef.current = {
      ...answersRef.current,
      [qid]: next,
    };

    setAnswers({ ...answersRef.current });
  };

  const toggleReport = () => {
    const qid = currentQid;
    if (!qid) return;

    const prev = answersRef.current[qid] || {};

    const next = {
      ...prev,
      report: !prev.report,
    };

    answersRef.current = {
      ...answersRef.current,
      [qid]: next,
    };

    setAnswers({ ...answersRef.current });
  };


  return (
    <div className="min-h-screen bg-[#f5ddff] px-10 md:px-20 py-8">
      {showAnimation && (
        <div className="fixed top-6 right-6 z-50 animate-slideInRight">
          <div
            className={`${isCorrect
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300"
              : "bg-gradient-to-r from-rose-500 to-pink-600 border-rose-300"
              } text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2`}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-3xl">{isCorrect ? "✓" : "✗"}</span>
            </div>
            <div>
              <div className="font-bold text-lg">{isCorrect ? "Correct!" : "Incorrect!"}</div>
              <div className="text-sm opacity-90">{isCorrect ? "Great job!" : "Don't worry, try again!"}</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex gap-8">
        {/* Sidebar */}
        <div
          className="w-64 bg-[#e8c7f6] backdrop-blur-sm rounded-2xl p-4 border-2 border-[#440067] flex flex-col transition-all"
          style={{
            height: sidebarExpanded ? "auto" : "88vh",
            maxHeight: sidebarExpanded ? "92vh" : "88vh",
          }}
        >
          <div className="bg-yellow-400 text-gray-900 font-bold px-3 py-1.5 rounded-full flex items-center justify-center gap-2 mb-4 text-sm">
            <span>⏱</span>
            <span>{formatTime(timer)}</span>
          </div>

          <div className="flex-1 overflow-y-auto mb-3 p-1">
            <div className="grid grid-cols-5 gap-1.5">
              {data.map((_, index) => {
                const status = getQuestionStatus(index);
                const isCurrent = index === currentQuestionIndex;
                const base =
                  "aspect-square rounded-md font-semibold text-xs relative transition-all duration-200 hover:scale-110 " +
                  (isCurrent ? "ring-2 ring-purple-600 ring-offset-1" : "");
                const statusClass =
                  status === "answered"
                    ? "bg-green-500 text-white"
                    : status === "incorrect"
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300";



                return (
                  <button
                    key={index}
                    onClick={() => {
                      saveResponse();
                      setCurrentQuestionIndex(index);
                      const q = data[index];
                      const saved = answersRef.current[q._id];
                      setSelectedOption(
                        typeof saved?.userAnswer === "string" ? saved.userAnswer : null
                      );

                      setIsCorrect(saved?.isCorrect ?? null);
                      setQuestionTimer(0);
                      setShowRevisionPanel(false);
                    }}
                    className={`${base} ${statusClass}`}
                    style={{ minWidth: 0 }}
                    title={`Question ${index + 1}`}
                  >
                    {index + 1}
                    {answersRef.current[data[index]._id]?.report && (
                      <span className="absolute -top-0.5 -right-0.5 text-[10px]">👎</span>
                    )}

                    {answersRef.current[data[index]._id]?.importance && (
                      <span className="absolute -top-0.5 -left-0.5 text-[10px]">⭐</span>
                    )}


                    {answersRef.current[data[index]._id]?.is_revision && (
                      <span className="absolute bottom-0 right-0 text-[10px]">📘</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 text-xs mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-gray-700">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-orange-500" />
              <span className="text-gray-700">Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle size={16} className="text-gray-400" />
              <span className="text-gray-700">Not Visited</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button onClick={() => setSidebarExpanded((s) => !s)} className="text-xs text-purple-700 hover:underline px-3 py-1 rounded">
              {sidebarExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-visible space-y-6 pr-2">
            {/* Question Card */}
           <div
className={`backdrop-blur-sm rounded-2xl p-5 border-2 
${isShaking ? "animate-shake" : ""} 
bg-[#FACDFF] border-[#440067]
`}
>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {data.length}
                </span>

                <div className="flex items-center gap-2">
                  {/* Revision: toggles the horizontal revision panel below (does NOT open PDF) */}
                  <div className="flex items-center gap-3 bg-white/70 px-3 py-2 rounded-xl border border-purple-200 shadow-sm">
                    {/* Revision */}
                    <button
                      onClick={handleShowRevision}
                      className={`px-3 py-1 text-sm rounded-lg font-semibold transition-all flex items-center gap-1 ${savedAnswer.is_revision
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }`}
                    >
                      📘 Revision
                    </button>

                    {/* Divider */}
                    <span className="h-5 w-px bg-purple-200"></span>

                    {/* Report / Difficult */}
                    <button
                      onClick={toggleReport}
                      title="Mark as reported"
                      className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${savedAnswer.report
                        ? "bg-red-100 text-red-600 ring-2 ring-red-400 scale-110"
                        : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
                        }`}
                    >
                      👎
                    </button>

                    {/* Important */}
                    <button
                      onClick={toggleImportance}
                      title="Mark as important"
                      className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${savedAnswer.importance
                        ? "bg-yellow-100 text-yellow-600 ring-2 ring-yellow-400 scale-110"
                        : "bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-500"
                        }`}
                    >
                      ⭐
                    </button>


                  </div>
                </div>
              </div>


              <div
                ref={containerRef}
                className={`mt-2 flex gap-2 ${currentQuestion.passageText ? "items-stretch" : "items-stretch"}`}
              >
                {currentQuestion.passageText && (
                  <>
                    <div
                      style={{ width: `${passageWidth}%` }}
                      className="relative rounded-xl bg-white/70 border border-purple-200 overflow-hidden flex-shrink-0"
                    >
                      <div className="absolute inset-0 overflow-y-auto p-3 no-scrollbar">
                        {currentQuestion.passageTitle && <div className="font-semibold text-lg text-purple-900 mb-2">{currentQuestion.passageTitle}</div>}
                        <div className="text-lg text-gray-800 whitespace-pre-line">
                          <LatexRenderer>{currentQuestion.passageText}</LatexRenderer>
                        </div>
                      </div>
                    </div>

                    {/* Resizer Handle */}
                    <div
                      className="w-5 cursor-col-resize flex flex-col justify-center items-center group hover:bg-purple-50 rounded-lg transition-colors mx-1"
                      onMouseDown={startResizing}
                      title="Drag to resize"
                    >
                      <div className="w-1.5 h-12 bg-purple-300 group-hover:bg-purple-500 group-active:bg-purple-700 rounded-full shadow-sm transition-colors"></div>
                    </div>
                  </>
                )}



                <div className="flex-1">

                  {currentQuestion.questionText && (
                    <div className="mb-3 text-base font-semibold text-purple-900 leading-relaxed">
                      <LatexRenderer>{currentQuestion.questionText}</LatexRenderer>
                    </div>
                  )}

                  {questionImageUrl && (
                    <div className="mb-4 flex flex-col items-center">
                      <img
                        src={questionImageUrl}
                        alt={currentQuestion.imageCaption || "Question image"}
                        className="max-w-full max-h-72 rounded-xl border border-purple-300 shadow-sm"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {currentQuestion.imageCaption && (
                        <p className="mt-1 text-xs text-gray-600 text-center">
                          {currentQuestion.imageCaption}
                        </p>
                      )}
                    </div>
                  )}



                  <div className="space-y-2 mb-4">
                    {(() => {
                      switch (currentQuestion.questionType) {
                        case "mcq":
                          return currentQuestion.options.map((option) => {
                            const isSel = selectedOption === option._id || savedAnswer.userAnswer === option._id;
                            const showCorrectness = isSel && (isCorrect !== null || savedAnswer.isCorrect != null);
                            const isCorr = isCorrect ?? savedAnswer.isCorrect;
                           const wrongHighlight =
savedAnswer.attempted &&
savedAnswer.isCorrect === false &&
isSel
? " border-red-500 text-red-600"
: "";
                            return (
                              <button
                                key={option._id}
                                className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center gap-3 ${isSel
                                  ? showCorrectness && isCorr
                                    ? "bg-[#e2bbf3] border-purple-600 text-purple-900"
                                    : showCorrectness
                                      ? "bg-red-100 border-red-400 text-red-800"
                                      : "bg-purple-200 border-purple-400 text-purple-900"
                                  : "bg-[#faefff] border-gray-300 text-purple-800 font-bold hover:border-purple-300 hover:bg-purple-50"
                                  } ${wrongHighlight}`}
                                onClick={() => handleOptionSelect(option._id)}
                                disabled={savedAnswer.attempted}
                              >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "border-purple-600 bg-purple-600" : "border-gray-400"}`}>
                                  {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                </div>
                                <span className="flex-1"><LatexRenderer>{option.optionText}</LatexRenderer></span>
                              </button>
                            );
                          });

                        case "truefalse":
                          return <TrueFalseQuestion question={currentQuestion} onAnswer={handleQuestionAnswer} savedAnswer={savedAnswer?.userAnswer} isAnswered={savedAnswer?.attempted} />;

                        case "fillblanks":
                          return (
                            <FillBlanksQuestion
                              question={currentQuestion}
                              onAnswer={handleQuestionAnswer}
                              savedAnswer={savedAnswer}     // ✅ FIXED
                              isAnswered={savedAnswer?.attempted}
                            />
                          );


                        case "matchfollowing":
                          return (
                            <MatchFollowingQuestion
                              key={currentQuestion._id}   // ✅ FORCE RESET BETWEEN QUESTIONS
                              question={currentQuestion}
                              onAnswer={handleQuestionAnswer}
                              savedAnswer={savedAnswer?.userAnswer ?? null}
                              isAnswered={!!savedAnswer?.attempted}
                            />
                          );


                        case "multi":
                          return (
                            <MultiSelectQuestion
                              question={currentQuestion}
                              onAnswer={handleQuestionAnswer}
                              savedAnswer={savedAnswer?.userAnswer ?? []}
                              isAnswered={savedAnswer?.attempted}
                            />
                          );


                        case "math":
                          return (
                            <MathInput
                              question={currentQuestion}
                              savedAnswer={savedAnswer}
                              isAnswered={savedAnswer?.attempted}
                              onAnswer={(valObj, isValid) => {
                                // Calculate correctness
                                // 1. Get correct answer from question
                                const correctRaw = currentQuestion.correctAnswer || currentQuestion.correct_answer || currentQuestion.correct_answer_text;

                                // 2. Parse both to latex
                                const userLatex = valObj.latex;
                                const { latex: correctLatex } = parseMathToLatex(String(correctRaw));

                                // 3. Compare
                                const normalize = s => (s || "").replace(/\s/g, "");
                                const isCorrect = isValid && normalize(userLatex) === normalize(correctLatex);

                                // 4. Submit
                                handleQuestionAnswer(valObj, isCorrect);
                              }}
                            />
                          );

                        default:
                          return <div className="text-center text-red-500 p-3 bg-red-50 rounded-xl text-sm">Unsupported question type: {currentQuestion.questionType}</div>;
                      }
                    })()}
                  </div>
                </div>
              </div>

              {savedAnswer.importance && (
                <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-yellow-50 text-yellow-700">
                  <span className="text-lg">⭐</span>
                  <span>This question is marked as important.</span>
                </div>
              )}

              {savedAnswer.report && (
                <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-red-50 text-red-700">
                  <span className="text-lg">👎</span>
                  <span>This question is marked as reported.</span>
                </div>
              )}

            </div>

            {/* Notes */}
            <div className="bg-[#FACDFF] backdrop-blur-sm rounded-2xl p-2 px-2 border-2 border-[#440067]">
              <div className="flex items-center gap-2 mb-2 text-purple-700">
                <span className="text-lg">📝</span>
                <span className="font-semibold text-sm">Add Notes for this Question</span>
              </div>
              <textarea
                placeholder="Write your notes here..."
                value={savedAnswer.notes ?? ""}
                onChange={(e) => {
                  const qid = currentQid;
                  const value = e.target.value;

                  const prev = answersRef.current[qid] || {};

                  answersRef.current = {
                    ...answersRef.current,
                    [qid]: {
                      ...prev,
                      notes: value,
                    },
                  };

                  setAnswers({ ...answersRef.current });
                }}
                className="w-full p-2 border-2 border-purple-200 rounded-xl"
                rows={2}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center gap-3 mt-3 pt-4 pb-4">
            <div className="flex justify-center gap-8 w-full">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`px-8 py-2.5 rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-3 transform hover:scale-105 ${currentQuestionIndex === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-purple-800 text-white"
                  }`}
              >
                ← Previous
              </button>

              {currentQuestionIndex === data.length - 1 ? (
                <button
                  onClick={handleQuizSubmit}
                  disabled={!allAttempted || isQuizCompleted || isSubmitting}
                  className={`px-8 py-2.5 rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-2 ${isQuizCompleted ? "bg-gray-400 text-white" : !allAttempted ? "bg-green-300 text-white cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                >
                  {isQuizCompleted ? "Submitted!" : isSubmitting ? "Submitting..." : "Submit Quiz"} {isQuizCompleted ? "" : "✓"}
                </button>
              ) : (
                <button onClick={handleNext} className="px-10 py-2.5 rounded-lg font-bold bg-gradient-to-r from-purple-800 to-purple-600 text-white text-lg hover:from-purple-800 hover:to-purple-800 shadow-[0_4px_12px_rgba(147,51,234,0.3)]">
                  Next →
                </button>
              )}
            </div>

            <div className="h-6">
              {!allAttempted && showAttemptWarning ? (
                <div className="text-sm text-red-600 font-semibold mt-2">Please attempt all questions before submitting the quiz.</div>
              ) : !allAttempted ? (
                <div className="text-sm text-gray-600 mt-2">You have attempted {attemptedCount} of {data.length} questions. Answer all to enable Submit.</div>
              ) : null}
            </div>
          </div>

          {/* Revision horizontal panel — appears BELOW question area and stretches across content */}
          <div ref={revisionRef} className="mt-6">
            {showRevisionPanel && (
              <div className="w-full bg-white rounded-2xl p-4 border-2 border-purple-200 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  {/* Explanation column (left) */}
                  <div className="flex-1 pr-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-purple-900">Explanation</h3>
                      <button
                        aria-label="Close revision panel"
                        onClick={() => setShowRevisionPanel(false)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Close
                      </button>
                    </div>

                    <div className="text-xl text-gray-800 leading-relaxed whitespace-pre-line max-h-[48vh] overflow-y-auto pr-2">
                      {currentExplanation ? (
                        <div>
                          <LatexRenderer>{currentExplanation}</LatexRenderer>
                          <VoiceExplanationPlayer text={currentExplanation} />
                        </div>
                      ) : (
                        <div className="text-xl text-gray-500">No explanation available for this question.</div>
                      )}
                    </div>
                  </div>

                  {/* Source + controls (right) */}
                  <div className="w-64 flex-shrink-0">
                    <div className="text-sm text-gray-700 mb-2 font-medium">Source Textbook</div>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3 text-xs text-gray-700">
                      <div className="truncate break-words">
                        {currentPdfUrl ? (
                          <a href={currentPdfUrl} target="_blank" rel="noreferrer" className="text-purple-700 underline break-words">
                            {currentPdfUrl}
                          </a>
                        ) : (
                          <span className="text-gray-500">No textbook URL provided</span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Page: {currentPdfPage ?? "N/A"}
                      </div>
                    </div>

                    <button
                      onClick={handleOpenPdfFromRevision}
                      disabled={!currentPdfUrl}
                      className={`w-full px-3 py-2 rounded-lg font-semibold text-sm ${currentPdfUrl
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                      Open PDF at Page
                    </button>



                    {/* Inline viewer area — renders only when embeddedPdfSrc is set */}
                    {typeof embeddedPdfSrc !== "undefined" && embeddedPdfSrc && (
                      <div className="mt-3 w-full">
                        {/* keep height manageable inside sidebar; user can toggle fullscreen if you add that later */}
                        <div className="h-64 rounded-lg overflow-hidden border border-gray-100">
                          <iframe
                            title="Source PDF (inline)"
                            src={embeddedPdfSrc}
                            style={{ width: "100%", height: "100%", border: "0" }}
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                          />
                        </div>

                        {/* small controls under embedded viewer */}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              // open the same pdf in a new tab from embedded viewer
                              window.open(embeddedPdfSrc, "_blank", "noopener,noreferrer");
                            }}
                            className="text-xs px-2 py-1 rounded bg-gray-100 border text-gray-700"
                          >
                            Open in new tab
                          </button>

                          <button
                            onClick={() => {
                              // close embedded viewer
                              try {
                                setEmbeddedPdfSrc(null);
                              } catch (e) {
                                console.warn("setEmbeddedPdfSrc not found:", e);
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-gray-100 border text-gray-700"
                          >
                            Close viewer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;
