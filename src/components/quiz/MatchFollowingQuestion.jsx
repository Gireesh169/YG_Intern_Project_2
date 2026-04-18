import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import LatexRenderer from "../common/LatexRenderer";

const MatchFollowingQuestion = ({
  question,
  onAnswer,
  savedAnswer,
  isAnswered,
  isDark,
}) => {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [userMappings, setUserMappings] = useState({});

  useEffect(() => {
    if (savedAnswer == null) return;
    let restored = {};
    if (savedAnswer.mappings || savedAnswer.userAnswer) {
      restored = savedAnswer.mappings ?? savedAnswer.userAnswer ?? {};
    } else {
      restored = savedAnswer;
    }
    setUserMappings(restored);
  }, [savedAnswer]);

  const handleLeftClick = (leftIndex) => {
    if (isAnswered) return;
    if (selectedLeft === leftIndex) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftIndex);
      setSelectedRight(null);
    }
  };

  const handleRightClick = (rightIndex) => {
    if (isAnswered || selectedLeft === null) return;
    if (selectedRight === rightIndex) {
      setSelectedRight(null);
    } else {
      setSelectedRight(rightIndex);
      const newMappings = { ...userMappings, [selectedLeft]: rightIndex };
      setUserMappings(newMappings);
      const allMapped = question.leftItems.every((_, index) => {
        const mapped = newMappings[index];
        return (
          mapped !== undefined &&
          Number.isInteger(mapped) &&
          mapped >= 0 &&
          mapped < question.rightItems.length
        );
      });
      if (allMapped) {
        const correct = question.correctMappings.every(
          (mapping) => newMappings[mapping.leftIndex] === mapping.rightIndex
        );
        onAnswer(newMappings, correct);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  // ─── Shared state classes ───────────────────────────────────────────────────

  // Default: deep navy in dark, white in light
  const defaultCls = isDark
    ? "border-[#374151] bg-[#111827] text-gray-200 hover:bg-[#1a2333] hover:border-[#4B5563]"
    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

  // Active selection
  const selectedCls = isDark
    ? "border-blue-400 bg-blue-900/20 text-blue-300"
    : "border-blue-500 bg-blue-50 text-blue-700";

  // Already paired but not yet submitted
  const mappedCls = isDark
    ? "border-[#4B5563] bg-[#1F2937] text-gray-300"
    : "border-gray-400 bg-gray-100 text-gray-600";

  // Correct answer state
  const correctCls = isDark
    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
    : "border-green-500 bg-green-50 text-green-700";

  // Incorrect answer — high-contrast pale rose (fixes red-on-red in dark mode)
  const incorrectCls = isDark
    ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
    : "border-red-500 bg-red-50 text-red-700";

  // ─── Class resolvers ────────────────────────────────────────────────────────

  const itemBase =
    "h-12 px-4 flex items-center rounded-lg border-2 transition-all duration-150 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.98]";

  const getLeftItemClass = (index) => {
    if (isAnswered) {
      const isCorrect = question.correctMappings.some(
        (m) =>
          Number(m.leftIndex) === Number(index) &&
          Number(m.rightIndex) === Number(userMappings[index])
      );
      return `${itemBase} ${isCorrect ? correctCls : incorrectCls}`;
    }
    if (selectedLeft === index) return `${itemBase} ${selectedCls}`;
    if (userMappings[index] !== undefined) return `${itemBase} ${mappedCls}`;
    return `${itemBase} ${defaultCls}`;
  };

  const getRightItemClass = (index) => {
    if (isAnswered) {
      const isCorrect = question.correctMappings.some(
        (m) =>
          Number(m.rightIndex) === Number(index) &&
          Number(m.leftIndex) ===
            Number(
              Object.keys(userMappings).find(
                (key) => Number(userMappings[key]) === Number(index)
              )
            )
      );
      return `${itemBase} ${isCorrect ? correctCls : incorrectCls}`;
    }
    if (selectedRight === index) return `${itemBase} ${selectedCls}`;
    if (Object.values(userMappings).includes(index)) return `${itemBase} ${mappedCls}`;
    return `${itemBase} ${defaultCls}`;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left Column */}
        <div className="space-y-3">
          <h3 className={`font-semibold mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Column A
          </h3>
          {question.leftItems?.map((item, index) => (
            <div
              key={index}
              className={getLeftItemClass(index)}
              onClick={() => handleLeftClick(index)}
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span><LatexRenderer>{item}</LatexRenderer></span>
                {userMappings[index] !== undefined &&
                  userMappings[index] >= 0 &&
                  question.rightItems &&
                  userMappings[index] < question.rightItems.length && (
                    <span className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      → <LatexRenderer>{question.rightItems[userMappings[index]]}</LatexRenderer>
                    </span>
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h3 className={`font-semibold mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Column B
          </h3>
          {question.rightItems?.map((item, index) => (
            <div
              key={index}
              className={getRightItemClass(index)}
              onClick={() => handleRightClick(index)}
            >
              <span><LatexRenderer>{item}</LatexRenderer></span>
            </div>
          ))}
        </div>
      </div>

      {/* Correct mappings summary */}
      {isAnswered && (
        <div
          className={`mt-4 p-4 rounded-lg border ${
            isDark
              ? "bg-[#111827] border-[#374151] text-gray-300"
              : "bg-gray-100 border-gray-200 text-gray-600"
          }`}
        >
          <div className={`text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
            Correct Mappings
          </div>
          <div className="space-y-1">
            {question.correctMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  <LatexRenderer>{question.leftItems[mapping.leftIndex]}</LatexRenderer>
                </span>
                <span className={isDark ? "text-gray-500" : "text-gray-400"}>→</span>
                <span>
                  <LatexRenderer>{question.rightItems[mapping.rightIndex]}</LatexRenderer>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

MatchFollowingQuestion.propTypes = {
  question: PropTypes.shape({
    questionText: PropTypes.string.isRequired,
    leftItems: PropTypes.arrayOf(PropTypes.string).isRequired,
    rightItems: PropTypes.arrayOf(PropTypes.string).isRequired,
    correctMappings: PropTypes.arrayOf(
      PropTypes.shape({
        leftIndex: PropTypes.number.isRequired,
        rightIndex: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onAnswer: PropTypes.func.isRequired,
  savedAnswer: PropTypes.oneOfType([
    PropTypes.shape({
      mappings: PropTypes.object,
      userAnswer: PropTypes.object,
      isCorrect: PropTypes.bool,
    }),
    PropTypes.object,
  ]),
  isAnswered: PropTypes.bool,
  isDark: PropTypes.bool,
};

MatchFollowingQuestion.defaultProps = {
  savedAnswer: null,
  isAnswered: false,
  isDark: false,
};

export default MatchFollowingQuestion;