import { ArrowLeft, BarChart3, Star, Target, Trophy } from "lucide-react";
import SubjectChapterBarChart from "../analytics/SubjectChapterBarChart";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../utils/useTheme";

export default function SubjectHeaderCard({
  subject,
  subjectConfig,
  IconComponent,
  totalModules,
  modules,
  googleId,
  modulesPayloadForChart,
  totalQuestionsBySubject,
  bySubjectMap,
  courseId,
}) {
  const totalQuizzes = modules.reduce(
    (acc, m) => acc + (m.subModules?.length || 0),
    0,
  );

  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
         {/* Background Effects */}
      {/* removed duplicated background effects block */}
 {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <div className="absolute inset-0" />

        {/* Glow blobs */}
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.12)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[120px]"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.10)",
          }}
        />
        <div
          className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(59,130,246,0.08)"
              : "rgba(59,130,246,0.08)",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(6,182,212,0.08)"
              : "rgba(6,182,212,0.08)",
            animationDelay: "4s",
          }}
        />

        {/* Top center beam */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(99,102,241,0.15), transparent)"
              : "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)",
          }}
        />
      </div>

        <button
          onClick={() => navigate("/quizzes")}
          className="flex items-center gap-2 transition-colors"
          style={{ color: isDark ? "#9CA3AF" : "#475569" }}
          onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A"}
          onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569"}
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Quizzes</span>
        </button>

        <button
          onClick={() => navigate(`/courses/subject-stats/${courseId}`)}
          className="flex items-center justify-center gap-2 text-sm text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 transition-all w-full sm:w-auto"
          style={{ background:"linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)" }}
        >
          <BarChart3 size={18} />
          <span className="font-medium">View Subject Analytics</span>
        </button>
      </div>

      {/* Header Card */}
      <div
        className="rounded-2xl overflow-hidden border hover:border-indigo-500/30 transition-colors mb-6"
        style={{
          background: isDark ? "#111827" : "#FFFFFF",
          borderColor: isDark ? "#1F2937" : "#E2E8F0",
          boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
       <div 
  className={`flex-1 text-center sm:text-left p-6 rounded-2xl border-2 transition-all duration-300
    ${isDark 
      ? "bg-[#111827] border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
      : "bg-white border-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
    }`}
>



          {/* Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.12)" }}
          />

          {/* Background Decorations */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.08)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full -ml-24 -mb-24"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.08)" }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">

            {/* LEFT SECTION */}
            <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">

              {/* Icon */}
              <div
                className="backdrop-blur-sm p-4 rounded-2xl flex items-center justify-center w-full sm:w-auto mx-auto sm:mx-0 shrink-0"
                style={{
                  background: isDark ? "rgba(255,255,255,0.20)" : "rgba(99,102,241,0.15)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(99,102,241,0.25)"}`,
                }}
              >
                <IconComponent
                  size={40}
                  className="sm:w-12 sm:h-12"
                  style={{ color: isDark ? "#FFFFFF" : "#4F46E5" }}
                />
              </div>

              {/* Text Content */}
              <div className="flex-1 text-center sm:text-left">
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 transition-colors"
                  style={{ color: isDark ? "#FFFFFF" : "#1E1B4B" }}
                >
                  {subject.name}
                </h1>

                <p
                  className="text-sm sm:text-base lg:text-lg mb-4 transition-colors"
                  style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#4338CA" }}
                >
                  {subject.description ||
                    "Master this subject with comprehensive modules and quizzes"}
                </p>

                {/* Stats */}
                <div className="flex flex-nowrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm">
                  {[
                    { icon: <Star size={16} className="text-yellow-400" />, label: "4.8 Rating" },
                    { icon: <Target size={16} style={{ color: isDark ? "#FFFFFF" : "#4F46E5" }} />, label: `${totalModules} Modules` },
                    { icon: <Trophy size={16} style={{ color: isDark ? "#FFFFFF" : "#4F46E5" }} />, label: `${totalQuizzes} Quizzes` },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center gap-2 flex-1 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full transition-colors"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.20)" : "rgba(99,102,241,0.12)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(99,102,241,0.20)"}`,
                      }}
                    >
                      {stat.icon}
                      <span
                        className="font-semibold"
                        style={{ color: isDark ? "#FFFFFF" : "#3730A3" }}
                      >
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT CHART */}
            <div className="w-full sm:w-full lg:w-[320px]">
              <SubjectChapterBarChart
                key={`${googleId || "anon"}-${modules.length}-${JSON.stringify(
                  Object.keys(totalQuestionsBySubject).slice(0, 10),
                )}`}
                modulesPayload={modulesPayloadForChart.slice()}
                totalQuestionsBySubject={totalQuestionsBySubject}
                bySubject={bySubjectMap}
                height={220}
                theme={isDark ? "dark" : "light"}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}