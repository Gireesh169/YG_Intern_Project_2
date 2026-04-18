// src/components/course/ModuleList.jsx
import { Link } from "react-router-dom";
import { useTheme } from "../../utils/useTheme";

import {
  Lock,
  Unlock,
  CheckCircle2,
  RotateCcw,
  Clock,
  Zap,
} from "lucide-react";
import ChapterProgressPie from "../analytics/ChapterProgressPie";



const ModuleList = ({
  modules,
  attemptedList,
  signupData,
  subject,
  analyticsCanonical,
  setAutoQuizModules,
  setChapterSelection,
  setShowAutoQuizPanel,
  handleDirectAutoQuizForChapter,
  startQuizHandler,
  setSelectedSubModuleId,
  setConfirmationModal,
  sortChaptersByNumber,
  getDifficultyConfig,
}) => {

    const { theme } = useTheme();
    const isDark = theme === "dark";
  return (
    <div className="space-y-6">
      {modules.length === 0 ? (
        <div className="bg-[#111827] rounded-2xl p-8 md:p-12 text-center border border-[#1F2937]">
          <h3 className="text-xl md:text-2xl font-bold text-[#E5E7EB] mb-2">
            No Modules Available
          </h3>
          <p className="text-[#6B7280]">Check back soon for new content!</p>
        </div>
      ) : (
        modules.map((module, moduleIndex) => (
          <div
            key={moduleIndex}
           className={`rounded-[2rem] border-2 overflow-hidden transition-all duration-500 group mb-8 ${
      isDark
        ? "bg-[#111827] border-[#334155] hover:border-indigo-400/70 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.55)]"
        : "bg-white border-slate-950 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-1 hover:-translate-y-1"
    }`}
          >
            {/* Module Header */}
            <div
              className="relative p-4 md:p-6 border-b overflow-hidden"
              style={{
                borderColor: isDark ? "#1F2937" : "#E2E8F0",
                background: isDark
                  ? "linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 100%)"
                  : "linear-gradient(135deg, #EEF2FF 0%, #DBEAFE 100%)",
              }}
              
            >
              {/* Glow effect */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

              <div className="relative flex flex-row md:flex-row md:items-center gap-4">
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                  }}
                >
                  {moduleIndex + 1}
                </div>
                <div className="flex-1">
                  <h3
                    className="text-xl md:text-2xl font-bold"
                    style={{ color: isDark ? "#FFFFFF" : "#1E3A8A" }}
                  >
                    {module.name}
                  </h3>
                  <p
                    className="text-sm mt-1 flex items-center gap-1.5"
                    style={{ color: isDark ? "rgba(255,255,255,0.90)" : "#475569" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: isDark ? "#818CF8" : "#6366F1" }}
                    />
                    {(module.subModules || []).length} quizzes available
                  </p>
                </div>
              </div>
            </div>

            {/* Module Auto Quiz */}
            <div className="px-4 md:px-6 pt-4">
              <button
                onClick={() => {
                  setAutoQuizModules([module]);
                  setChapterSelection({});
                  setShowAutoQuizPanel(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#1F2937] border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/60 hover:scale-105 transition-all duration-200"
              >
                ⚡ Auto Quiz
              </button>
            </div>

            {/* Sub Modules */}
            <div className="p-4 md:p-6 space-y-3">
              {(module.subModules || []).length === 0 ? (
                <p className="text-[#6B7280] text-center py-8">
                  No quizzes available in this module
                </p>
              ) : (
                sortChaptersByNumber(module.subModules).map((subModule, subIndex) => {
                  const chapterId =
                    subModule.id ??
                    subModule.subModuleId ??
                    subModule.sub_module_id ??
                    subModule.chapterId ??
                    subModule.chapter_id;
                  const difficultyConfig = getDifficultyConfig(
                    subModule.difficulty,
                  );
                  const isAttempted = attemptedList.some(
                    (x) => String(x) === String(chapterId),
                  );
                  const isLocked = !signupData?.isSubscribed && subModule.isPro;

                  return (
                    <div
                      key={chapterId ?? `${moduleIndex}-${subIndex}`}
                      className={`group relative p-4 md:p-5 rounded-xl transition-all duration-300 border ${
                        isAttempted
                          ? "bg-emerald-500/8 border-emerald-500/30 hover:border-emerald-400/60 hover:shadow-emerald-500/10"
                          : "bg-[#0F172A] border-[#334155] hover:border-indigo-400/60 hover:shadow-indigo-500/15"
                      } hover:shadow-lg hover:-translate-y-0.5`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Left Section */}
                        <div className="flex items-start md:items-center gap-4 flex-1">
                          <div
                            className={`p-3 rounded-lg ${
                              isLocked
                                ? "bg-[#1F2937]"
                                : isAttempted
                                  ? "bg-emerald-500/10"
                                  : "bg-indigo-500/10"
                            }`}
                          >
                            {isLocked ? (
                              <Lock size={22} className="text-[#6B7280]" />
                            ) : isAttempted ? (
                              <CheckCircle2
                                size={22}
                                className="text-emerald-400"
                              />
                            ) : (
                              <Unlock size={22} className="text-indigo-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4
                                className="text-base md:text-lg font-semibold"
                                style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                              >
                                {subModule.name}
                              </h4>

                              {subModule.isPro && (
                                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                                  <Zap size={12} /> PRO
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span
                                className={`${difficultyConfig.color} text-white px-3 py-1 rounded-full text-xs font-semibold`}
                              >
                                {subModule.difficulty}
                              </span>

                              <span
                                className="flex items-center gap-1"
                                style={{ color: isDark ? "#6B7280" : "#64748B" }}
                              >
                                <Clock size={14} />{" "}
                                {subModule.questionCount || 10} questions
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="hidden lg:block">
                          {(() => {
                            const subStats =
                              analyticsCanonical?.subModulesFlat?.subModules?.find(
                                (s) =>
                                  String(s.subModuleId ?? s.id) ===
                                  String(chapterId),
                              );

                            return (
                              <ChapterProgressPie
                                stats={subStats}
                                questionCount={subModule.questionCount || 0}
                              />
                            );
                          })()}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Auto Quiz */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDirectAutoQuizForChapter(chapterId);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300"
                            style={{
                              background:
                                "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
                            }}
                          >
                            ⚡ Auto Quiz
                          </button>

                          {isAttempted ? (
                            <button
                              onClick={() => {
                                setSelectedSubModuleId(chapterId);
                                setConfirmationModal(true);
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transition-all duration-200"
                              style={{
                                background:
                                  "linear-gradient(135deg, #3B82F6, #06B6D4)",
                              }}
                            >
                              <RotateCcw size={18} /> Retry
                            </button>
                          ) : isLocked ? (
                            <button className="flex items-center gap-2 bg-[#1F2937] text-[#6B7280] px-4 py-2 rounded-lg cursor-not-allowed font-medium text-sm">
                              <Lock size={16} /> Locked
                            </button>
                          ) : (
                            <button
                              onClick={() => startQuizHandler({ ...subModule, id: chapterId })}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:scale-105 transition-all duration-200 relative overflow-hidden group/btn"
                              style={{
                                background:
                                  "linear-gradient(135deg, #6366F1, #3B82F6)",
                                boxShadow:
                                  "0 0 20px rgba(99,102,241,0.4), 0 4px 15px rgba(59,130,246,0.3)",
                              }}
                            >
                              <span className="relative z-10 flex items-center gap-1.5">
                                ▶ Start Quiz
                                {/* Shimmer */}
                                <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ModuleList;
