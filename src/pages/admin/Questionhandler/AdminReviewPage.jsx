import { useEffect, useState } from "react";
import QuestionReviewCard from "./QuestionReviewCard";
import { useParams } from "react-router-dom";
import supabaseService from "../../../services/supabaseService";
import { useTheme } from "../../../utils/useTheme";
import { ArrowLeft, Layers, FileText, Award, Zap } from "lucide-react";


export default function AdminReviewPage() {
  const { subModuleId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const isDark = theme === "dark";
  

  // ✅ Proper async useEffect
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response =
          await supabaseService.getSubModuleWithQuestions(subModuleId);
        console.log("Fetched questions:", response);

        if (response?.submodule?.questions) {
          setQuestions(response.submodule.questions);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (subModuleId) {
      fetchQuestions();
    }
  }, [subModuleId]);

  // ✅ Fix id comparison (use same key everywhere)
  const updateQuestion = (updated) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
  };

  // ✅ Prevent crash when empty
  const current = questions[index];
  const progress =
    questions.length > 0
      ? ((index + 1) / questions.length) * 100
      : 0;

  if (loading) {
    return <div className="p-8">Loading questions...</div>;
  }

  if (!questions.length) {
    return <div className="p-8">No questions found.</div>;
  }

return (
  <div className={`min-h-screen w-full transition-colors duration-500 relative overflow-hidden ${isDark ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]'}`}>
    
    {/* Background Glows for Depth */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10 mt-16 relative z-10">

      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Admin Question <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Review</span>
          </h1>
          <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Verify, edit, and optimize questions for SmaranAI.in
          </p>
        </div>
        <div className={`px-4 py-2 rounded-2xl border font-bold text-sm ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
          Question {index + 1} <span className="mx-1 opacity-40">/</span> {questions.length}
        </div>
      </div>

      {/* ── Progress "Laser" Bar ── */}
      <div className="space-y-3">
        <div className={`h-3 w-full rounded-full overflow-hidden p-0.5 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out relative"
            style={{ 
              width: `${progress}%`, 
              background: 'linear-gradient(90deg, #6366F1, #06B6D4)',
              boxShadow: isDark ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            {/* Shimmer effect for the progress bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>

      {/* ── Floating Question Card ── */}
      <div className="transition-all duration-500">
        {current && (
          <div className={`rounded-[2rem] border transition-all duration-500 ${
            isDark 
              ? 'bg-[#111827] border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]' 
              : 'bg-white border-slate-200 shadow-[0_30px_60px_-15px_rgba(99,102,241,0.1)]'
          }`}>
            <QuestionReviewCard
              key={current.id}
              question={current}
              onChange={updateQuestion}
            />
          </div>
        )}
      </div>

      {/* ── Floating Navigation Controls ── */}
      <div className="flex justify-between items-center pt-6">
        <button
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className={`group flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-30
            ${isDark 
              ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Previous
        </button>

        <button
          disabled={index === questions.length - 1}
          onClick={() => setIndex((i) => i + 1)}
          className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-white transition-all duration-300 active:scale-95 disabled:opacity-30 hover:scale-105 hover:shadow-2xl`}
          style={{ 
            background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
            boxShadow: isDark ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' : '0 10px 25px -5px rgba(99, 102, 241, 0.2)'
          }}
        >
          Next Question
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  </div>
);
}