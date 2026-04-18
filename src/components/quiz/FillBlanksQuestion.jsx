import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { parseMathToLatex } from "../../utils/mathParser";
import LatexRenderer from "../common/LatexRenderer";
import { Calculator, Info, X } from "lucide-react";
import { useTheme } from "../../utils/useTheme";

const FillBlanksQuestion = ({
  question,
  onAnswer,
  savedAnswer = undefined,
  isAnswered = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // ✅ defensive blanks
  const blanks = Array.isArray(question?.blanks) ? question.blanks : [];

  const [userAnswers, setUserAnswers] = useState({});
  const [focusedBlank, setFocusedBlank] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);

  // restore saved answers
  useEffect(() => {
    // ✅ restore ONLY when the question is already answered
    if (isAnswered && savedAnswer) {
      const restored = savedAnswer.answers ?? savedAnswer.userAnswer ?? {};
      setUserAnswers(restored);
    }
  }, [isAnswered, savedAnswer]);

  const handleInputChange = (blankIndex, value) => {
    if (isAnswered) return;
    setUserAnswers((prev) => ({ ...prev, [blankIndex]: value }));
  };

  const strNormal = (s) => (s || "").toString().toLowerCase().trim();

  // "Correct" means the LaTeX of the input matches the LaTeX of the blank answer.
  // OR fallback to string match if LaTeX conversion fails or is identical.
  const isBlankCorrectFn = (userVal, correctVal) => {
    // 1. Parser
    const { latex: uLatex } = parseMathToLatex(userVal);
    const { latex: cLatex } = parseMathToLatex(correctVal);

    // 2. Normalize spaces
    const normU = (uLatex || "").replace(/\s/g, "");
    const normC = (cLatex || "").replace(/\s/g, "");

    // 3. Check Math Match 
    if (normU === normC && normC.length > 0) return true;

    // 4. Fallback string match
    return strNormal(userVal) === strNormal(correctVal);
  };

  const canSubmit = () => {
    return blanks.every(
      (_, index) => (userAnswers[index] ?? "").toString().trim() !== ""
    );
  };

  const submitAnswer = () => {
    if (isAnswered || !canSubmit()) return;

    const correct = blanks.every(
      (blank, index) => isBlankCorrectFn(userAnswers[index] ?? "", blank ?? "")
    );

    onAnswer(userAnswers, correct);
  };

  // Helper to insert text at cursor or append
  const insertSymbol = (symbol) => {
    if (focusedBlank === null) return;

    const currentVal = userAnswers[focusedBlank] ?? "";
    const newVal = currentVal + symbol;
    handleInputChange(focusedBlank, newVal);
    // keep focus
    // implementation depends on refs, for now we let it blur or rely on user re-clicking
  };

  const MATH_SYMBOLS = [
    { label: "π", value: "pi", tooltip: "Pi" },
    { label: "θ", value: "theta", tooltip: "Theta" },
    { label: "√", value: "sqrt()", tooltip: "Square Root" },
    { label: "/", value: "/", tooltip: "Fraction" },
    { label: "^", value: "^", tooltip: "Power" },
    { label: "×", value: "*", tooltip: "Multiply" },
    { label: "sin", value: "sin()", tooltip: "Sine" },
    { label: "cos", value: "cos()", tooltip: "Cosine" },
  ];

  const getInputClass = (blankIndex) => {
    const baseClass = "border-2 rounded px-3 py-2 text-center font-medium transition-all";

    if (isAnswered && userAnswers[blankIndex]) {
      const isBlankCorrect = isBlankCorrectFn(userAnswers[blankIndex], blanks[blankIndex]);

      return `${baseClass} ${isBlankCorrect
        ? "border-green-500 bg-green-50 text-green-700"
        : "border-red-500 bg-red-50 text-red-700"
        }`;
    }

    return `${baseClass} ${
      isDark
        ? "border-[#334155] bg-[#0F172A] text-[#E5E7EB] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        : "border-gray-300 bg-white text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    }`;
  };

  // render text + inputs
  const renderQuestionWithBlanks = () => {
    const parts = (question?.questionText ?? "")
  .replace(/\n+/g, " ")
  .split(/_{3,}/);

    const elements = [];

    for (let i = 0; i < blanks.length; i++) {
      // Text part
      elements.push(
        <span key={`text-${i}`} className="text-lg leading-loose">
          <LatexRenderer>{parts[i] ?? ""}</LatexRenderer>
        </span>
      );

      // Input part with relative positioning for tooltip
      const currentVal = userAnswers[i] ?? "";
      const { latex } = parseMathToLatex(currentVal);

      // Tooltip content for "i" button
      const helpContent = (
        <div className="text-left space-y-1">
          <div className="font-bold border-b border-gray-600 pb-1 mb-1 text-gray-300">Cheat Sheet</div>
          <div><span className="text-yellow-400 font-mono">1/2</span> → Fraction</div>
          <div><span className="text-yellow-400 font-mono">x^2</span> → Power</div>
          <div><span className="text-yellow-400 font-mono">sqrt(x)</span> → Root</div>
          <div><span className="text-yellow-400 font-mono">pi</span> → π</div>
        </div>
      );

      elements.push(
        <span key={`input-wrapper-${i}`} className="relative inline-flex items-center mx-1 align-middle gap-1 group">
          <input
            type="text"
            value={currentVal}
            onFocus={() => {
              setFocusedBlank(i);
              // setShowToolbar(true); // User wants manual toggle via button
            }}
            onBlur={() => setTimeout(() => setFocusedBlank(null), 200)}
            onChange={(e) => handleInputChange(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitAnswer();
              }
            }}
            className={getInputClass(i)}
            placeholder={`(${i + 1})`}
            disabled={isAnswered}
            style={{ minWidth: "80px", maxWidth: "150px" }}
            autoComplete="off"
          />

          {/* Controls Container - visible on focus or hover */}
          <span className={`flex flex-col gap-1 ${focusedBlank === i || showToolbar ? 'opacity-100' : 'opacity-100'} transition-opacity`}>
            {/* Calc Button */}
            <button
              type="button"
              onClick={() => {
                setFocusedBlank(i);
                setShowToolbar(!showToolbar);
              }}
              className={`p-1 rounded-full border ${
                showToolbar && focusedBlank === i
                  ? isDark
                    ? "bg-indigo-500/20 border-indigo-400/60 text-indigo-300"
                    : "bg-indigo-100 border-indigo-400 text-indigo-700"
                  : isDark
                    ? "bg-[#111827] border-[#334155] text-gray-300 hover:text-indigo-300"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:text-indigo-600"
              }`}
              title="Toggle Math Keyboard"
            >
              <Calculator size={14} />
            </button>

            {/* Info Button */}
            <div className="relative group/info">
              <button
                type="button"
                className={`p-1 rounded-full border ${
                  isDark
                    ? "bg-[#111827] border-[#334155] text-gray-300 hover:text-blue-300"
                    : "bg-gray-50 border-gray-200 text-gray-400 hover:text-blue-500"
                }`}
              >
                <Info size={14} />
              </button>
              {/* Hover Tooltip for Info */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/info:block z-30 w-40 p-2 bg-gray-800 text-white text-xs rounded shadow-lg pointer-events-none">
                {helpContent}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </span>


          {/* Live Math Tooltip (Generic Preview) */}
          {focusedBlank === i && currentVal.length > 0 && !showToolbar && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 p-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-20 whitespace-nowrap min-w-[60px] text-center pointer-events-none">
              <div className="text-xs text-gray-400 mb-1 border-b border-gray-700 pb-1">Math Preview</div>
              <LatexRenderer>{`$${latex}$`}</LatexRenderer>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </span>
      );
    }

    if (parts[blanks.length]) {
      elements.push(
        <span key="text-last" className="text-lg leading-loose">
          <LatexRenderer>{parts[blanks.length]}</LatexRenderer>
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-4">
      {/* Math Toolbar - Visible when toggled */}
      {!isAnswered && (
        <div className={`transition-all duration-300 overflow-hidden ${showToolbar ? "max-h-24 opacity-100 mb-2" : "max-h-0 opacity-0"}`}>
          <div
            className={`p-3 rounded-xl border-2 shadow-md ${
              isDark
                ? "bg-[#111827] border-indigo-500/30"
                : "bg-white border-indigo-100"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isDark ? "text-indigo-300" : "text-indigo-500"
                }`}
              >
                <Calculator size={14} /> Math Keyboard
              </span>
              <button
                onClick={() => setShowToolbar(false)}
                className={isDark ? "text-gray-400 hover:text-red-300" : "text-gray-400 hover:text-red-500"}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {MATH_SYMBOLS.map((sym) => (
                <button
                  key={sym.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertSymbol(sym.value);
                  }}
                  className={`flex-1 min-w-[3rem] px-3 py-2 border rounded-lg transition-all font-serif italic text-lg shadow-sm ${
                    isDark
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500 hover:text-white"
                      : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white"
                  }`}
                  title={sym.tooltip}
                >
                  {sym.label}
                </button>
              ))}
            </div>
            {/* Helper Text */}
            <div className={`mt-2 text-right text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              Click symbol to insert into active blank
            </div>
          </div>
        </div>
      )}

      <div className={`text-lg font-medium mb-4 whitespace-normal ${isDark ? "text-[#E5E7EB]" : "text-gray-700"}`}>
  <div className="inline-flex flex-wrap items-center gap-1">
    {renderQuestionWithBlanks()}
  </div>
</div>


      {!isAnswered && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={submitAnswer}
            disabled={!canSubmit()}
            className={`px-4 py-2 rounded-lg font-medium ${canSubmit()
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : isDark
                ? "bg-[#1F2937] text-gray-500 cursor-not-allowed"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
          >
            Check Answer
          </button>

          {!canSubmit() && (
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Fill all blanks to check.
            </span>
          )}
        </div>
      )}

      {isAnswered && (
        <div className={`mt-4 p-4 rounded-lg ${isDark ? "bg-[#111827] border border-[#334155]" : "bg-gray-100"}`}>
          <div className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            <strong>Your Answers & Corrections:</strong>
          </div>

          <div className="space-y-1">
            {blanks.map((correctAnswer, index) => {
              // Check if correct answer is already LaTeX (has backslash or braces)
              const isLatex = (str) => /\\|{/.test(str);
              const looksLikeMath = (str) => /[/^]/.test(str) || /pi|theta|sqrt|sin|cos/.test(str);

              return (
                <div key={index} className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-gray-500">({index + 1})</span>

                  <span
                    className={`px-2 py-1 rounded flex items-center gap-2 ${isBlankCorrectFn(userAnswers[index], correctAnswer)
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                      }`}
                  >
                    {/* User Answer - Always show what they typed */}
                    <span>{userAnswers[index] || "Not answered"}</span>

                    {/* Optional: Show rendered user answer if it's complex math */}
                    {looksLikeMath(userAnswers[index] ?? "") && (
                      <span className="text-xs opacity-70 border-l border-current pl-2">
                        <LatexRenderer>{`$${parseMathToLatex(userAnswers[index]).latex}$`}</LatexRenderer>
                      </span>
                    )}
                  </span>

                  <span className="text-gray-400">→</span>

                  <span className="text-gray-600 font-medium flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-bold mr-1">Correct:</span>
                    {/* Correct Answer - NEVER show raw LaTeX */}
                    {isLatex(correctAnswer) ? (
                      <span className="bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        <LatexRenderer>{`$${correctAnswer}$`}</LatexRenderer>
                      </span>
                    ) : looksLikeMath(correctAnswer) ? (
                      <span className="bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        <LatexRenderer>{`$${parseMathToLatex(correctAnswer).latex}$`}</LatexRenderer>
                      </span>
                    ) : (
                      <span>{correctAnswer}</span>
                    )}
                  </span>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

FillBlanksQuestion.propTypes = {
  question: PropTypes.shape({
    questionText: PropTypes.string.isRequired,
    blanks: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onAnswer: PropTypes.func.isRequired,
  savedAnswer: PropTypes.shape({
    answers: PropTypes.object,
    userAnswer: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
      PropTypes.array,
      PropTypes.oneOf([null]),
    ]),
    isCorrect: PropTypes.bool,
  }),
  isAnswered: PropTypes.bool,
};

export default FillBlanksQuestion;
