import { useEffect, useRef, useState } from "react";
import LatexRenderer from "../../../components/common/LatexRenderer";
import { useTheme } from "../../../utils/useTheme";

import { 
  FiEye, 
  FiEyeOff, 
  FiPlus, 
  FiUpload, 
  FiDownload, 
  FiBookOpen, 
  FiTrash2, 
  FiAlertCircle, 
  FiEdit2 
} from "react-icons/fi";
import { ArrowLeft, Layers, FileText, Award, Zap } from "lucide-react";


/* ===============================
   NORMALIZER (Fix backend mismatch)
================================= */
function normalizeQuestion(q) {
  if (!q) return q;

  return {
    ...q,

    // naming normalization
    questionText: q.questionText || q.question_text || "",
    questionType: q.questionType || q.question_type || "",
    imageName: q.imageName || q.image_name || null,
    leftItems: q.leftItems || q.left_items || [],
    rightItems: q.rightItems || q.right_items || [],
    correctMappings: q.correctMappings || q.correct_mappings || [],
    correctAnswer:
      q.correctAnswer !== undefined
        ? q.correctAnswer
        : q.correct_answer,

    // normalize options
    options: Array.isArray(q.options)
      ? q.options.map(opt =>
        typeof opt === "string"
          ? {
            optionText: opt,
            isCorrect: opt === q.correct_answer_text
          }
          : opt
      )
      : [],

    multi: q.multi || [],
    blanks: q.blanks || []
  };
}

export default function QuestionReviewCard({ question, onChange }) {
  const [form, setForm] = useState(normalizeQuestion(question));
  const containerRef = useRef(null);
      const { theme } = useTheme();
    const isDark = theme === "dark";

  useEffect(() => {
    setForm(normalizeQuestion(question));
  }, [question]);

  /* ===============================
     HELPERS
  ================================= */

  const updateBlank = (index, value) => {
    const blanks = [...(form.blanks || [])];
    blanks[index] = value;
    setForm({ ...form, blanks });
  };

  const updateOption = (i, value) => {
    const options = [...(form.options || [])];
    options[i] = { ...options[i], optionText: value };
    setForm({ ...form, options });
  };

  const setCorrect = i => {
    const options = form.options.map((o, idx) => ({
      ...o,
      isCorrect: idx === i
    }));
    setForm({ ...form, options });
  };

  const setTrueFalse = value => {
    setForm({ ...form, correctAnswer: value });
  };
  const updateLeftItem = (index, value) => {
    const leftItems = [...form.leftItems];
    leftItems[index] = value;
    setForm({ ...form, leftItems });
  };

  const updateRightItem = (index, value) => {
    const rightItems = [...form.rightItems];
    rightItems[index] = value;
    setForm({ ...form, rightItems });
  };

  const toggleMulti = optionText => {
    const current = new Set(form.multi || []);
    current.has(optionText)
      ? current.delete(optionText)
      : current.add(optionText);

    setForm({ ...form, multi: Array.from(current) });
  };

  const updateMapping = (leftIndex, rightIndex) => {
    const mappings = [...(form.correctMappings || [])];
    const existingIndex = mappings.findIndex(
      m => m.leftIndex === leftIndex
    );

    if (existingIndex >= 0) {
      mappings[existingIndex] = { leftIndex, rightIndex };
    } else {
      mappings.push({ leftIndex, rightIndex });
    }

    setForm({ ...form, correctMappings: mappings });
  };

  /* ===============================
     PREVIEW RENDER
  ================================= */

  const renderPreviewOptions = () => {
    switch (form.questionType) {

      case "fillblanks": {
        let text = form.questionText || "";
        (form.blanks || []).forEach(blank => {
          text = text.replace(
            "____",
            `\\colorbox{#d1fae5}{\\text{ ${blank || "____"} }}`
          );
        });

        return (
          <div className={`p-3 border rounded ${
  isDark
    ? "bg-green-900/20 border-green-700 text-slate-200"
    : "bg-green-50"
}`}>
            <LatexRenderer>{text}</LatexRenderer>
          </div>
        );
      }

      case "mcq":
        return form.options?.map((opt, i) => (
          <div
            key={i}
className={`p-3 rounded-xl border mb-2 ${
  opt.isCorrect
    ? (isDark 
        ? "bg-green-900/30 border-green-600 text-green-200"
        : "bg-green-100 border-green-400")
    : (isDark
        ? "bg-slate-800 border-slate-600 text-slate-200"
        : "bg-purple-50 border-gray-300")
}`}
          >
            <LatexRenderer>{opt.optionText}</LatexRenderer>
          </div>
        ));

   case "truefalse":
        return (
          <>
            {/* True Option Preview */}
            <div
              className={`p-3 rounded-xl border mb-2 transition-all duration-300 ${
                form.correctAnswer === true
                  ? (isDark 
                      ? "bg-green-900/30 border-green-600 text-green-200 shadow-[0_0_15px_rgba(22,163,74,0.2)]"
                      : "bg-green-100 border-green-400 text-green-700")
                  : (isDark
                      ? "bg-slate-800/50 border-slate-700 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-400")
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${form.correctAnswer === true ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className="font-bold uppercase text-[10px] tracking-widest">True</span>
              </div>
            </div>

            {/* False Option Preview */}
            <div
              className={`p-3 rounded-xl border mb-2 transition-all duration-300 ${
                form.correctAnswer === false // FIXED: Now checks for False specifically
                  ? (isDark 
                      ? "bg-green-900/30 border-green-600 text-green-200 shadow-[0_0_15px_rgba(22,163,74,0.2)]"
                      : "bg-green-100 border-green-400 text-green-700")
                  : (isDark
                      ? "bg-slate-800/50 border-slate-700 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-400")
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${form.correctAnswer === false ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className="font-bold uppercase text-[10px] tracking-widest">False</span>
              </div>
            </div>
          </>
        );
      case "multi":
        return form.options?.map((opt, i) => {
          const checked = form.multi?.includes(opt.optionText);

          return (
            <div
              key={i}
              className={`p-3 rounded-xl border mb-2 ${checked
  ? (isDark 
      ? "bg-green-900/30 border-green-600 text-green-200"
      : "bg-green-100 border-green-400")
  : (isDark
      ? "bg-slate-800 border-slate-600 text-slate-200"
      : "bg-purple-50 border-gray-300")
                }`}
            >
              <LatexRenderer>{opt.optionText}</LatexRenderer>
            </div>
          );
        });

case "matchfollowing":
  return (
    <div className="space-y-3">
      {/* Show only valid mappings that have both a left and right item */}
      {(form.correctMappings || []).map((m, i) => {
        const leftText = form.leftItems?.[m.leftIndex];
        const rightText = form.rightItems?.[m.rightIndex];
        
        if (!leftText && !rightText) return null;

        return (
          <div
            key={i}
            className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all
              ${isDark 
                ? "bg-green-900/20 border-green-700/50 text-green-100 shadow-[inset_0_1px_10px_rgba(34,197,94,0.1)]"
                : "bg-green-50 border-green-200 text-green-800"}`}
          >
            <div className="flex-1 font-bold">
              <LatexRenderer>{leftText || "???"}</LatexRenderer>
            </div>
            <div className="px-4 opacity-50">
              <Zap className="w-3 h-3 rotate-90" />
            </div>
            <div className="flex-1 font-bold text-right">
              <LatexRenderer>{rightText || "???"}</LatexRenderer>
            </div>
          </div>
        );
      })}
    </div>
  );

      default:
        return <div>Preview not implemented</div>;
    }
  };

  /* ===============================
     COMPONENT UI
  ================================= */

  return (
   <div 
    className={`rounded-[2rem] overflow-hidden transition-all duration-500 relative mb-8
      ${isDark 
        ? "bg-[#111827] border-2 border-[#106BD3]/50 shadow-[0_20px_50px_rgba(0,0,0,0.6)]" 
        : "bg-white border border-slate-200 shadow-xl shadow-blue-500/5"
      }`}
  >
      {/* Preview */}
     <div className={`p-1 mb-2 ${isDark ? 'bg-indigo-500/5' : 'bg-purple-50/50'}`}>
      <div 
        ref={containerRef} 
        className={`m-4 p-6 rounded-2xl border backdrop-blur-md transition-all
          ${isDark 
            ? 'bg-slate-900/40 border-white/5 shadow-inner' 
            : 'bg-white border-purple-100 shadow-sm'
          }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md 
            ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
            Student Preview
          </span>
        </div>
        <div className="flex-1"></div>
          {form.questionText && (
            <div className={`mb-4 text-lg font-bold leading-relaxed ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <LatexRenderer>{form.questionText}</LatexRenderer>
            </div>
          )}
          <div className="space-y-2"></div>
          {renderPreviewOptions()}
        </div>
      </div>

{/* ── Section 2: Admin Editor (Control Center) ── */}
<div className="p-8 space-y-10">
  {/* Question Text Area */}
  <div className="relative group">
    <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 block ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
      Edit Question Content
    </label>
    <textarea
      rows={4}
      className={`w-full p-5 rounded-2xl outline-none transition-all duration-300 font-medium text-base
        ${isDark 
          ? 'bg-[#0B0F19] border-2 border-slate-800 text-slate-200 focus:border-indigo-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' 
          : 'bg-slate-50 border-2 border-slate-100 text-slate-800 focus:border-indigo-400 focus:bg-white shadow-inner'
        }`}
      value={form.questionText}
      onChange={e => setForm({ ...form, questionText: e.target.value })}
    />
  </div>

  {/* Dynamic Logic Container */}
  <div className={`p-6 rounded-[1.5rem] border-2 transition-all ${isDark ? "bg-[#0B0F19]/40 border-slate-800/50" : "bg-slate-50/50 border-slate-100"}`}>
    <div className="flex items-center gap-2 mb-6">
      <Zap className="w-4 h-4 text-amber-400" />
      <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {form.questionType} Editor
      </h4>
    </div>

    <div className="space-y-4">
      {/* 1. MCQ / MULTI */}
      {(form.questionType === "mcq" || form.questionType === "multi") &&
        form.options.map((opt, i) => (
          <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border-2 ${isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-white border-slate-100'}`}>
            <input
              type={form.questionType === "mcq" ? "radio" : "checkbox"}
              checked={form.questionType === "mcq" ? opt.isCorrect : form.multi?.includes(opt.optionText)}
              onChange={() => form.questionType === "mcq" ? setCorrect(i) : toggleMulti(opt.optionText)}
              className="w-6 h-6 accent-indigo-500 cursor-pointer"
            />
            <input
              className={`flex-1 bg-transparent outline-none font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              value={opt.optionText}
              onChange={e => updateOption(i, e.target.value)}
            />
          </div>
        ))}

      {/* 2. TRUE / FALSE */}
      {form.questionType === "truefalse" && (
        <div className="flex gap-4">
          {[true, false].map((val) => (
            <button
              key={val.toString()}
              onClick={() => setTrueFalse(val)}
              className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest border-2 transition-all
                ${form.correctAnswer === val 
                  ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' 
                  : (isDark ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-white border-slate-200 text-slate-400')}`}
            >
              {val ? "True" : "False"}
            </button>
          ))}
        </div>
      )}

      {/* 3. FILL IN THE BLANKS */}
      {form.questionType === "fillblanks" &&
        (form.blanks || []).map((blank, i) => (
          <input
            key={i}
            className={`w-full p-4 rounded-xl border-2 outline-none font-bold
              ${isDark ? 'bg-[#0B0F19] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
            value={blank}
            placeholder={`Answer for Blank ${i + 1}`}
            onChange={e => updateBlank(i, e.target.value)}
          />
        ))}

      {/* 4. MATCH THE FOLLOWING */}
      {form.questionType === "matchfollowing" && (
        <div className="space-y-4">
          {(form.leftItems || []).map((left, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input
                className={`w-1/2 p-3 rounded-xl border-2 ${isDark ? 'bg-[#0B0F19] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                value={left}
                onChange={e => updateLeftItem(i, e.target.value)}
              />
              <select
                className={`flex-1 p-3 rounded-xl border-2 ${isDark ? 'bg-[#0B0F19] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                value={form.correctMappings?.find(m => m.leftIndex === i)?.rightIndex ?? ""}
                onChange={e => updateMapping(i, Number(e.target.value))}
              >
                <option value="">Select Right Pair</option>
                {(form.rightItems || []).map((right, idx) => (
                  <option key={idx} value={idx}>{right}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="mt-6">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Edit Right Side Items</label>
            {(form.rightItems || []).map((right, i) => (
              <input
                key={i}
                className={`w-full p-3 mb-2 rounded-xl border-2 ${isDark ? 'bg-[#0B0F19] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                value={right}
                onChange={e => updateRightItem(i, e.target.value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
</div>
      {/* Footer */}


<div className={`flex flex-wrap gap-4 p-6 border-t transition-all duration-300 ${isDark ? "bg-[#0B0F19]/60 border-slate-800/50 backdrop-blur-md" : "bg-slate-50 border-slate-100"}`}>

  {/* Save Changes - Indigo */}
  <button
    onClick={() => onChange({ ...form, status: "corrected" })}
    className="flex-1 min-w-[150px] h-12 px-6 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border-2 border-transparent"
    style={{ 
      background: "linear-gradient(135deg, #6366F1, #4F46E5)",
      boxShadow: isDark ? "0 8px 20px -6px rgba(99, 102, 241, 0.6)" : "0 8px 15px -4px rgba(99, 102, 241, 0.3)"
    }}
  >
    <FiEdit2 className="w-4 h-4" /> Save
  </button>

  {/* Approve - Emerald */}
  <button
    onClick={() => onChange({ ...form, status: "verified", isActive: true })}
    className="flex-1 min-w-[150px] h-12 px-6 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border-2 border-transparent"
    style={{ 
      background: "linear-gradient(135deg, #10B981, #059669)",
      boxShadow: isDark ? "0 8px 20px -6px rgba(16, 185, 129, 0.6)" : "0 8px 15px -4px rgba(16, 185, 129, 0.3)"
    }}
  >
    <Zap className="w-4 h-4" /> Approve
  </button>

  {/* Reject - Rose */}
  <button
    onClick={() => onChange({ ...form, status: "rejected", isActive: false })}
    className="flex-1 min-w-[150px] h-12 px-6 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border-2 border-transparent"
    style={{ 
      background: "linear-gradient(135deg, #F43F5E, #E11D48)",
      boxShadow: isDark ? "0 8px 20px -6px rgba(244, 63, 94, 0.6)" : "0 8px 15px -4px rgba(244, 63, 94, 0.3)"
    }}
  >
    <FiTrash2 className="w-4 h-4" /> Reject
  </button>

  {/* Disable / Enable - STABILIZED TOGGLE */}
  {form.isActive !== false ? (
    <button
      onClick={() => onChange({ ...form, isActive: false })}
      className={`flex-1 min-w-[150px] h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 border-2 ${
        isDark 
          ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 shadow-lg" 
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
      }`}
    >
      Disable
    </button>
  ) : (
    <button
      onClick={() => onChange({ ...form, isActive: true })}
      className="flex-1 min-w-[150px] h-12 px-6 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-transparent"
      style={{ 
        background: "linear-gradient(135deg, #F59E0B, #D97706)",
        boxShadow: "0 8px 20px -6px rgba(245, 158, 11, 0.6)"
      }}
    >
      Enable
    </button>
  )}
</div>
    </div>
  );
}