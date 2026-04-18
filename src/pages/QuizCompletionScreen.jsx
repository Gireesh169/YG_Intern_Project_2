
import React from "react";
import { Link } from "react-router-dom";
import { Trophy, CheckCircle, XCircle, Clock, Target, Home, Sparkles } from "lucide-react";
import QuizAnalysis from "../components/quiz/QuizAnalysis";
import { useTheme } from "../utils/useTheme";

const QuizCompletionScreen = ({ quizStats, totalTime, questions, userAnswers, onExit }) => {
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const totalQuestions = questions.length;

  if (showAnalysis) {
    return (
      <QuizAnalysis
        questions={questions}
        userAnswers={userAnswers}
        onBack={() => setShowAnalysis(false)}
      />
    );
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const scorePercent = ((quizStats.correct / totalQuestions) * 100).toFixed(1);

  let performanceText = "";
  //let gradientBg = "";
  let performanceColor = "";

  const gradientBg = isDark
  ? "linear-gradient(135deg, #0B0F19, #111827)"
  : "linear-gradient(135deg, #F0F4FF, #E0E7FF)";

  if (scorePercent >= 80) {
    performanceText = "Outstanding! 🌟 You nailed it!";
    performanceColor = isDark ? "#4ADE80" : "#16A34A";
   // gradientBg = "linear-gradient(135deg, #22C55E, #10B981, #059669)";
  } else if (scorePercent >= 50) {
    performanceText = "Good Effort 💪 Keep Improving!";
    performanceColor = isDark ? "#FBBF24" : "#D97706";
   // gradientBg = "linear-gradient(135deg, #F59E0B, #F97316, #EF4444)";
  } else {
    performanceText = "Don't Give Up! 🔥 Practice Makes Perfect!";
    performanceColor = isDark ? "#F87171" : "#DC2626";
   // gradientBg = "linear-gradient(135deg, #EF4444, #F43F5E, #EC4899)";
  }

  const statCards = [
    {
      icon: <CheckCircle className="mx-auto mb-1" size={24} style={{ color: isDark ? "#4ADE80" : "#22C55E" }} />,
      value: quizStats.correct,
      label: "Correct",
      bg: isDark ? "rgba(34,197,94,0.10)" : "#F0FDF4",
      border: isDark ? "rgba(34,197,94,0.25)" : "#BBF7D0",
    },
    {
      icon: <XCircle className="mx-auto mb-1" size={24} style={{ color: isDark ? "#F87171" : "#EF4444" }} />,
      value: quizStats.incorrect,
      label: "Incorrect",
      bg: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2",
      border: isDark ? "rgba(239,68,68,0.25)" : "#FECACA",
    },
    {
      icon: <Clock className="mx-auto mb-1" size={24} style={{ color: isDark ? "#60A5FA" : "#3B82F6" }} />,
      value: formatTime(totalTime),
      label: "Time Taken",
      bg: isDark ? "rgba(59,130,246,0.10)" : "#EFF6FF",
      border: isDark ? "rgba(59,130,246,0.25)" : "#BFDBFE",
    },
    {
      icon: <Target className="mx-auto mb-1" size={24} style={{ color: isDark ? "#FBBF24" : "#F59E0B" }} />,
      value: `${scorePercent}%`,
      label: "Score",
      bg: isDark ? "rgba(245,158,11,0.10)" : "#FFFBEB",
      border: isDark ? "rgba(245,158,11,0.25)" : "#FDE68A",
    },
  ];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: gradientBg }}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-lg h-[90vh] p-8 sm:p-10 text-center relative overflow-hidden flex flex-col items-center justify-center transition-colors duration-300"
        style={{
          background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          border: `2px solid ${isDark ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.6)"}`,
          boxShadow: isDark
            ? "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.18)"
            : "0 25px 50px rgba(0,0,0,0.15)",
        }}
      >
        {/* Sparkles */}
        <Sparkles
          className="absolute top-4 right-4 animate-pulse"
          size={24}
          style={{ color: isDark ? "#FBBF24" : "#F59E0B" }}
        />

        {/* Trophy */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <div
            className="p-5 rounded-full shadow-lg animate-bounce"
            style={{ background: "linear-gradient(135deg, #F59E0B, #F97316, #EC4899)" }}
          >
            <Trophy size={48} className="text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-3xl font-extrabold mt-12 mb-2 transition-colors"
          style={{ color: isDark ? "#E5E7EB" : "#111827" }}
        >
          Quiz Completed 🎉
        </h2>

        {/* Performance text */}
        <p
          className="text-lg font-semibold mb-6 pb-2 transition-colors"
          style={{
            color: performanceColor,
            borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
          }}
        >
          {performanceText}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 w-full">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="rounded-xl p-3 hover:scale-105 transition-all duration-200"
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
              }}
            >
              {card.icon}
              <p
                className="font-semibold text-lg transition-colors"
                style={{ color: isDark ? "#E5E7EB" : "#111827" }}
              >
                {card.value}
              </p>
              <p
                className="text-xs transition-colors"
                style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
              >
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => setShowAnalysis(true)}
            className="w-full text-white py-3 rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25"
            style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
          >
            View Detailed Analysis
          </button>

          <button
            onClick={onExit}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]"
            style={{
              background: isDark ? "rgba(255,255,255,0.08)" : "#111827",
              color: isDark ? "#E5E7EB" : "#FFFFFF",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "transparent"}`,
            }}
          >
            <Home size={18} />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizCompletionScreen;