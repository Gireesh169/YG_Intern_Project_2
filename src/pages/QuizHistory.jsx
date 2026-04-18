// import { useState, useMemo } from "react";

// export default function QuizHistory() {
//     const [search, setSearch] = useState("");
//     const [selectedQuiz, setSelectedQuiz] = useState(null);
//     const [mode, setMode] = useState("bad");
//     const [qSearch, setQSearch] = useState("");

//     const quizzes = [
//         {
//             id: 1,
//             title: "Geography Quiz",
//             date: "2026-01-30",
//             questions: [
//                 {
//                     id: 101,
//                     question: "Capital of Canada?",
//                     options: ["Toronto", "Ottawa", "Vancouver", "Montreal"],
//                     correctAnswer: "Ottawa",
//                     answerExplanation: "Ottawa is Canada's political capital.",
//                     questionExplanation: "Tests knowledge of world capitals.",
//                     attempted: false,
//                     isCorrect: false,
//                     important: true,
//                     note: "Revise capitals",
//                 },
//                 {
//                     id: 102,
//                     question: "Largest desert in the world?",
//                     options: ["Sahara", "Gobi", "Kalahari", "Arabian"],
//                     correctAnswer: "Sahara",
//                     answerExplanation: "The Sahara is the largest hot desert.",
//                     questionExplanation: "Checks knowledge of world geography.",
//                     attempted: true,
//                     isCorrect: false,
//                     important: false,
//                     note: "",
//                 },
//                 {
//                     id: 103,
//                     question: "Which country has the most population?",
//                     options: ["USA", "India", "China", "Brazil"],
//                     correctAnswer: "India",
//                     answerExplanation: "India recently surpassed China in population.",
//                     questionExplanation: "Tests global population knowledge.",
//                     userAnswer: "India",
//                     attempted: true,
//                     isCorrect: true,
//                     important: true,
//                     note: "Population stats important",
//                 }
//             ]
//         },
//         {
//             id: 2,
//             title: "Math Quiz",
//             date: "2026-01-29",
//             questions: [
//                 {
//                     id: 201,
//                     question: "5 × 6?",
//                     options: ["30", "35", "25", "20"],
//                     correctAnswer: "30",
//                     answerExplanation: "5 multiplied by 6 equals 30.",
//                     questionExplanation: "Basic multiplication check.",
//                     attempted: true,
//                     isCorrect: true,
//                     important: false,
//                     note: "",
//                 },
//                 {
//                     id: 202,
//                     question: "Square root of 81?",
//                     options: ["7", "8", "9", "6"],
//                     correctAnswer: "9",
//                     answerExplanation: "9 × 9 = 81.",
//                     questionExplanation: "Tests square roots.",
//                     attempted: false,
//                     isCorrect: false,
//                     important: false,
//                     note: "",
//                 },
//                 {
//                     id: 203,
//                     question: "What is 12 ÷ 3?",
//                     options: ["2", "3", "4", "6"],
//                     correctAnswer: "4",
//                     answerExplanation: "12 divided by 3 equals 4.",
//                     questionExplanation: "Basic division question.",
//                     userAnswer: "6",
//                     attempted: true,
//                     isCorrect: false,
//                     important: true,
//                     note: "Division mistake",
//                 }
//             ]
//         }
//     ];

//     const MODE_FILTERS = {
//         bad: (q) => q.attempted && !q.isCorrect,
//         important: (q) => q.important,
//         notes: (q) => q.note?.trim()
//     };

//     const filteredQuizzes = quizzes.filter(q =>
//         q.title.toLowerCase().includes(search.toLowerCase())
//     );

//     const reviewQuestions = useMemo(() => {
//         if (!selectedQuiz) return [];
//         return selectedQuiz.questions
//             .filter(MODE_FILTERS[mode])
//             .filter(q =>
//                 q.question.toLowerCase().includes(qSearch.toLowerCase())
//             );
//     }, [selectedQuiz, mode, qSearch]);

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 pt-24 pb-10 flex justify-center">
//             <div className="w-full max-w-3xl px-4">
//                 <h1 className="text-3xl font-bold mb-6 text-slate-800">
//                     📚 Quiz History
//                 </h1>

//                 {!selectedQuiz && (
//                     <input
//                         type="text"
//                         placeholder="Search quiz..."
//                         value={search}
//                         onChange={(e) => setSearch(e.target.value)}
//                         className="w-full mb-8 px-4 py-3 border rounded-xl shadow-sm"
//                     />
//                 )}

//                 {/* QUIZ LIST */}
//                 {!selectedQuiz && (
//                     <div className="grid gap-5">
//                         {filteredQuizzes.map((quiz) => {
//                             const total = quiz.questions.length;
//                             const correct = quiz.questions.filter(q => q.isCorrect).length;
//                             const bad = quiz.questions.filter(q => q.attempted && !q.isCorrect);
//                             const important = quiz.questions.filter(q => q.important);
//                             const notes = quiz.questions.filter(q => q.note?.trim());
//                             const accuracy = total
//                                 ? Math.round((correct / total) * 100)
//                                 : 0;

//                             return (
//                                 <div key={quiz.id} className="bg-white p-6 rounded-2xl shadow-md">
//                                     <div className="flex justify-between mb-2">
//                                         <h3 className="font-semibold">{quiz.title}</h3>
//                                         <span className="text-xs text-gray-500">{quiz.date}</span>
//                                     </div>

//                                     <div className="grid grid-cols-2 gap-2 text-sm mb-3">
//                                         <p>Total: <b>{total}</b></p>
//                                         <p>Correct: <b className="text-green-600">{correct}</b></p>
//                                         <p>Bad Qs: <b className="text-red-600">{bad.length}</b></p>
//                                         <p>⭐ Important: <b>{important.length}</b></p>
//                                         <p>📝 Notes: <b>{notes.length}</b></p>
//                                         <p>Accuracy: <b>{accuracy}%</b></p>
//                                     </div>

//                                     <div className="w-full bg-gray-200 h-2 rounded mb-4">
//                                         <div
//                                             className="bg-blue-500 h-2 rounded"
//                                             style={{ width: `${accuracy}%` }}
//                                         />
//                                     </div>

//                                     <button
//                                         onClick={() => setSelectedQuiz(quiz)}
//                                         className="w-full py-2 bg-blue-500 text-white rounded-lg"
//                                     >
//                                         Review Quiz
//                                     </button>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}

//                 {/* REVIEW SCREEN */}
//                 {selectedQuiz && (
//                     <div className="space-y-6">
//                         <button
//                             onClick={() => {
//                                 setSelectedQuiz(null);
//                                 setMode("bad");
//                             }}
//                             className="text-sm text-blue-600 hover:underline"
//                         >
//                             ⬅ Back
//                         </button>

//                         <div className="sticky top-0 bg-slate-100 pb-4 z-10">
//                             <h2 className="text-2xl font-bold mb-2">
//                                 {selectedQuiz.title}
//                             </h2>

//                             <div className="flex gap-3 mb-3">
//                                 {["bad", "important", "notes"].map((m) => (
//                                     <button
//                                         key={m}
//                                         onClick={() => setMode(m)}
//                                         className={`px-4 py-2 rounded-full text-sm font-medium transition ${
//                                             mode === m
//                                                 ? "bg-blue-500 text-white"
//                                                 : "bg-slate-200"
//                                         }`}
//                                     >
//                                         {m === "bad" && "❌ Bad"}
//                                         {m === "important" && "⭐ Important"}
//                                         {m === "notes" && "📝 Notes"}
//                                     </button>
//                                 ))}
//                             </div>

//                             <input
//                                 placeholder="Search questions..."
//                                 value={qSearch}
//                                 onChange={(e) => setQSearch(e.target.value)}
//                                 className="w-full px-4 py-2 rounded-xl border"
//                             />
//                         </div>

//                         {!reviewQuestions.length && <p>No questions here 🎉</p>}

//                         {reviewQuestions.map((q, i) => (
//                             <div key={q.id} className="bg-white rounded-2xl shadow-lg p-6">
//                                 <div className="flex justify-between items-start mb-3">
//                                     <h4 className="text-lg font-semibold">
//                                         {i + 1}. {q.question}
//                                     </h4>
//                                     <span
//                                         className={`text-xs font-bold px-2 py-1 rounded-full ${
//                                             q.isCorrect
//                                                 ? "text-green-600 bg-green-100"
//                                                 : "text-red-600 bg-red-100"
//                                         }`}
//                                     >
//                                         {q.isCorrect ? "Correct" : "Incorrect"}
//                                     </span>
//                                 </div>

//                                 <div className="space-y-2">
//                                     {q.options.map((opt) => (
//                                         <div
//                                             key={opt}
//                                             className={`px-4 py-2 rounded-xl border text-sm font-medium ${
//                                                 q.correctAnswer === opt
//                                                     ? "bg-green-50 border-green-400 text-green-700"
//                                                     : q.userAnswer === opt
//                                                     ? "bg-red-50 border-red-400 text-red-700"
//                                                     : "bg-slate-50 border-slate-200"
//                                             }`}
//                                         >
//                                             {opt}
//                                         </div>
//                                     ))}
//                                 </div>

//                                 <div className="mt-4 text-sm space-y-1">
//                                     <p>✅ Correct: <b>{q.correctAnswer}</b></p>
//                                     <p><b>Answer Explanation:</b> {q.answerExplanation}</p>
//                                     <p><b>Question Explanation:</b> {q.questionExplanation}</p>
//                                     {q.note && <p>📝 Note: {q.note}</p>}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }


import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "../utils/useTheme";
import { supabaseService } from "../services/supabaseService";
import {
  ArrowLeft, Search, BookOpen, CheckCircle, XCircle,
  Star, StickyNote, Target, Clock, ChevronRight
} from "lucide-react";

const normalizeQuestionAnswer = (q, index) => {
  const options = Array.isArray(q?.options)
    ? q.options.map((opt) =>
        typeof opt === "string" ? opt : opt?.optionText ?? opt?.option_text ?? String(opt)
      )
    : [];

  return {
    id: q?.questionId ?? q?.question_id ?? q?.id ?? `${index}`,
    question: q?.questionText ?? q?.question_text ?? q?.question ?? `Question ${index + 1}`,
    options,
    correctAnswer:
      q?.correctAnswer ?? q?.correct_answer_text ?? q?.correct_answer ?? "Refer to explanation",
    answerExplanation:
      q?.answerExplanation ?? q?.explanationAnswer ?? q?.explanation_answer ?? q?.explanation ?? "",
    questionExplanation:
      q?.questionExplanation ?? q?.explanationQuestion ?? q?.explanation_question ?? "",
    attempted: !!(q?.attempted ?? q?.userAnswer !== undefined),
    isCorrect: !!q?.isCorrect,
    important: !!(q?.importantQuestion ?? q?.importance),
    note: q?.notes ?? q?.note ?? "",
    userAnswer: q?.userAnswer,
  };
};

const formatQuizDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const buildHistoryFromAnalytics = (analyticsData) => {
  const mergeUniqueHistoryCards = (primary = [], secondary = []) => {
    const all = [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])];
    const seenIds = new Set();

    const normalized = all
      .filter(Boolean)
      .map((card) => {
        const normalizedId = String(card?.id ?? "").trim();
        const uniqueId = normalizedId || `generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        return {
          ...card,
          sortTs: Number((card?.sortTs ?? Date.parse(card?.date || "")) || 0),
          _uniqueId: uniqueId,
        };
      })
      .filter((card) => {
        if (seenIds.has(card._uniqueId)) return false;
        seenIds.add(card._uniqueId);
        return true;
      })
      .sort((a, b) => Number(b.sortTs || 0) - Number(a.sortTs || 0))
      .map(({ _uniqueId, ...rest }) => rest);

    return normalized;
  };

  const buildLocalFallback = () => {
    if (typeof window === "undefined") return [];

    let storedHistoryList = [];
    try {
      storedHistoryList = JSON.parse(localStorage.getItem("quizHistoryLocalEntries") || "[]");
    } catch {
      storedHistoryList = [];
    }

    if (Array.isArray(storedHistoryList) && storedHistoryList.length) {
      return storedHistoryList
        .map((entry, entryIndex) => {
          const questions = (Array.isArray(entry?.questions) ? entry.questions : []).map((q, index) => ({
            id: q?.id ?? `${entryIndex}-${index}`,
            question: q?.question ?? q?.questionText ?? `Question ${index + 1}`,
            options: Array.isArray(q?.options) ? q.options : [],
            correctAnswer: q?.correctAnswer ?? q?.correct_answer_text ?? q?.correct_answer ?? "Refer to explanation",
            answerExplanation: q?.answerExplanation ?? q?.explanationAnswer ?? q?.explanation_answer ?? q?.explanation ?? "",
            questionExplanation: q?.questionExplanation ?? q?.explanationQuestion ?? q?.explanation_question ?? "",
            attempted: !!q?.attempted,
            isCorrect: !!q?.isCorrect,
            important: !!(q?.importantQuestion ?? q?.importance ?? q?.important),
            note: q?.notes ?? q?.note ?? "",
            userAnswer: q?.userAnswer,
          }));

          const sortTs = Date.parse(entry?.date || "") || 0;
          return {
            id: entry?.id || `latest-local-quiz-${entryIndex}`,
            title: entry?.title || "Latest Quiz",
            date: formatQuizDate(entry?.date || new Date().toISOString()),
            sortTs,
            questions,
            _summary: {
              total: questions.length,
              correct: questions.filter((q) => q.isCorrect).length,
              bad: questions.filter((q) => q.attempted && !q.isCorrect).length,
              important: questions.filter((q) => q.important).length,
              notes: questions.filter((q) => (q.note || "").trim()).length,
            },
          };
        })
        .sort((a, b) => b.sortTs - a.sortTs);
    }

    let storedHistoryEntry = null;
    try {
      storedHistoryEntry = JSON.parse(localStorage.getItem("lastQuizHistoryEntry") || "null");
    } catch {
      storedHistoryEntry = null;
    }

    if (storedHistoryEntry && Array.isArray(storedHistoryEntry.questions) && storedHistoryEntry.questions.length) {
      const questions = storedHistoryEntry.questions.map((q, index) => ({
        id: q?.id ?? `${index}`,
        question: q?.question ?? q?.questionText ?? `Question ${index + 1}`,
        options: Array.isArray(q?.options) ? q.options : [],
        correctAnswer: q?.correctAnswer ?? q?.correct_answer_text ?? q?.correct_answer ?? "Refer to explanation",
        answerExplanation: q?.answerExplanation ?? q?.explanationAnswer ?? q?.explanation_answer ?? q?.explanation ?? "",
        questionExplanation: q?.questionExplanation ?? q?.explanationQuestion ?? q?.explanation_question ?? "",
        attempted: !!q?.attempted,
        isCorrect: !!q?.isCorrect,
        important: !!(q?.importantQuestion ?? q?.importance ?? q?.important),
        note: q?.notes ?? q?.note ?? "",
        userAnswer: q?.userAnswer,
      }));

      const sortTs = Date.parse(storedHistoryEntry.date || "") || Date.now();
      return [
        {
          id: storedHistoryEntry.id || "latest-local-quiz",
          title: storedHistoryEntry.title || "Latest Quiz",
          date: formatQuizDate(storedHistoryEntry.date || new Date().toISOString()),
          sortTs,
          questions,
          _summary: {
            total: questions.length,
            correct: questions.filter((q) => q.isCorrect).length,
            bad: questions.filter((q) => q.attempted && !q.isCorrect).length,
            important: questions.filter((q) => q.important).length,
            notes: questions.filter((q) => (q.note || "").trim()).length,
          },
        },
      ];
    }

    let storedAnswers = [];
    try {
      storedAnswers = JSON.parse(localStorage.getItem("lastQuizQuestionAnswers") || "[]");
    } catch {
      storedAnswers = [];
    }

    if (!Array.isArray(storedAnswers) || storedAnswers.length === 0) return [];

    const questions = storedAnswers.map((q, index) => ({
      id: q?.questionId ?? q?.question_id ?? `${index}`,
      question: q?.questionText ?? q?.question_text ?? `Question ${index + 1}`,
      options: Array.isArray(q?.options) ? q.options : [],
      correctAnswer: q?.correctAnswer ?? q?.correct_answer_text ?? q?.correct_answer ?? "Refer to explanation",
      answerExplanation: q?.answerExplanation ?? q?.explanationAnswer ?? q?.explanation_answer ?? q?.explanation ?? "",
      questionExplanation: q?.questionExplanation ?? q?.explanationQuestion ?? q?.explanation_question ?? "",
      attempted: !!q?.attempted,
      isCorrect: !!q?.isCorrect,
      important: !!(q?.importantQuestion ?? q?.importance),
      note: q?.notes ?? q?.note ?? "",
      userAnswer: q?.userAnswer,
    }));

    return [
      {
        id: "latest-local-quiz",
        title: "Latest Quiz",
        date: new Date().toISOString().slice(0, 10),
        sortTs: Date.now(),
        questions,
        _summary: {
          total: questions.length,
          correct: questions.filter((q) => q.isCorrect).length,
          bad: questions.filter((q) => q.attempted && !q.isCorrect).length,
          important: questions.filter((q) => q.important).length,
          notes: questions.filter((q) => (q.note || "").trim()).length,
        },
      },
    ];
  };

  const candidates = [
    analyticsData?.quizHistory,
    analyticsData?.quizzes,
    analyticsData?.attempts,
    analyticsData?.sessions,
    analyticsData?.raw?.quizHistory,
    analyticsData?.raw?.quizzes,
    analyticsData?.raw?.attempts,
    analyticsData?.raw?.sessions,
  ];

  const attemptsArray = candidates.find((arr) => Array.isArray(arr));
  const localCards = buildLocalFallback();

  if (Array.isArray(attemptsArray) && attemptsArray.length) {
    const serverCards = attemptsArray
      .map((attempt, index) => {
        const rawQuestions =
          (Array.isArray(attempt?.questionAnswers) && attempt.questionAnswers) ||
          (Array.isArray(attempt?.questions) && attempt.questions) ||
          [];

        const questions = rawQuestions.map(normalizeQuestionAnswer);
        const total = questions.length;
        const correct = questions.filter((q) => q.isCorrect).length;

        return {
          id: attempt?.id ?? attempt?.attemptId ?? `attempt-${index}`,
          title:
            attempt?.title ??
            attempt?.quizTitle ??
            attempt?.submoduleName ??
            attempt?.subModuleName ??
            "Quiz",
          date: formatQuizDate(attempt?.finishedAt ?? attempt?.submittedAt ?? attempt?.created_at ?? attempt?.date),
          sortTs: Date.parse(attempt?.finishedAt ?? attempt?.submittedAt ?? attempt?.created_at ?? attempt?.date ?? "") || 0,
          questions,
          _summary: {
            total,
            correct,
            bad: questions.filter((q) => q.attempted && !q.isCorrect).length,
            important: questions.filter((q) => q.important).length,
            notes: questions.filter((q) => (q.note || "").trim()).length,
          },
        };
      })
      .sort((a, b) => b.sortTs - a.sortTs);

    return mergeUniqueHistoryCards(serverCards, localCards);
  }

  const fallbackQuestionsRaw =
    (Array.isArray(analyticsData?.questionAnswers) && analyticsData.questionAnswers) ||
    (Array.isArray(analyticsData?.raw?.questionAnswers) && analyticsData.raw.questionAnswers) ||
    [];

  if (fallbackQuestionsRaw.length) {
    const questions = fallbackQuestionsRaw.map(normalizeQuestionAnswer);
    const serverFallbackCards = [
      {
        id: "latest-quiz",
        title: "Latest Quiz",
        date: new Date().toISOString().slice(0, 10),
        sortTs: Date.now(),
        questions,
        _summary: {
          total: questions.length,
          correct: questions.filter((q) => q.isCorrect).length,
          bad: questions.filter((q) => q.attempted && !q.isCorrect).length,
          important: questions.filter((q) => q.important).length,
          notes: questions.filter((q) => (q.note || "").trim()).length,
        },
      },
    ];

    return mergeUniqueHistoryCards(serverFallbackCards, localCards);
  }

  const byDateObject =
    analyticsData?.raw?.byDate ??
    analyticsData?.byDate ??
    analyticsData?.raw?.datewise ??
    analyticsData?.datewise ??
    {};

  if (byDateObject && typeof byDateObject === "object" && !Array.isArray(byDateObject)) {
    const cards = Object.entries(byDateObject)
      .map(([day, stat], index) => {
        const correct = Number(stat?.correctAnswers ?? stat?.correct ?? stat?.totalCorrect ?? 0);
        const wrong = Number(stat?.incorrectAnswers ?? stat?.incorrect ?? stat?.totalIncorrect ?? 0);
        const attempted = Number(stat?.attempted ?? stat?.attended ?? stat?.totalQuestionsAttempted ?? correct + wrong);
        const total = Number(stat?.totalQuestions ?? stat?.total ?? attempted);

        return {
          id: `day-${day}-${index}`,
          title: "Quiz Attempt",
          date: formatQuizDate(day),
          sortTs: Date.parse(day) || 0,
          questions: [],
          _summary: {
            total,
            correct,
            bad: wrong,
            important: Number(stat?.important ?? 0),
            notes: Number(stat?.notes ?? 0),
          },
        };
      })
      .sort((a, b) => b.sortTs - a.sortTs);

    if (cards.length) return mergeUniqueHistoryCards(cards, localCards);
  }

  return localCards;
};

export default function QuizHistory() {
  const [search, setSearch] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [mode, setMode] = useState("bad");
  const [qSearch, setQSearch] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const googleId = useSelector((state) => state.auth?.signupData?.googleId);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      if (!googleId) {
        if (!cancelled) {
          setLoadingHistory(false);
          setHistoryError("Login required to load quiz history.");
          setQuizzes([]);
        }
        return;
      }

      try {
        if (!cancelled) setHistoryError("");
        const analytics = await supabaseService.getAnalytics(googleId, null, { forceRefresh: true });
        const mapped = buildHistoryFromAnalytics(analytics);
        if (!cancelled) {
          setQuizzes(mapped);
          setLoadingHistory(false);
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(err?.message || "Failed to load quiz history");
          setLoadingHistory(false);
          setQuizzes([]);
        }
      }
    };

    loadHistory();
    const intervalId = setInterval(loadHistory, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [googleId]);

  useEffect(() => {
    if (!selectedQuiz) return;
    const updated = quizzes.find((q) => String(q.id) === String(selectedQuiz.id));
    if (updated) setSelectedQuiz(updated);
  }, [quizzes, selectedQuiz]);

  const MODE_FILTERS = {
    bad: (q) => q.attempted && !q.isCorrect,
    important: (q) => q.important,
    notes: (q) => q.note?.trim(),
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  const reviewQuestions = useMemo(() => {
    if (!selectedQuiz) return [];
    return selectedQuiz.questions
      .filter(MODE_FILTERS[mode])
      .filter(q => String(q.question || "").toLowerCase().includes(qSearch.toLowerCase()));
  }, [selectedQuiz, mode, qSearch]);

  // ── Shared input style ────────────────────────────────────────────────
  const inputStyle = {
    background: isDark ? "#0B0F19" : "#F8FAFC",
    border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
    color: isDark ? "#E5E7EB" : "#0F172A",
    borderRadius: 12,
    padding: "10px 16px 10px 40px",
    width: "100%",
    outline: "none",
    fontSize: 14,
  };

  return (
    <div
      className="min-h-screen pt-24 pb-16 px-4 transition-colors duration-300"
     
    >
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none"
        style={{ background: isDark ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)" : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)" }} />

      <div className="max-w-3xl mx-auto relative z-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <BookOpen size={18} style={{ color: "#6366F1" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
              Quiz History
            </h1>
            <p className="text-xs transition-colors" style={{ color: isDark ? "#90949bff" : "#94A3B8" }}>
              Review your past performance
            </p>
          </div>
        </div>

        {/* ── QUIZ LIST ── */}
        {!selectedQuiz && (
          <>
            {/* Search */}
           <div className="relative mb-8 group ">
  {/* 1. Icon with dynamic color */}
  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors duration-300">
    <Search 
      size={18} 
      className={`transition-colors duration-300 ${
        isDark ? "text-slate-500 group-focus-within:text-indigo-400" : "text-slate-400 group-focus-within:text-slate-950"
      }`} 
    />
  </div>

  {/* 2. The Input */}
  <input
    type="text"
    placeholder="Search quizzes..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 outline-none transition-all duration-300 font-medium
    ${
      isDark
        ? "bg-[#0B0F19] text-slate-100 placeholder:text-slate-400 border-[#87CEFA] focus:border-indigo-500 shadow-lg shadow-black/20 focus:shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]"
        : "bg-white text-slate-900 placeholder:text-slate-400 border-slate-950 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] focus:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] focus:-translate-x-0.5 focus:-translate-y-0.5"
    }`}
  />


</div>

            <div className="space-y-4">
              {loadingHistory && (
                <div className="rounded-2xl p-6"
                  style={{ background: isDark ? "#111827" : "#FFFFFF", border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}` }}>
                  <p style={{ color: isDark ? "#9CA3AF" : "#64748B" }}>Loading real-time history...</p>
                </div>
              )}

              {!loadingHistory && historyError && (
                <div className="rounded-2xl p-6"
                  style={{ background: isDark ? "rgba(127,29,29,0.20)" : "#FEF2F2", border: `1px solid ${isDark ? "rgba(248,113,113,0.35)" : "#FECACA"}` }}>
                  <p style={{ color: isDark ? "#FCA5A5" : "#B91C1C" }}>{historyError}</p>
                </div>
              )}

              {filteredQuizzes.map((quiz) => {
                const total = quiz._summary?.total ?? quiz.questions.length;
                const correct = quiz._summary?.correct ?? quiz.questions.filter(q => q.isCorrect).length;
                const bad = quiz._summary?.bad ?? quiz.questions.filter(q => q.attempted && !q.isCorrect).length;
                const important = quiz._summary?.important ?? quiz.questions.filter(q => q.important).length;
                const notes = quiz._summary?.notes ?? quiz.questions.filter(q => q.note?.trim()).length;
                const accuracy = total ? Math.round((correct / total) * 100) : 0;
                const accuracyColor = accuracy >= 75 ? "#22C55E" : accuracy >= 50 ? "#F59E0B" : "#EF4444";

                return (
                  <div
                    key={quiz.id}
                    className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: isDark ? "#111827" : "#FFFFFF",
                      border: `2px solid ${isDark ? "#87CEFA" : "#E2E8F0"}`,
                      boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.25)" : "0 4px 16px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Top accent */}
                    <div className="h-px w-full mb-4 rounded"
                      style={{ background: "linear-gradient(to right, transparent, rgba(99,102,241,0.4), transparent)" }} />

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                          {quiz.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={11} style={{ color: isDark ? "#5783daff" : "#2d3238ff" }} />
                          <span className="text-xs transition-colors" style={{ color: isDark ? "#abababff" : "#3b4149ff" }}>
                            {quiz.date}
                          </span>
                        </div>
                      </div>

                      {/* Score ring */}
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold" style={{ color: accuracyColor }}>{accuracy}%</span>
                        <span className="text-xs" style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>accuracy</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: isDark ? "#1F2937" : "#E2E8F0" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${accuracy}%`, background: accuracyColor }} />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { icon: <CheckCircle size={13} style={{ color: "#22C55E" }} />, label: "Correct", value: correct, color: isDark ? "#4ADE80" : "#16A34A" },
                        { icon: <XCircle size={13} style={{ color: "#EF4444" }} />, label: "Wrong", value: bad, color: isDark ? "#F87171" : "#DC2626" },
                        { icon: <Target size={13} style={{ color: "#6366F1" }} />, label: "Total", value: total, color: isDark ? "#A5B4FC" : "#4F46E5" },
                        { icon: <Star size={13} style={{ color: "#F59E0B" }} />, label: "Important", value: important, color: isDark ? "#FBBF24" : "#D97706" },
                        { icon: <StickyNote size={13} style={{ color: "#06B6D4" }} />, label: "Notes", value: notes, color: isDark ? "#22D3EE" : "#0891B2" },
                      ].map((stat, i) => (
                        <div key={i} className="rounded-xl p-3 flex flex-col gap-1"
                          style={{ background: isDark ? "#0B0F19" : "#F8FAFC", border: `2px solid ${isDark ? "#1F2937" : "#5c6269ff"}` }}>
                          <div className="flex items-center gap-1.5">{stat.icon}
                            <span className="text-xs transition-colors" style={{ color: isDark ? "#b5bac2ff" : "#3e434bff" }}>{stat.label}</span>
                          </div>
                          <span className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setSelectedQuiz(quiz)}
                      className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] hover:shadow-lg"
                      style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)", boxShadow: "0 4px 16px rgba(99,102,241,0.25)" }}
                    >
                      Review Quiz <ChevronRight size={15} />
                    </button>
                  </div>
                );
              })}

              {!loadingHistory && filteredQuizzes.length === 0 && (
                <div className="text-center py-16 rounded-2xl"
                  style={{ background: isDark ? "#111827" : "#FFFFFF", border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}` }}>
                  <p style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>No quizzes found in history.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── REVIEW SCREEN ── */}
        {selectedQuiz && (
          <div className="space-y-5">
            {/* Back */}
            <button
              onClick={() => { setSelectedQuiz(null); setMode("bad"); setQSearch(""); }}
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
              onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A"}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569"}
            >
              <ArrowLeft size={15} /> Back to History
            </button>

            {/* Sticky header */}
            <div
              className="sticky top-16 z-20 rounded-2xl p-4 transition-colors"
              style={{
                background: isDark ? "rgba(11,15,25,0.92)" : "rgba(240,244,255,0.92)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
              }}
            >
              <h2 className="text-xl font-bold mb-3 transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                {selectedQuiz.title}
              </h2>

              {/* Mode tabs */}
              <div className="flex gap-2 mb-3">
                {[
                  { key: "bad", icon: <XCircle size={13} />, label: "Wrong" },
                  { key: "important", icon: <Star size={13} />, label: "Important" },
                  { key: "notes", icon: <StickyNote size={13} />, label: "Notes" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: mode === m.key ? "linear-gradient(135deg, #6366F1, #3B82F6)" : (isDark ? "#111827" : "#FFFFFF"),
                      color: mode === m.key ? "#FFFFFF" : (isDark ? "#9CA3AF" : "#475569"),
                      border: `1px solid ${mode === m.key ? "transparent" : (isDark ? "#1F2937" : "#E2E8F0")}`,
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? "#6B7280" : "#94A3B8" }} />
                <input
                  placeholder="Search questions..."
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#6366F1"}
                  onBlur={(e) => e.target.style.borderColor = isDark ? "#1F2937" : "#E2E8F0"}
                />
              </div>
            </div>

            {/* Empty state */}
            {!reviewQuestions.length && (
              <div className="text-center py-16 rounded-2xl"
                style={{ background: isDark ? "#111827" : "#FFFFFF", border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}` }}>
                <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "#22C55E" }} />
                <p className="font-semibold" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>Nothing here!</p>
                <p className="text-sm mt-1" style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>
                  No questions match this filter 🎉
                </p>
              </div>
            )}

            {/* Question cards */}
            {reviewQuestions.map((q, i) => (
              <div
                key={q.id}
                className="rounded-2xl p-6 transition-colors"
                style={{
                  background: isDark ? "#111827" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                  boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                {(() => {
                  const normalizedCorrectAnswer =
                    q?.correctAnswer != null && String(q.correctAnswer).trim()
                      ? String(q.correctAnswer)
                      : "Not available";

                  const answerText =
                    q?.answerExplanation && String(q.answerExplanation).trim()
                      ? String(q.answerExplanation)
                      : `Correct answer: ${normalizedCorrectAnswer}`;

                  const contextText =
                    q?.questionExplanation && String(q.questionExplanation).trim()
                      ? String(q.questionExplanation)
                      : "No additional context available for this question.";

                  return (
                    <>
                {/* Question header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h4 className="text-base font-semibold leading-snug transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                    <span style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>{i + 1}.{" "}</span>
                    {q.question}
                  </h4>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: q.isCorrect ? (isDark ? "rgba(34,197,94,0.12)" : "#DCFCE7") : (isDark ? "rgba(239,68,68,0.12)" : "#FEE2E2"),
                      color: q.isCorrect ? (isDark ? "#4ADE80" : "#16A34A") : (isDark ? "#F87171" : "#DC2626"),
                      border: `1px solid ${q.isCorrect ? (isDark ? "rgba(34,197,94,0.25)" : "#BBF7D0") : (isDark ? "rgba(239,68,68,0.25)" : "#FECACA")}`,
                    }}
                  >
                    {q.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {(Array.isArray(q.options) ? q.options : []).map((opt) => {
                    const isCorrect = q.correctAnswer === opt;
                    const isUserWrong = q.userAnswer === opt && !isCorrect;

                    let bg, border, textCol;
                    if (isCorrect) {
                      bg = isDark ? "rgba(34,197,94,0.10)" : "#F0FDF4";
                      border = isDark ? "rgba(34,197,94,0.30)" : "#86EFAC";
                      textCol = isDark ? "#4ADE80" : "#166534";
                    } else if (isUserWrong) {
                      bg = isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2";
                      border = isDark ? "rgba(239,68,68,0.30)" : "#FCA5A5";
                      textCol = isDark ? "#F87171" : "#991B1B";
                    } else {
                      bg = isDark ? "#0B0F19" : "#F8FAFC";
                      border = isDark ? "#1F2937" : "#E2E8F0";
                      textCol = isDark ? "#9CA3AF" : "#475569";
                    }

                    return (
                      <div
                        key={opt}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between"
                        style={{ background: bg, border: `1px solid ${border}`, color: textCol }}
                      >
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle size={14} style={{ color: isDark ? "#4ADE80" : "#22C55E" }} />}
                        {isUserWrong && <XCircle size={14} style={{ color: isDark ? "#F87171" : "#EF4444" }} />}
                      </div>
                    );
                  })}

                  {(!Array.isArray(q.options) || q.options.length === 0) && (
                    <div className="px-4 py-2.5 rounded-xl text-sm"
                      style={{ background: isDark ? "#0B0F19" : "#F8FAFC", border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`, color: isDark ? "#9CA3AF" : "#475569" }}>
                      No option list available for this question type.
                    </div>
                  )}
                </div>

                {/* Explanations */}
                <div
                  className="rounded-xl p-4 space-y-2 text-sm"
                  style={{ background: isDark ? "#0B0F19" : "#F8FAFC", border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}` }}
                >
                  <p style={{ color: isDark ? "#D1D5DB" : "#374151" }}>
                    <span className="font-semibold" style={{ color: isDark ? "#A5B4FC" : "#4F46E5" }}>Answer: </span>
                    {answerText}
                  </p>
                  <p style={{ color: isDark ? "#D1D5DB" : "#374151" }}>
                    <span className="font-semibold" style={{ color: isDark ? "#A5B4FC" : "#4F46E5" }}>Context: </span>
                    {contextText}
                  </p>
                  {q.note && (
                    <div className="flex items-start gap-2 pt-1">
                      <StickyNote size={13} className="mt-0.5 flex-shrink-0" style={{ color: isDark ? "#22D3EE" : "#0891B2" }} />
                      <p style={{ color: isDark ? "#22D3EE" : "#0E7490" }}>
                        <span className="font-semibold">Note: </span>{q.note}
                      </p>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {q.important && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: isDark ? "rgba(245,158,11,0.12)" : "#FEF9C3", color: isDark ? "#FBBF24" : "#92400E", border: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "#FDE68A"}` }}>
                      <Star size={11} fill="currentColor" /> Important
                    </span>
                  )}
                  {q.note && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: isDark ? "rgba(6,182,212,0.12)" : "#ECFEFF", color: isDark ? "#22D3EE" : "#0E7490", border: `1px solid ${isDark ? "rgba(6,182,212,0.25)" : "#A5F3FC"}` }}>
                      <StickyNote size={11} /> Has Note
                    </span>
                  )}
                </div>

                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}