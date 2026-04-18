import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { supabaseService } from "../../../services/supabaseService";
import toast from "react-hot-toast";
import { BookOpen, ArrowLeft, Shield } from "lucide-react";
import { setSignupData } from "../../../slices/authSlice";
import { useTheme } from "../../../utils/useTheme";

const AdminGradeSubjectOverview = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.signupData);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const TOTAL_GRADES = 12;
  const allGrades = useMemo(
    () => Array.from({ length: TOTAL_GRADES }, (_, i) => (i + 1).toString()),
    [TOTAL_GRADES]
  );

  useEffect(() => {
    fetchSubjectsForCurrentGrade();
  }, []);

  const fetchSubjectsForCurrentGrade = async () => {
    try {
      setLoading(true);
      const response = await supabaseService.getSubjectsDirect("", true);
      const list = response?.subjects ?? response ?? [];
      setSubjects(list);
    } catch (error) {
      console.error("Error fetching subjects for admin:", error);
      toast.error(error.message || "Failed to fetch subjects for admin");
    } finally {
      setLoading(false);
    }
  };

  const subjectsByGrade = useMemo(() => {
    const grouped = {};
    allGrades.forEach((g) => { grouped[g] = []; });
    subjects.forEach((subj) => {
      const g = subj.grade?.toString();
      if (g && grouped[g]) grouped[g].push(subj);
    });
    return grouped;
  }, [subjects, allGrades]);

  const handleGradeClick = async (grade) => {
    try {
      await supabaseService.updateUserGrade(Number(grade));
      if (user) {
        dispatch(setSignupData({ ...user, grade: Number(grade) }));
      }
      await fetchSubjectsForCurrentGrade();
      navigate(`/admin/subjects?grade=${grade}`);
    } catch (error) {
      console.error("Failed to switch grade:", error);
      toast.error(error.message || "Failed to switch grade");
    }
  };

  return (
    <div
      className="min-h-screen py-8 relative overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
        backgroundSize: "28px 28px",
      
      }}
    >
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none"
        style={{ background: isDark ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)" : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)" }} />
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: isDark ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.05)" }} />

      <div className="max-w-6xl mx-auto px-6 mt-20 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10"
        >
          <div>

            {/* Back button */}
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center gap-2 text-sm font-medium mb-4 transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
              onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A"}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569"}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>


            {/* Title */}
            <h2
              className="text-3xl md:text-4xl font-extrabold mb-2 transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              All Grades &{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)" }}
              >
                Subjects
              </span>
            </h2>

            {/* Subtitle */}
            <p
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Click a grade to manage its subjects
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-24">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
            </div>
            <p className="text-sm transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
              Loading subjects...
            </p>
          </div>
        ) : (
         <div
  key={theme}
  className="rounded-2xl overflow-hidden transition-all duration-300"
onMouseEnter={e => {
    e.currentTarget.style.border = isDark
      ? "1px solid rgba(139,92,246,0.5)"
      : "1px solid rgba(99,102,241,0.4)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 30px rgba(139,92,246,0.12), 0 0 60px rgba(99,102,241,0.06)"
      : "0 0 20px rgba(139,92,246,0.1), 0 8px 32px rgba(0,0,0,0.06)";
  }}
  onMouseLeave={e => {
    e.currentTarget.style.border = isDark
      ? "1px solid rgba(220,226,233,0.8)"
      : "1px solid rgba(99,102,241,0.3)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 40px rgba(99,102,241,0.08)"
      : "0 8px 32px rgba(0,0,0,0.06)";
  }}
  style={{
    background: isDark ? "#111827" : "#FFFFFF",
    border: isDark
      ? "1px solid rgba(220,226,233,0.8)"
      : "1px solid rgba(99,102,241,0.3)",
    boxShadow: isDark
      ? "0 0 40px rgba(99,102,241,0.08)"
      : "0 8px 32px rgba(0,0,0,0.06)",
    transition: "border 0.4s ease, box-shadow 0.4s ease",
  }}
>
            {/* Top accent line */}
 <div
  className="w-full"
  style={{
    height: "2px",
    background: "linear-gradient(to right, transparent, rgba(255,255,255,0.), transparent)",
  }}
/>
            <table className="min-w-full">

              {/* Table Head */}
              <thead>
                <tr style={{
                  background: isDark
                    ? "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.05))"
                    : "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(59,130,246,0.03))",
                }}>
                  <th
                    className="px-6 pl-11 py-4 text-left text-xs font-bold uppercase tracking-widest"
                    style={{
                      background: isDark ? "#060a1cff" : "#d4dcdfff",
                      color: isDark ? "#E5E7EB" : "#0F172A",
                      borderBottom: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                    }}
                  >
                    Grade
                  </th>
                  <th
                    className="px-6 py-4  text-xs font-bold uppercase tracking-widest flex justify-center "
                    style={{
                      background: isDark ? "#060a1cff" : "#d4dcdfff",
                      color: isDark ? "#E5E7EB" : "#0F172A",
                      borderBottom: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                    }}
                  >
                    Subjects
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
<tbody >
  {allGrades.map((grade) => (
    <tr
      key={grade}
      className="transition-colors duration-200"
      style={{
        borderBottom: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
        background: isDark ? "#111827" : "#FFFFFF", 
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark
          ? "rgba(99,102,241,0.08)"
          : "rgba(99,102,241,0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDark ? "#111827" : "#FFFFFF";
      }}
    >
                    {/* Grade button */}
                    <td className="px-6 py-4 whitespace-nowrap w-36">
                      <button
                        onClick={() => handleGradeClick(grade)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-105"
                        style={{
                          background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                          boxShadow: isDark
                            ? "0 4px 12px rgba(99,102,241,0.30)"
                            : "0 4px 12px rgba(99,102,241,0.20)",
                        }}
                      >
                        Grade {grade}
                      </button>
                    </td>

                    {/* Subjects */}
                    <td className="px-6 py-4">
                      {subjectsByGrade[grade]?.length > 0 ? (
                        <>
                          {(() => {
                            const allSubs = subjectsByGrade[grade];
                            const activeSubs = allSubs.filter(s => s.is_active);
                            const displaySubs = showAll ? allSubs : activeSubs;

                            return (
                              <div className="flex flex-wrap gap-2">
                                {displaySubs.map((subject) => (
                                  <span
                                    key={subject.id}
                                    className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                    style={{
                                      background: isDark
                                        ? "rgba(99,102,241,0.10)"
                                        : "rgba(99,102,241,0.08)",
                                      border: `1px solid ${isDark
                                        ? "rgba(99,102,241,0.20)"
                                        : "rgba(99,102,241,0.25)"}`,
                                      color: isDark ? "#A5B4FC" : "#4F46E5",
                                    }}
                                  >
                                    {subject.name}
                                    {!subject.is_active && (
                                      <span
                                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded-md"
                                        style={{
                                          background: isDark
                                            ? "rgba(107,114,128,0.20)"
                                            : "rgba(107,114,128,0.12)",
                                          color: isDark ? "#6B7280" : "#94A3B8",
                                          border: `1px solid ${isDark
                                            ? "rgba(107,114,128,0.30)"
                                            : "rgba(107,114,128,0.20)"}`,
                                        }}
                                      >
                                        Disabled
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}

                          {subjectsByGrade[grade].some(s => !s.is_active) && (
                            <button
                              onClick={() => setShowAll(!showAll)}
                              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              {showAll ? "Show Less ↑" : "Show More ↓"}
                            </button>
                          )}
                        </>
                      ) : (
                        <span
                          className="text-sm italic transition-colors"
                          style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
                        >
                          No subjects for this grade
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGradeSubjectOverview;