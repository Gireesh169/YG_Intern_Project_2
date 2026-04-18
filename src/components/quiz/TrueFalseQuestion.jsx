
  import React, { useState, useEffect } from "react";
  import { useTheme } from "../../utils/useTheme";

  const TrueFalseQuestion = ({ question, onAnswer, savedAnswer, isAnswered }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const normalizeToTF = (val) => {
      if (val === null || val === undefined) return null;
      if (val === true || val === "true" || val === "True") return "True";
      if (val === false || val === "false" || val === "False") return "False";
      return null;
    };

    const [selectedAnswer, setSelectedAnswer] = useState(() => normalizeToTF(savedAnswer));

    useEffect(() => {
      setSelectedAnswer(normalizeToTF(savedAnswer));
    }, [savedAnswer]);

    const normalizedCorrect = normalizeToTF(question?.correctAnswer);

    const handleAnswer = (answerStr) => {
      if (isAnswered) return;
      const norm = normalizeToTF(answerStr);
      if (!norm) return;
      setSelectedAnswer(norm);
      const isCorrect = norm === normalizedCorrect;
      if (typeof onAnswer === "function") onAnswer(norm, isCorrect);
    };

    return (
      <div className="space-y-6">


    {/* Question Box */}

        <div className="space-y-4">
          {["True", "False"].map((option) => {
            const isSelected = selectedAnswer === option;
            const isThisCorrect = option === normalizedCorrect;

            // --- CORE THEME LOGIC ---
            let borderColor, bgColor, textColor, boxShadow;

            if (isAnswered) {
              if (isSelected && isThisCorrect) {
                // 🟢 Correct Selection (Glow)
                borderColor = "#10B981";
                bgColor = isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5";
                textColor = isDark ? "#34D399" : "#065F46";
                boxShadow = isDark ? "0 0 20px rgba(16, 185, 129, 0.15)" : "none";
              } else if (isSelected && !isThisCorrect) {
                // 🔴 Wrong Selection (Rose Glow - Fixes Red-on-Red)
                borderColor = "#F43F5E";
                bgColor = isDark ? "rgba(244, 63, 94, 0.12)" : "#FFF1F2";
                textColor = isDark ? "#FB7185" : "#9F1239";
                boxShadow = isDark ? "0 0 20px rgba(244, 63, 94, 0.15)" : "none";
              } else if (isThisCorrect) {
                // 🟢 Hint: This was actually the correct one
                borderColor = isDark ? "rgba(16, 185, 129, 0.3)" : "#A7F3D0";
                bgColor = isDark ? "rgba(16, 185, 129, 0.05)" : "#F0FDF4";
                textColor = isDark ? "#6EE7B7" : "#047857";
                boxShadow = "none";
              } else {
                // ⚪ Neutral/Disabled
                borderColor = isDark ? "#1F2937" : "#E5E7EB";
                bgColor = isDark ? "rgba(15, 23, 42, 0.4)" : "#F9FAFB";
                textColor = isDark ? "#4B5563" : "#9CA3AF";
                boxShadow = "none";
              }
            } else if (isSelected) {
              // 🔵 Active Selection
              borderColor = "#6366F1";
              bgColor = "#6366F1";
              textColor = "#FFFFFF";
              boxShadow = isDark ? "0 8px 24px rgba(99, 102, 241, 0.35)" : "0 4px 12px rgba(99, 102, 241, 0.25)";
            } else {
              // 🌑 Default State (Prevents Whiteout)
              borderColor = isDark ? "#1F2937" : "#E2E8F0";
              bgColor = isDark ? "#111827" : "#FFFFFF";
              textColor = isDark ? "#CBD5E1" : "#334155";
              boxShadow = "none";
            }

            return (
              <button
                key={option}
                type="button"
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                className="w-full p-5 text-left rounded-2xl border-2 transition-all duration-300 font-bold flex items-center justify-between"
                style={{
                  background: bgColor,
                  borderColor,
                  boxShadow,
                  opacity: isAnswered && !isSelected && !isThisCorrect ? 0.45 : 1,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: isSelected && !isAnswered
                        ? "rgba(255, 255, 255, 0.20)"
                        : isDark ? "#1F2937" : "#F1F5F9",
                    }}
                  >
                    {option === "True" ? "✅" : "❌"}
                  </div>
                  <span className="text-lg tracking-tight" style={{ color: textColor }}>
                    {option}
                  </span>
                </div>

                {/* Status Badges */}
                {isAnswered && (
                  <div className="flex items-center gap-2">
                    {isThisCorrect && (
                      <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                        style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)", color: isDark ? "#34D399" : "#065F46" }}>
                        Correct
                      </div>
                    )}
                    {!isThisCorrect && isSelected && (
                      <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                        style={{ background: "rgba(244, 63, 94, 0.1)", borderColor: "rgba(244, 63, 94, 0.2)", color: isDark ? "#FB7185" : "#9F1239" }}>
                        Incorrect
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Logic Summary Box */}
        {isAnswered && normalizedCorrect && (
          <div className="p-5 rounded-[1.5rem] border-2 border-dashed flex items-center gap-4"
            style={{ background: isDark ? "rgba(99, 102, 241, 0.05)" : "#F5F7FF", borderColor: isDark ? "rgba(99, 102, 241, 0.15)" : "#E0E7FF" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: "rgba(99, 102, 241, 0.15)", color: isDark ? "#A5B4FC" : "#4F46E5" }}>
              i
            </div>
            <p className="text-sm font-bold italic" style={{ color: isDark ? "#94A3B8" : "#4338CA" }}>
              The correct answer for this statement is <span className="underline underline-offset-4" style={{ color: isDark ? "#A5B4FC" : "#4F46E5" }}>{normalizedCorrect.toUpperCase()}</span>.
            </p>
          </div>
        )}
      </div>
    );
  };

  export default TrueFalseQuestion;

