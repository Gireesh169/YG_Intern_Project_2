import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowLeft, ArrowRight, ImageIcon, Loader2, Trophy } from "lucide-react";
import { supabase } from "../config/supabase";
import { useTheme } from "../utils/useTheme";

const isQuestionLike = (value) => {
  if (!value || typeof value !== "object") return false;
  return Boolean(
    value.question_text ||
      value.questionText ||
      value.options ||
      value.option_json ||
      value.options_json ||
      value.passage_text ||
      value.passageText ||
      value.passage ||
      value.image_url ||
      value.imageUrl ||
      value.image_name ||
      value.imageName,
  );
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value ?? "");
  }
};

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim().toLowerCase();
  return safeStringify(value).replace(/\s+/g, "").trim().toLowerCase();
};

const getOptionLabel = (option, index) => {
  if (option === null || option === undefined) return `Option ${index + 1}`;
  if (typeof option === "string" || typeof option === "number" || typeof option === "boolean") {
    return String(option);
  }

  if (typeof option === "object") {
    return (
      option.option_text ??
      option.optionText ??
      option.text ??
      option.label ??
      option.title ??
      option.value ??
      safeStringify(option)
    );
  }

  return String(option);
};

const resolveQuestionImage = (question) => {
  const directUrl =
    question?.image_url ??
    question?.imageUrl ??
    question?.image ??
    null;

  if (typeof directUrl === "string" && directUrl.startsWith("http")) {
    return directUrl;
  }

  const storagePath =
    question?.image_name ??
    question?.imageName ??
    question?.image_path ??
    question?.imagePath ??
    directUrl;

  if (!storagePath || typeof storagePath !== "string") return null;

  const { data } = supabase.storage.from("question-assets").getPublicUrl(storagePath);
  return data?.publicUrl || directUrl || null;
};

const normalizeQuestion = (question, context = {}) => {
  const options =
    (Array.isArray(question?.options) && question.options) ||
    (Array.isArray(question?.option_json) && question.option_json) ||
    (Array.isArray(question?.options_json) && question.options_json) ||
    [];

  return {
    ...question,
    question_id: question?.question_id ?? question?.id ?? question?._id ?? question?.questionId ?? null,
    question_text: question?.question_text ?? question?.questionText ?? "",
    options,
    passage_text: question?.passage_text ?? question?.passageText ?? question?.passage ?? null,
    image_url: question?.image_url ?? question?.imageUrl ?? question?.image ?? null,
    image_name: question?.image_name ?? question?.imageName ?? null,
    module_name: context.module_name ?? question?.module_name ?? question?.moduleName ?? null,
    submodule_name: context.submodule_name ?? question?.submodule_name ?? question?.submoduleName ?? null,
  };
};

const flattenQuizQuestions = (payload) => {
  const questions = [];
  const seen = new Set();

  const visit = (node, context = {}) => {
    if (node === null || node === undefined) return;

    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, context));
      return;
    }

    if (typeof node !== "object") return;

    const nextContext = {
      ...context,
      module_name:
        context.module_name ?? node.module_name ?? node.moduleName ?? node.name ?? node.title ?? null,
      submodule_name:
        context.submodule_name ?? node.submodule_name ?? node.submoduleName ?? node.subModuleName ?? null,
    };

    if (Array.isArray(node.modules)) visit(node.modules, nextContext);
    if (Array.isArray(node.submodules)) visit(node.submodules, nextContext);
    if (Array.isArray(node.subModules)) visit(node.subModules, nextContext);
    if (Array.isArray(node.questions)) visit(node.questions, nextContext);

    if (isQuestionLike(node)) {
      const normalized = normalizeQuestion(node, nextContext);
      const key = String(normalized.question_id ?? `${questions.length}-${normalized.question_text}`);
      if (!seen.has(key)) {
        seen.add(key);
        questions.push(normalized);
      }
    }
  };

  visit(payload, {});
  return questions;
};

const isOptionCorrect = (question, option, optionIndex) => {
  if (option && typeof option === "object") {
    if (typeof option.isCorrect === "boolean") return option.isCorrect;
    if (typeof option.correct === "boolean") return option.correct;
    if (typeof option.is_correct === "boolean") return option.is_correct;
  }

  const correctAnswer =
    question?.correct_answer ??
    question?.correctAnswer ??
    question?.correct_answer_text ??
    question?.answer ??
    question?.correct ??
    question?.correct_option_text ??
    null;

  if (correctAnswer === null || correctAnswer === undefined) {
    return false;
  }

  const selectedValue =
    option && typeof option === "object"
      ? option.option_text ?? option.optionText ?? option.text ?? option.label ?? option.value ?? option
      : option;

  if (Array.isArray(question?.options)) {
    const questionOptions = question.options;
    const hasExplicitCorrectFlag = questionOptions.some(
      (item) => item && typeof item === "object" && (typeof item.isCorrect === "boolean" || typeof item.correct === "boolean" || typeof item.is_correct === "boolean"),
    );

    if (hasExplicitCorrectFlag) {
      const selectedOption = questionOptions[optionIndex];
      if (selectedOption && typeof selectedOption === "object") {
        return Boolean(
          selectedOption.isCorrect ?? selectedOption.correct ?? selectedOption.is_correct ?? false,
        );
      }
    }
  }

  return normalizeText(selectedValue) === normalizeText(correctAnswer);
};

const formatStoredAnswer = (option) => {
  if (option === null || option === undefined) return null;
  if (typeof option === "string" || typeof option === "number" || typeof option === "boolean") {
    return option;
  }
  return safeStringify(option);
};

const LearningQuiz = () => {
  const { subjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { signupData } = useSelector((state) => state.auth || {});

  const [quizResponse, setQuizResponse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const questionStartRef = useRef(Date.now());

  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;
  const isComplete = isCompleted;

  const resolvedGoogleId = useMemo(() => signupData?.googleId ?? null, [signupData?.googleId]);

  useEffect(() => {
    const loadQuizData = async () => {
      if (!subjectId) {
        setError("Missing subject id.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const { data, error: invokeError } = await supabase.functions.invoke("getQuizData", {
          body: { subjectId },
        });

        if (invokeError) {
          throw invokeError;
        }

        const payload = data?.data ?? data ?? null;
        const flattenedQuestions = flattenQuizQuestions(payload);

        if (!flattenedQuestions.length) {
          throw new Error("No quiz questions were returned by getQuizData.");
        }

        setQuizResponse(payload);
        setQuestions(flattenedQuestions);
        setCurrentIndex(0);
        setSelectedOptionIndex(null);
        setAnswers([]);
        setScore(0);
        setIsCompleted(false);
        questionStartRef.current = Date.now();
      } catch (loadError) {
        console.error("Failed to load quiz data:", loadError);
        const message = loadError?.message || "Unable to load quiz data.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [subjectId]);

  useEffect(() => {
    questionStartRef.current = Date.now();
    setSelectedOptionIndex(null);
  }, [currentIndex]);

  const resolveGoogleId = async () => {
    if (resolvedGoogleId) return resolvedGoogleId;

    const { data, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    return (
      data?.user?.user_metadata?.google_id ||
      data?.user?.user_metadata?.sub ||
      data?.user?.user_metadata?.provider_id ||
      data?.user?.email ||
      data?.user?.id ||
      null
    );
  };

  const handleAnswerSelect = async (option, optionIndex) => {
    if (submittingAnswer || isComplete || !currentQuestion) return;

    try {
      setSubmittingAnswer(true);
      setSelectedOptionIndex(optionIndex);

      const timeSpent = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));
      const googleId = await resolveGoogleId();
      if (!googleId) {
        throw new Error("Unable to resolve google_id for saving the answer.");
      }

      const questionId = currentQuestion.question_id;
      if (!questionId) {
        throw new Error("Missing question_id for the current question.");
      }

      const isCorrect = isOptionCorrect(currentQuestion, option, optionIndex);
      const userAnswer = formatStoredAnswer(option);

      const { error: insertError } = await supabase.from("user_qas").insert([
        {
          google_id: googleId,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          time_spent: timeSpent,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      const nextAnswer = {
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        time_spent: timeSpent,
      };

      setError("");
      setAnswers((prev) => [...prev, nextAnswer]);
      setScore((prevScore) => prevScore + (isCorrect ? 1 : 0));

      if (currentIndex >= totalQuestions - 1) {
        setIsCompleted(true);
        return;
      }

      setCurrentIndex((prev) => prev + 1);
      questionStartRef.current = Date.now();
      setSelectedOptionIndex(null);
    } catch (saveError) {
      console.error("Failed to save answer:", saveError);
      const message = saveError?.message || "Failed to save your answer.";
      toast.error(message);
      setError(message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const completedCount = answers.length;
  const scoreValue = score ?? 0;
  const scorePercent = totalQuestions ? Math.round((scoreValue / totalQuestions) * 100) : 0;

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setAnswers([]);
    setScore(0);
    setIsCompleted(false);
    setError("");
    questionStartRef.current = Date.now();
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: isDark ? "linear-gradient(135deg, #0B0F19, #111827)" : "linear-gradient(135deg, #F8FAFC, #E0F2FE)" }}
      >
        <div
          className="w-full max-w-xl rounded-3xl border p-8 text-center shadow-2xl"
          style={{
            background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.92)",
            borderColor: isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)",
          }}
        >
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-500" />
          <h1 className="text-2xl font-bold" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
            Loading learning quiz
          </h1>
          <p className="mt-2 text-sm" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
            Fetching modules, submodules, and questions from Supabase.
          </p>
        </div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: isDark ? "linear-gradient(135deg, #0B0F19, #111827)" : "linear-gradient(135deg, #F8FAFC, #E0F2FE)" }}
      >
        <div
          className="w-full max-w-xl rounded-3xl border p-8 text-center shadow-2xl"
          style={{
            background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.92)",
            borderColor: isDark ? "rgba(244,63,94,0.25)" : "rgba(239,68,68,0.15)",
          }}
        >
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
          <h1 className="text-2xl font-bold" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
            Could not start learning
          </h1>
          <p className="mt-2 text-sm" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
            {error}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/quizzes")}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
                color: isDark ? "#E5E7EB" : "#0F172A",
              }}
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete && totalQuestions > 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: isDark ? "linear-gradient(135deg, #0B0F19, #111827)" : "linear-gradient(135deg, #F8FAFC, #E0F2FE)" }}
      >
        <div
          className="w-full max-w-2xl rounded-[2rem] border p-8 shadow-2xl"
          style={{
            background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.92)",
            borderColor: isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)",
          }}
        >
          <div className="flex items-center gap-3 text-amber-500">
            <Trophy className="h-8 w-8" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">Learning Complete</span>
          </div>

          <h1 className="mt-4 text-3xl font-black" style={{ color: isDark ? "#F9FAFB" : "#0F172A" }}>
            Score {scoreValue} / {totalQuestions}
          </h1>
          <p className="mt-2 text-base" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
            You answered {completedCount} questions and scored {scorePercent}%.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border p-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0" }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: isDark ? "#9CA3AF" : "#64748B" }}>Correct</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: isDark ? "#F9FAFB" : "#0F172A" }}>
                {scoreValue}
              </p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0" }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: isDark ? "#9CA3AF" : "#64748B" }}>Attempted</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: isDark ? "#F9FAFB" : "#0F172A" }}>
                {completedCount}
              </p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0" }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: isDark ? "#9CA3AF" : "#64748B" }}>Score</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: isDark ? "#F9FAFB" : "#0F172A" }}>
                {scorePercent}%
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
            >
              Restart Learning
            </button>
            <button
              onClick={() => navigate("/quizzes")}
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
                color: isDark ? "#E5E7EB" : "#0F172A",
              }}
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const questionImage = resolveQuestionImage(currentQuestion);
  const passageText = currentQuestion.passage_text;
  const questionOptions = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];
  const questionJson = safeStringify(questionOptions);

  return (
    <div
      className="min-h-screen px-4 py-8 md:px-8 lg:px-12"
      style={{ background: isDark ? "linear-gradient(135deg, #0B0F19, #111827)" : "linear-gradient(135deg, #F8FAFC, #E0F2FE)" }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
            color: isDark ? "#E5E7EB" : "#0F172A",
            background: isDark ? "rgba(17,24,39,0.72)" : "rgba(255,255,255,0.78)",
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div
          className="overflow-hidden rounded-[2rem] border shadow-2xl"
          style={{
            background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.92)",
            borderColor: isDark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.12)",
          }}
        >
          <div className="border-b px-6 py-5" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
                  Start Learning
                </p>
                <h1 className="mt-2 text-2xl font-black md:text-3xl" style={{ color: isDark ? "#F9FAFB" : "#0F172A" }}>
                  Question {currentIndex + 1} of {totalQuestions}
                </h1>
              </div>
              <div className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0", color: isDark ? "#E5E7EB" : "#0F172A" }}>
                Score: {scoreValue}
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6 px-6 py-6">
              {(currentQuestion.module_name || currentQuestion.submodule_name) && (
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                  {currentQuestion.module_name && <span>{currentQuestion.module_name}</span>}
                  {currentQuestion.submodule_name && <span>/{currentQuestion.submodule_name}</span>}
                </div>
              )}

              <div className="rounded-3xl border p-5" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0", background: isDark ? "rgba(15,23,42,0.55)" : "#F8FAFC" }}>
                <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Question Text
                </p>
                <h2 className="mt-3 text-xl font-bold leading-relaxed md:text-2xl" style={{ color: isDark ? "#F9FAFB" : "#0F172A" }}>
                  {currentQuestion.question_text}
                </h2>
              </div>

              {passageText && (
                <div className="rounded-3xl border p-5" style={{ borderColor: isDark ? "rgba(56,189,248,0.2)" : "rgba(14,165,233,0.18)", background: isDark ? "rgba(8,47,73,0.35)" : "#ECFEFF" }}>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Passage
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7" style={{ color: isDark ? "#D1D5DB" : "#0F172A" }}>
                    {passageText}
                  </p>
                </div>
              )}

              {questionImage && (
                <div className="overflow-hidden rounded-3xl border" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0" }}>
                  <img
                    src={questionImage}
                    alt="Question visual"
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                    Options
                  </h3>
                  <span className="text-xs font-medium" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
                    Saved answers: {completedCount}
                  </span>
                </div>

                <div className="grid gap-3">
                  {questionOptions.length > 0 ? (
                    questionOptions.map((option, index) => {
                      const active = selectedOptionIndex === index;
                      return (
                        <button
                          key={`${currentQuestion.question_id}-${index}`}
                          onClick={() => handleAnswerSelect(option, index)}
                          disabled={submittingAnswer}
                          className="rounded-2xl border px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                          style={{
                            borderColor: active
                              ? "rgba(99,102,241,0.75)"
                              : isDark
                                ? "rgba(255,255,255,0.08)"
                                : "#CBD5E1",
                            background: active
                              ? isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.08)"
                              : isDark
                                ? "rgba(15,23,42,0.55)"
                                : "#FFFFFF",
                            color: isDark ? "#F9FAFB" : "#0F172A",
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-black text-indigo-400">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="whitespace-pre-wrap text-sm font-semibold leading-6">
                                {getOptionLabel(option, index)}
                              </div>
                              <pre
                                className="overflow-auto rounded-xl border p-3 text-[11px] leading-5"
                                style={{
                                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                                  background: isDark ? "rgba(2,6,23,0.35)" : "#F8FAFC",
                                  color: isDark ? "#CBD5E1" : "#334155",
                                }}
                              >
                                {safeStringify(option)}
                              </pre>
                            </div>
                            {submittingAnswer && active && (
                              <Loader2 className="mt-1 h-4 w-4 animate-spin text-indigo-400" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed p-6 text-sm" style={{ borderColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1", color: isDark ? "#9CA3AF" : "#475569" }}>
                      No options were returned for this question.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="border-t px-6 py-6 lg:border-l lg:border-t-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0", background: isDark ? "rgba(15,23,42,0.35)" : "#F8FAFC" }}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                Question JSON
              </p>
              <pre
                className="mt-4 max-h-[70vh] overflow-auto rounded-3xl border p-4 text-xs leading-6"
                style={{
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                  background: isDark ? "rgba(2,6,23,0.45)" : "#FFFFFF",
                  color: isDark ? "#CBD5E1" : "#0F172A",
                }}
              >
                {questionJson}
              </pre>
            </aside>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0" }}>
            <p className="text-sm" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
              {submittingAnswer ? "Saving answer..." : "Select one option to save your answer and move forward."}
            </p>
            <button
              onClick={() => navigate("/quizzes")}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F172A, #334155)" }}
            >
              <ArrowRight size={16} />
              Exit Learning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningQuiz;
