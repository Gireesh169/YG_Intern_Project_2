import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Lightbulb, Star, ThumbsDown, BookOpen, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import LatexRenderer from '../common/LatexRenderer';
import VoiceExplanationPlayer from '../common/VoiceExplanationPlayer';
import { useTheme } from '../../utils/useTheme';

const QuizAnalysis = ({ questions, userAnswers, onBack }) => {
    const [expandedExplanations, setExpandedExplanations] = useState({});
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const toggleExplanation = (id) => {
        setExpandedExplanations(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatUserAnswer = (answer) => {
        if (answer === null || answer === undefined) return "";
        if (typeof answer === 'object') return Object.values(answer).join(", ");
        return String(answer);
    };

    // Theme base colors
    const pageBg = isDark ? "#0B0F19" : "#F8FAFC";
    const textPrimary = isDark ? "#E5E7EB" : "#111827";
    const textSecondary = isDark ? "#9CA3AF" : "#6B7280";

    const getStatusStyle = (isCorrect) => {
        if (isCorrect === true) return {
            border: isDark ? "rgba(34,197,94,0.35)" : "#BBF7D0",
            bg: isDark ? "rgba(34,197,94,0.08)" : "#F0FDF4",
            badgeBg: isDark ? "rgba(34,197,94,0.15)" : "#DCFCE7",
            badgeText: isDark ? "#4ADE80" : "#15803D",
            icon: <CheckCircle size={14} />,
            text: "Correct",
        };
        if (isCorrect === false) return {
            border: isDark ? "rgba(239,68,68,0.35)" : "#FECACA",
            bg: isDark ? "rgba(239,68,68,0.08)" : "#FEF2F2",
            badgeBg: isDark ? "rgba(239,68,68,0.15)" : "#FEE2E2",
            badgeText: isDark ? "#F87171" : "#B91C1C",
            icon: <XCircle size={14} />,
            text: "Incorrect",
        };
        return {
            border: isDark ? "#1F2937" : "#E5E7EB",
            bg: isDark ? "#111827" : "#FFFFFF",
            badgeBg: isDark ? "rgba(107,114,128,0.15)" : "#F3F4F6",
            badgeText: isDark ? "#9CA3AF" : "#4B5563",
            icon: <AlertCircle size={14} />,
            text: "Not Attempted",
        };
    };

    return (
        <div
            className="min-h-screen p-4 md:p-8 transition-colors duration-300"
            style={{
                backgroundColor: pageBg,
                backgroundSize: "28px 28px",
            }}
        >
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2
                        className="text-2xl font-bold transition-colors"
                        style={{ color: textPrimary }}
                    >
                        Detailed Analysis
                    </h2>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                        style={{
                            background: isDark ? "rgba(107,114,128,0.15)" : "#E5E7EB",
                            color: isDark ? "#E5E7EB" : "#374151",
                            border: `1px solid ${isDark ? "rgba(107,114,128,0.25)" : "#D1D5DB"}`,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(107,114,128,0.25)" : "#D1D5DB"}
                        onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "rgba(107,114,128,0.15)" : "#E5E7EB"}
                    >
                        Back to Summary
                    </button>
                </div>

                <div className="space-y-6">
                    {questions.map((q, index) => {
                        const answerData = userAnswers[q._id] || {};
                        const userAnswerId = answerData.userAnswer;
                        const isCorrect = answerData.isCorrect;
                        const normalizedQuestionType = String(q.questionType || q.question_type || "").toLowerCase();
                        const questionOptions = Array.isArray(q.options) ? q.options : [];

                        const isImportant = answerData.importance || answerData.importantQuestion;
                        const isReported = answerData.report || answerData.badQuestion;
                        const isRevision = answerData.is_revision;
                        const notes = answerData.notes;

                        const selectedOption = questionOptions.find(o => o?._id === userAnswerId);
                        const correctOption = questionOptions.find(o => o?.isCorrect);
                        const status = getStatusStyle(isCorrect);

                        return (
                            <div
                                key={q._id}
                                className="rounded-xl p-5 relative overflow-hidden transition-all hover:shadow-lg"
                                style={{
                                    background: status.bg,
                                    border: `2px solid ${status.border}`,
                                    boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
                                }}
                            >
                                {/* Header row */}
                                <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="font-bold text-lg transition-colors"
                                            style={{ color: textPrimary }}
                                        >
                                            Question {index + 1}
                                        </span>
                                        <div
                                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                                            style={{
                                                background: status.badgeBg,
                                                color: status.badgeText,
                                            }}
                                        >
                                            {status.icon}
                                            <span>{status.text}</span>
                                        </div>
                                    </div>

                                    {/* Metadata badges */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {isImportant && (
                                            <span
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md"
                                                style={{
                                                    background: isDark ? "rgba(245,158,11,0.15)" : "#FEF9C3",
                                                    color: isDark ? "#FBBF24" : "#92400E",
                                                    border: `1px solid ${isDark ? "rgba(245,158,11,0.30)" : "#FDE68A"}`,
                                                }}
                                            >
                                                <Star size={12} fill="currentColor" /> Important
                                            </span>
                                        )}
                                        {isRevision && (
                                            <span
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md"
                                                style={{
                                                    background: isDark ? "rgba(99,102,241,0.15)" : "#EEF2FF",
                                                    color: isDark ? "#A5B4FC" : "#4338CA",
                                                    border: `1px solid ${isDark ? "rgba(99,102,241,0.30)" : "#C7D2FE"}`,
                                                }}
                                            >
                                                <BookOpen size={12} /> Revision
                                            </span>
                                        )}
                                        {isReported && (
                                            <span
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md"
                                                style={{
                                                    background: isDark ? "rgba(239,68,68,0.15)" : "#FEE2E2",
                                                    color: isDark ? "#F87171" : "#B91C1C",
                                                    border: `1px solid ${isDark ? "rgba(239,68,68,0.30)" : "#FECACA"}`,
                                                }}
                                            >
                                                <ThumbsDown size={12} /> Bad Question
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Question text */}
                                <div
                                    className="mb-5 font-medium text-lg leading-relaxed transition-colors"
                                    style={{ color: textPrimary }}
                                >
                                    <LatexRenderer>{q.questionText}</LatexRenderer>
                                </div>

                                {/* Image */}
                                {q.imageName && (
                                    <div className="mb-5">
                                        <img
                                            src={`https://smaranai.soup.io/storage/v1/object/public/question-assets/${q.imageName}`}
                                            alt="Question"
                                            className="max-h-64 rounded-lg"
                                            style={{ border: `1px solid ${isDark ? "#1F2937" : "#E5E7EB"}` }}
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}

                                {/* Options / Answer */}
                                <div className="mb-4 space-y-3">
                                    {[
                                        'mcq',
                                        'mcq_with_option_images',
                                        'passage_mcq',
                                        'image_mcq',
                                    ].includes(normalizedQuestionType) ? (
                                        <div className="grid gap-3">
                                            {/* Wrong user answer */}
                                            {userAnswerId && !isCorrect && (
                                                <div
                                                    className="p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                                    style={{
                                                        background: isDark ? "rgba(239,68,68,0.12)" : "#FEE2E2",
                                                        border: `1px solid ${isDark ? "rgba(239,68,68,0.30)" : "#FECACA"}`,
                                                    }}
                                                >
                                                    <div style={{ color: textPrimary }}>
                                                        <span
                                                            className="block text-xs font-bold uppercase tracking-wide mb-1"
                                                            style={{ color: isDark ? "#F87171" : "#DC2626" }}
                                                        >
                                                            Your Answer
                                                        </span>
                                                        <LatexRenderer>{selectedOption?.optionText || "Unknown Option"}</LatexRenderer>
                                                    </div>
                                                    <XCircle size={20} style={{ color: isDark ? "#F87171" : "#EF4444" }} className="flex-shrink-0" />
                                                </div>
                                            )}

                                            {/* Correct answer */}
                                            <div
                                                className="p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                                style={{
                                                    background: isDark ? "rgba(34,197,94,0.12)" : "#DCFCE7",
                                                    border: `1px solid ${isDark ? "rgba(34,197,94,0.30)" : "#BBF7D0"}`,
                                                }}
                                            >
                                                <div style={{ color: textPrimary }}>
                                                    <span
                                                        className="block text-xs font-bold uppercase tracking-wide mb-1"
                                                        style={{ color: isDark ? "#4ADE80" : "#16A34A" }}
                                                    >
                                                        {isCorrect ? "Your & Correct Answer" : "Correct Answer"}
                                                    </span>
                                                    <LatexRenderer>{correctOption?.optionText || q.correct_answer || "See Explanation"}</LatexRenderer>
                                                </div>
                                                <CheckCircle size={20} style={{ color: isDark ? "#4ADE80" : "#22C55E" }} className="flex-shrink-0" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="p-3 rounded-lg text-sm"
                                            style={{
                                                background: isDark ? "#0B0F19" : "#F3F4F6",
                                                border: `1px solid ${isDark ? "#1F2937" : "#E5E7EB"}`,
                                            }}
                                        >
                                            <div className="grid gap-2">
                                                <div
                                                    className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between pb-2 mb-2"
                                                    style={{ borderBottom: `1px solid ${isDark ? "#1F2937" : "#E5E7EB"}` }}
                                                >
                                                    <strong style={{ color: textSecondary }} className="w-32 flex-shrink-0">Your Answer:</strong>
                                                    <div
                                                        className="flex-1 font-medium"
                                                        style={{ color: isCorrect ? (isDark ? "#4ADE80" : "#16A34A") : (isDark ? "#F87171" : "#DC2626") }}
                                                    >
                                                        {formatUserAnswer(userAnswerId) || "Not answered"}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                                                    <strong style={{ color: textSecondary }} className="w-32 flex-shrink-0">Correct Answer:</strong>
                                                    <div
                                                        className="flex-1 font-medium"
                                                        style={{ color: isDark ? "#4ADE80" : "#16A34A" }}
                                                    >
                                                        {q.correct_answer || "Refer to explanation"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                {notes && notes.trim() !== "" && (
                                    <div
                                        className="mt-4 mb-2 p-3 rounded-lg text-sm flex items-start gap-2"
                                        style={{
                                            background: isDark ? "rgba(99,102,241,0.10)" : "#EEF2FF",
                                            border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "#C7D2FE"}`,
                                        }}
                                    >
                                        <StickyNote size={16} className="mt-0.5 flex-shrink-0" style={{ color: isDark ? "#A5B4FC" : "#6366F1" }} />
                                        <div>
                                            <span
                                                className="font-bold block mb-1"
                                                style={{ color: isDark ? "#A5B4FC" : "#4338CA" }}
                                            >
                                                My Notes
                                            </span>
                                            <span
                                                className="whitespace-pre-wrap"
                                                style={{ color: isDark ? "#E5E7EB" : "#312E81" }}
                                            >
                                                {notes}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Explanation toggle */}
                                {q.explanation && (
                                    <div className="mt-4 pt-2">
                                        <button
                                            onClick={() => toggleExplanation(q._id)}
                                            className="flex items-center gap-2 font-semibold px-3 py-1.5 rounded-lg transition-all"
                                            style={{
                                                background: isDark ? "rgba(99,102,241,0.12)" : "#EDE9FE",
                                                color: isDark ? "#A5B4FC" : "#6D28D9",
                                                border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "#DDD6FE"}`,
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.20)" : "#DDD6FE"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.12)" : "#EDE9FE"}
                                        >
                                            {expandedExplanations[q._id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            {expandedExplanations[q._id] ? "Hide Explanation" : "Show Explanation"}
                                        </button>

                                        {expandedExplanations[q._id] && (
                                            <div className="mt-3">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <VoiceExplanationPlayer text={q.explanation} />
                                                </div>
                                                <div
                                                    className="text-base leading-relaxed whitespace-pre-line p-4 rounded-xl"
                                                    style={{
                                                        background: isDark ? "rgba(99,102,241,0.08)" : "#F5F3FF",
                                                        border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "#EDE9FE"}`,
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    <LatexRenderer>{q.explanation}</LatexRenderer>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default QuizAnalysis;