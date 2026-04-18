// import { useState, useEffect } from "react";
// import PropTypes from "prop-types";

// const MultiSelectQuestion = ({
//   question,
//   onAnswer,
//   savedAnswer = [],
//   isAnswered,
// }) => {
//   const [selected, setSelected] = useState([]);

//   // 🧹 RESET state when question changes
//   useEffect(() => {
//     setSelected([]);
//   }, [question._id]);

//   // 🔁 Restore saved answer when revisiting
//   useEffect(() => {
//     if (Array.isArray(savedAnswer) && savedAnswer.length > 0) {
//       setSelected(savedAnswer);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);


//   const toggleOption = (text) => {
//     if (isAnswered) return;

//     setSelected((prev) =>
//       prev.includes(text)
//         ? prev.filter((v) => v !== text)
//         : [...prev, text]
//     );
//   };

//   const canSubmit = selected.length > 0;

//   const handleSubmit = () => {
//     if (!canSubmit || isAnswered) return;

//     const correctAnswers = question.multi ?? [];

//     const isCorrect =
//       selected.length === correctAnswers.length &&
//       [...selected].sort().every(
//         (v, i) => v === [...correctAnswers].sort()[i]
//       );

//     // commit answer to parent
//     onAnswer(selected, isCorrect);
//   };

//   // helpers for per-option evaluation
//   const correctSet = new Set(question.multi ?? []);
//   const isOptionCorrect = (text) => correctSet.has(text);
//   const isOptionSelected = (text) => selected.includes(text);

//   return (
//     <div className="space-y-3">
//       {question.options.map((opt, idx) => {
//         const text = opt.optionText;
//         const selectedOpt = isOptionSelected(text);
//         const correctOpt = isOptionCorrect(text);

//         return (
//           <label
//             key={idx}
//             className={`flex items-center gap-3 p-3 rounded-lg border transition-all
//               ${
//                 isAnswered && selectedOpt
//                   ? correctOpt
//                     ? "bg-green-100 border-green-500"
//                     : "bg-red-100 border-red-500"
//                   : selectedOpt
//                   ? "bg-purple-100 border-purple-400"
//                   : "bg-white border-gray-300"
//               }
//               ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}
//             `}
//           >
//             {/* hidden native checkbox (accessibility) */}
//             <input
//               type="checkbox"
//               checked={selectedOpt}
//               onChange={() => toggleOption(text)}
//               disabled={isAnswered}
//               className="sr-only"
//             />

//             {/* custom checkbox */}
//             <span
//               className={`w-5 h-5 rounded border-2 flex items-center justify-center
//                 ${
//                   isAnswered && selectedOpt
//                     ? correctOpt
//                       ? "bg-green-600 border-green-600"
//                       : "bg-red-700 border-red-700"
//                     : selectedOpt
//                     ? "bg-purple-600 border-purple-600"
//                     : "bg-white border-gray-400"
//                 }
//               `}
//             >
//               {selectedOpt && (
//                 <svg
//                   className="w-3 h-3 text-white"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="3"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 >
//                   <polyline points="20 6 9 17 4 12" />
//                 </svg>
//               )}
//             </span>

//             <span className="text-sm">{text}</span>
//           </label>
//         );
//       })}

//       {!isAnswered && (
//         <button
//           onClick={handleSubmit}
//           disabled={!canSubmit}
//           className={`mt-3 px-4 py-2 rounded-lg font-bold
//             ${
//               canSubmit
//                 ? "bg-purple-600 text-white hover:bg-purple-700"
//                 : "bg-gray-300 text-gray-500 cursor-not-allowed"
//             }
//           `}
//         >
//           Check Answer
//         </button>
//       )}
//     </div>
//   );
// };

// export default MultiSelectQuestion;

// MultiSelectQuestion.propTypes = {
//   question: PropTypes.shape({
//     options: PropTypes.array.isRequired,
//     multi: PropTypes.arrayOf(PropTypes.string).isRequired,
//   }).isRequired,
//   onAnswer: PropTypes.func.isRequired,
//   savedAnswer: PropTypes.array,
//   isAnswered: PropTypes.bool,
// };

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../utils/useTheme";
import { Check, X, Zap } from "lucide-react";

const MultiSelectQuestion = ({
  question,
  onAnswer,
  savedAnswer = [],
  isAnswered,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected([]);
  }, [question._id]);

  useEffect(() => {
    if (Array.isArray(savedAnswer) && savedAnswer.length > 0) {
      setSelected(savedAnswer);
    }
  }, [savedAnswer]);

  const toggleOption = (text) => {
    if (isAnswered) return;
    setSelected((prev) =>
      prev.includes(text) ? prev.filter((v) => v !== text) : [...prev, text]
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0 || isAnswered) return;
    const correctAnswers = question.multi ?? [];
    const isCorrect =
      selected.length === correctAnswers.length &&
      [...selected].sort().every((v, i) => v === [...correctAnswers].sort()[i]);

    onAnswer(selected, isCorrect);
  };

  const getOptionStyles = (text) => {
    const isSelected = selected.includes(text);
    const isCorrect = (question.multi ?? []).includes(text);
    const base = "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 font-bold ";

    if (isAnswered) {
      if (isSelected) {
        if (isCorrect) {
          // ✅ Correct Selection
          return base + (isDark ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-emerald-50 border-emerald-500 text-emerald-700");
        } else {
          // ❌ Wrong Selection (Fixes Red-on-Red)
          return base + (isDark ? "bg-rose-500/10 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "bg-rose-50 border-rose-500 text-rose-700");
        }
      }
      if (isCorrect) {
        // 🟢 Hint: Should have picked this
        return base + (isDark ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500/60" : "bg-emerald-50/50 border-emerald-200 text-emerald-600/60");
      }
      return base + (isDark ? "bg-slate-900/40 border-slate-800 text-slate-600 opacity-40" : "bg-gray-50 border-gray-100 text-gray-400");
    }

    if (isSelected) {
      return base + (isDark ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30" : "bg-indigo-600 border-indigo-500 text-white shadow-md");
    }

    return base + (isDark ? "bg-[#111827] border-slate-800 text-slate-300 hover:border-indigo-500/50" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt, idx) => {
          const text = opt.optionText;
          const isSelected = selected.includes(text);
          const isCorrect = (question.multi ?? []).includes(text);

          return (
            <div
              key={idx}
              onClick={() => toggleOption(text)}
              className={getOptionStyles(text)}
              style={{ cursor: isAnswered ? "default" : "pointer" }}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                isSelected 
                  ? "bg-white border-transparent" 
                  : (isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-300")
              }`}>
                {isSelected && (
                  <Check size={14} className={isAnswered ? (isCorrect ? "text-emerald-600" : "text-rose-600") : "text-indigo-600"} strokeWidth={4} />
                )}
              </div>
              <span className="flex-1">{text}</span>
              
              {isAnswered && isSelected && (
                <div className="flex items-center">
                  {isCorrect ? <Check size={18} className="text-emerald-400" /> : <X size={18} className="text-rose-400" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isAnswered && (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className={`w-full mt-4 h-14 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2
            ${selected.length > 0
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-95"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border-2 border-slate-700"
            }
          `}
        >
          <Zap size={18} /> Check Answers
        </button>
      )}
    </div>
  );
};

export default MultiSelectQuestion;