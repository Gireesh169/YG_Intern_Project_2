import { CheckCircle, Circle, XCircle } from "lucide-react";
import React from "react";
import { useTheme } from "../../utils/useTheme";

const QuizHeader = ({
    data,
    answersRef,
    setShowConceptPanel,
    setIsCorrect,
    setQuestionTimer,
    setShowAnswerExplanationPanel,
    setShowQuestionExplanationPanel,
    setCurrentQuestionIndex,
    setSelectedOption,
    currentQuestionIndex,
    questionBtnRefs,
    questionScrollRef,
    saveResponse,
    timer,
    userResponsesRef,
}) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const scrollQuestionsLeft = () => {
        if (questionScrollRef.current) {
            questionScrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
        }
    };

    const scrollQuestionsRight = () => {
        if (questionScrollRef.current) {
            questionScrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainder = seconds % 60;
        return `${minutes}:${String(remainder).padStart(2, "0")}`;
    };

    const getQuestionStatus = (index) => {
        const q = data[index];
        if (!q) return "not-visited";
        const qid = q._id;
        const ans = answersRef.current[qid] || {};
        const resp = (userResponsesRef.current || []).find((r) => r.questionId === qid) || {};
        const attemptType = ans.attempt_type ?? resp.attempt_type ?? null;
        const attempted = ans.attempted ?? resp.attempted ?? false;
        const correct = ans.isCorrect ?? resp.isCorrect;
        if (ans.is_revision && attemptType === "revision") return "revision";
        if (attemptType === "quiz") {
            if (!attempted) return "quiz-not-answered";
            return correct === false ? "incorrect" : "answered";
        }
        return "not-visited";
    };

    // Theme colors
    const headerBg = isDark ? "#111827" : "#FFFFFF";
    const headerBorder = isDark ? "#1F2937" : "#E2E8F0";
    const textPrimary = isDark ? "#E5E7EB" : "#0F172A";
    const textMuted = isDark ? "#9CA3AF" : "#475569";
    const arrowBg = isDark ? "#1F2937" : "#FFFFFF";
    const arrowBorder = isDark ? "#374151" : "#E2E8F0";
    const legendBorder = isDark ? "rgba(99,102,241,0.20)" : "#E2E8F0";

    const getStatusStyle = (status, isRevision, isCurrent) => {
        let bg, color, border;

        if (isRevision) {
            bg = isDark ? "#1E3A5F" : "#EFF6FF";
            color = isDark ? "#60A5FA" : "#2563EB";
            border = isDark ? "#3B82F6" : "#BFDBFE";
        } else if (status === "incorrect") {
            bg = isDark ? "rgba(239,68,68,0.20)" : "#FEE2E2";
            color = isDark ? "#F87171" : "#DC2626";
            border = isDark ? "rgba(239,68,68,0.40)" : "#FECACA";
        } else if (status === "answered") {
            bg = isDark ? "rgba(34,197,94,0.20)" : "#DCFCE7";
            color = isDark ? "#4ADE80" : "#16A34A";
            border = isDark ? "rgba(34,197,94,0.40)" : "#BBF7D0";
        } else {
            bg = isDark ? "#1F2937" : "#F8FAFC";
            color = isDark ? "#9CA3AF" : "#475569";
            border = isDark ? "#374151" : "#E2E8F0";
        }

        return {
            background: bg,
            color,
            border: `1px solid ${border}`,
            outline: isCurrent
                ? `2px solid ${isDark ? "#6366F1" : "#4F46E5"}`
                : "none",
            outlineOffset: "2px",
            transform: isCurrent ? "scale(1.1)" : "scale(1)",
        };
    };

    return (
        <div
            className="w-full rounded-xl md:rounded-2xl px-2 md:px-4 py-2 md:py-3 flex flex-col md:flex-row items-center gap-3 transition-all overflow-hidden"
            style={{
                background: headerBg,
                border: `2px solid ${headerBorder}`,
                boxShadow: isDark
                    ? "0 4px 24px rgba(0,0,0,0.3)"
                    : "0 4px 16px rgba(0,0,0,0.06)",
            }}
        >
            {/* TIMER */}
            <div
                className="font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-xl flex items-center gap-2 text-xs md:text-sm flex-shrink-0"
                style={{
                    background: isDark
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(99,102,241,0.08)",
                    border: `1px solid ${isDark ? "rgba(99,102,241,0.30)" : "rgba(99,102,241,0.25)"}`,
                    color: isDark ? "#A5B4FC" : "#4F46E5",
                    boxShadow: isDark ? "0 0 12px rgba(99,102,241,0.20)" : "none",
                }}
            >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="font-mono tracking-wider">{formatTime(timer)}</span>
            </div>

            {/* QUESTION SCROLL AREA */}
            <div className="flex-1 flex items-center gap-1 md:gap-2 w-full overflow-hidden">

                {/* LEFT ARROW */}
                <button
                    onClick={scrollQuestionsLeft}
                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-all hover:scale-105"
                    style={{
                        background: arrowBg,
                        border: `1px solid ${arrowBorder}`,
                        color: textMuted,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? "#6366F1" : "#4F46E5";
                        e.currentTarget.style.color = isDark ? "#A5B4FC" : "#4F46E5";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = arrowBorder;
                        e.currentTarget.style.color = textMuted;
                    }}
                >
                    ◀
                </button>

                {/* QUESTIONS */}
                <div
                    ref={questionScrollRef}
                    className="flex gap-1.5 md:gap-2 items-center overflow-x-auto scrollbar-hide scroll-smooth"
                >
                    {data.map((_, index) => {
                        const status = getQuestionStatus(index);
                        const isCurrent = index === currentQuestionIndex;
                        const q = data[index];
                        const saved = answersRef.current[q._id];
                        const isRevision = saved?.attempt_type === "revision";
                        const statusStyle = getStatusStyle(status, isRevision, isCurrent);

                        return (
                            <button
                                key={index}
                                ref={(el) => (questionBtnRefs.current[index] = el)}
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
                                    setShowAnswerExplanationPanel(false);
                                    setShowQuestionExplanationPanel(false);
                                    setShowConceptPanel(false);
                                }}
                                className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0 rounded-lg font-bold text-[10px] md:text-xs relative transition-all flex items-center justify-center"
                                style={statusStyle}
                            >
                                {index + 1}
                                {isRevision && (
                                    <span
                                        className="absolute -top-1.5 -right-1.5 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 shadow-md"
                                        style={{
                                            background: "#3B82F6",
                                            borderColor: isDark ? "#111827" : "#FFFFFF",
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* RIGHT ARROW */}
                <button
                    onClick={scrollQuestionsRight}
                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-all hover:scale-105"
                    style={{
                        background: arrowBg,
                        border: `1px solid ${arrowBorder}`,
                        color: textMuted,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? "#6366F1" : "#4F46E5";
                        e.currentTarget.style.color = isDark ? "#A5B4FC" : "#4F46E5";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = arrowBorder;
                        e.currentTarget.style.color = textMuted;
                    }}
                >
                    ▶
                </button>
            </div>

            {/* LEGEND */}
            <div
                className="flex items-center gap-3 md:gap-4 flex-shrink-0 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-4 w-full md:w-auto justify-center md:justify-start"
                style={{ borderColor: legendBorder }}
            >
                {(() => {
                    const revisionCount = data.filter(
                        (q) => answersRef.current[q._id]?.attempt_type === "revision"
                    ).length;
                    const greenCount = data.filter(
                        (_, i) => getQuestionStatus(i) === "answered"
                    ).length;
                    const redCount = data.filter(
                        (_, i) => getQuestionStatus(i) === "incorrect"
                    ).length;
                    const grayCount = data.length - (greenCount + redCount);

                    return (
                        <>
                            {/* Correct */}
                            <div
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs md:text-sm"
                                style={{
                                    background: isDark ? "rgba(34,197,94,0.10)" : "rgba(34,197,94,0.08)",
                                    border: `1px solid ${isDark ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.20)"}`,
                                }}
                            >
                                <CheckCircle size={13} className="text-emerald-400" />
                                <span
                                    className="font-bold"
                                    style={{ color: isDark ? "#4ADE80" : "#16A34A" }}
                                >
                                    {greenCount}
                                </span>
                            </div>

                            {/* Incorrect */}
                            <div
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs md:text-sm"
                                style={{
                                    background: isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.08)",
                                    border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.20)"}`,
                                }}
                            >
                                <XCircle size={13} className="text-red-400" />
                                <span
                                    className="font-bold"
                                    style={{ color: isDark ? "#F87171" : "#DC2626" }}
                                >
                                    {redCount}
                                </span>
                            </div>

                            {/* Revision */}
                            <div
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs md:text-sm"
                                style={{
                                    background: isDark ? "rgba(59,130,246,0.10)" : "rgba(59,130,246,0.08)",
                                    border: `1px solid ${isDark ? "rgba(59,130,246,0.25)" : "rgba(59,130,246,0.20)"}`,
                                }}
                            >
                                <span className="text-blue-400 font-bold">📘</span>
                                <span
                                    className="font-bold"
                                    style={{ color: isDark ? "#60A5FA" : "#2563EB" }}
                                >
                                    {revisionCount}
                                </span>
                            </div>

                            {/* Not attempted */}
                            <div
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs md:text-sm"
                                style={{
                                    background: isDark ? "rgba(107,114,128,0.10)" : "rgba(107,114,128,0.08)",
                                    border: `1px solid ${isDark ? "rgba(107,114,128,0.25)" : "rgba(107,114,128,0.20)"}`,
                                }}
                            >
                                <Circle size={13} className="text-slate-400" />
                                <span
                                    className="font-bold"
                                    style={{ color: isDark ? "#9CA3AF" : "#64748B" }}
                                >
                                    {grayCount}
                                </span>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default QuizHeader;