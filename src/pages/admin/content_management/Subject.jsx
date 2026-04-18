
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { supabaseService } from "../../../services/supabaseService";
import toast from "react-hot-toast";
import { IoMdAddCircleOutline } from "react-icons/io";
import { FiEdit3, FiEye, FiEyeOff } from "react-icons/fi";
import { BookOpen, Layers, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../../utils/useTheme";

const SubjectList = () => {
  const [subjects, setSubjects] = useState([]);
  const [grade, setGrade] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const gradeFromQuery = query.get("grade");

  const { signupData } = useSelector((state) => state.auth);
  const currentGrade = signupData?.grade;
  const displayGrade = currentGrade ?? gradeFromQuery ?? grade ?? null;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDescription, setNewSubjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [subjectModuleCounts, setSubjectModuleCounts] = useState({});

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gradients = [
    "from-pink-400 to-rose-400",
    "from-emerald-400 to-teal-400",
    "from-purple-400 to-indigo-400",
    "from-blue-400 to-cyan-400",
    "from-green-400 to-emerald-400",
    "from-red-400 to-pink-400",
    "from-amber-400 to-orange-400",
    "from-violet-400 to-purple-400",
    "from-cyan-400 to-blue-400",
    "from-fuchsia-400 to-pink-400",
  ];

  const handleBackToGrades = () => navigate("/admin/grades");
  const getRandomGradient = () => gradients[Math.floor(Math.random() * gradients.length)];

  useEffect(() => {
    fetchSubjects();
  }, [currentGrade]);

  const pickCourseName = (subject) => {
    return subject.id ?? subject.courseName ?? subject.name ?? subject.subjectName ?? subject.title ?? subject.slug ?? "";
  };

  const fetchSubjects = async () => {
    try {
      const response = await supabaseService.getSubjectsDirect("", true);
      const fetchedSubjects = response.subjects ?? [];
      setSubjects(fetchedSubjects);
      setGrade(response.grade ?? null);
      fetchModuleCounts(fetchedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
    }
  };

  const fetchModuleCounts = async (subjectsList) => {
    try {
      const entries = await Promise.all(
        subjectsList.map(async (subject) => {
          const id = subject.id ?? subject.subjectId ?? subject.key ?? null;
          return [id, 0];
        })
      );
      setSubjectModuleCounts((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    } catch (error) {
      console.warn("[Admin] fetchModuleCounts fallback used:", error);
    }
  };

  const createSubject = async () => {
    if (!newSubjectName.trim()) { toast.error("Subject name can't be empty"); return; }
    setIsCreating(true);
    try {
      await supabaseService.createSubject(newSubjectName, newSubjectDescription, displayGrade);
      toast.success("Subject created successfully");
      await fetchSubjects();
      setNewSubjectName("");
      setNewSubjectDescription("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating subject:", error);
      toast.error(error.message || "Failed to create subject");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSubject = async (subjectId, currentIsActive) => {
    const enable = !currentIsActive;
    const confirmed = window.confirm(`${enable ? "Enable" : "Disable"} this subject?`);
    if (!confirmed) return;
    try {
      await supabaseService.toggleSubject(subjectId, enable);
      toast.success(`Subject ${enable ? "enabled" : "disabled"} successfully`);
      await fetchSubjects();
    } catch (error) {
      console.error("Error toggling subject:", error);
      toast.error(error.message || "Failed to toggle subject");
    }
  };

  const filteredSubjects = displayGrade
    ? subjects.filter((s) => s.grade != null && s.grade.toString() === displayGrade.toString())
    : subjects;

  const activeSubjects = filteredSubjects.filter((s) => s.is_active);
  const disabledSubjects = filteredSubjects.filter((s) => !s.is_active);

  // Reusable subject card
  const SubjectCard = ({ subject, index, isActive }) => {
    const gradient = getRandomGradient();
    const textbooksCount = subjectModuleCounts[subject.id] ?? 0;

    return (
      <div
        key={subject.id}
        className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
          boxShadow: isDark
            ? "0 4px 24px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(0,0,0,0.06)",
          animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
        }}
      >
        {/* Top gradient bar */}
        <div className={`h-14 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="absolute bottom-3 left-4 right-4">
            {isActive ? (
              <span className="inline-flex items-center gap-1 text-xs bg-white/80 text-gray-900 px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                <FiEye className="w-3 h-3" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs bg-gray-900/80 text-white px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                <FiEyeOff className="w-3 h-3" /> Disabled
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <h3
            className="text-xl font-bold mb-3 line-clamp-2 transition-colors"
            style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
          >
            {subject.name}
          </h3>

          <div
            className="flex items-center gap-2 mb-4 transition-colors"
            style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">{textbooksCount} Textbooks & References</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/admin/courses/${encodeURIComponent(subject.name)}?key=${subject.id}${displayGrade ? `&grade=${displayGrade}` : ""}`}
              className="flex-1 text-white px-4 py-2.5 rounded-xl transition-all duration-300 text-center font-medium text-sm hover:scale-105"
              style={{ background: "linear-gradient(135deg, #3B82F6, #06B6D4)" }}
            >
              Open
            </Link>

            <button
              onClick={() => toggleSubject(subject.id, subject.is_active)}
              className="flex-1 text-white px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm hover:scale-105"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, #EF4444, #F43F5E)"
                  : "linear-gradient(135deg, #22C55E, #10B981)",
              }}
            >
              {isActive ? "Disable" : "Enable"}
            </button>
          </div>
        </div>

        {/* Shimmer */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />
      </div>
    );
  };

  return (
    <div
      className="min-h-screen py-8 relative overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
        backgroundSize: "28px 28px",
      }}
    >

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

      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none"
        style={{ background: isDark ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)" : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)" }} />
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)" }} />

      <div className="max-w-7xl mx-auto px-6 mt-20 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button
              onClick={handleBackToGrades}
              className="inline-flex items-center gap-2 text-sm font-medium mb-4 transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
              onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A"}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569"}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Grades
            </button>

            <h2
              className="text-4xl font-bold mb-2 transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              Subject Management
              {displayGrade && (
                <span
                  className="text-transparent bg-clip-text ml-2"
                  style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)" }}
                >
                  Grade {displayGrade}
                </span>
              )}
            </h2>

            <p
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Manage all course Subjects and Textbooks & References
            </p>
          </div>

          {/* Create button */}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="group flex items-center gap-2 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
            style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
          >
            {showCreateForm ? (
              <><span className="transform group-hover:rotate-90 transition-transform">✕</span> Cancel</>
            ) : (
              <><IoMdAddCircleOutline className="text-xl group-hover:rotate-90 transition-transform" /> Create New Subject</>
            )}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
        <div
  className="rounded-2xl p-8 mb-8 animate-slideDown"
  style={{
    background: isDark ? "#111827" : "#FFFFFF",
    border: isDark ? "2px solid rgba(24,94,151,0.55)" : "1px solid rgba(99,102,241,0.3)",
    boxShadow: isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(99,102,241,0.08)",
    transition: "border 0.3s ease, box-shadow 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.border = isDark
      ? "2px solid rgba(99,102,241,0.9)"
      : "1px solid rgba(99,102,241,0.7)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 0 2px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
      : "0 4px 24px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.border = isDark
      ? "2px solid rgba(24,94,151,0.55)"
      : "1px solid rgba(99,102,241,0.3)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(99,102,241,0.08)";
  }}
>
  <h3
    className="text-2xl font-bold mb-6 flex items-center gap-3 transition-colors"
    style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
  >
    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
      <FiEdit3 className="text-indigo-400" />
    </div>
    Create New Subject
  </h3>

  <div className="space-y-4">
    <div>
      <label
        className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
        style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
      >
        Subject Name *
      </label>
      <input
        type="text"
        placeholder="e.g., Mathematics, Science, English"
        value={newSubjectName}
        onChange={(e) => setNewSubjectName(e.target.value)}
        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
        style={{
          background: isDark ? "#0B0F19" : "#F8FAFC",
          border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
          color: isDark ? "#E5E7EB" : "#0F172A",
        }}
        onFocus={(e) => e.target.style.borderColor = "#6366F1"}
        onBlur={(e) => e.target.style.borderColor = isDark ? "#1F2937" : "#E2E8F0"}
      />
    </div>

    <div>
      <label
        className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
        style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
      >
        Description
      </label>
      <textarea
        placeholder="Provide a brief description of the subject..."
        value={newSubjectDescription}
        onChange={(e) => setNewSubjectDescription(e.target.value)}
        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all resize-none"
        style={{
          background: isDark ? "#0B0F19" : "#F8FAFC",
          border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
          color: isDark ? "#E5E7EB" : "#0F172A",
        }}
        onFocus={(e) => e.target.style.borderColor = "#6366F1"}
        onBlur={(e) => e.target.style.borderColor = isDark ? "#1F2937" : "#E2E8F0"}
        rows="4"
      />
    </div>

    <button
      onClick={createSubject}
      disabled={isCreating}
      className="w-full text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
      style={{ background: "linear-gradient(135deg, #22C55E, #10B981)" }}
    >
      {isCreating ? "Creating..." : "Create Subject"}
    </button>
  </div>
</div>
        )}

        

        {/* Stats */}
<div
  className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 rounded-2xl p-4"
  style={{
    border: isDark ? "1px solid rgba(24,94,151,0.55)" : "1px solid rgba(99,102,241,0.5)",
    boxShadow: isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(99,102,241,0.15)",
    transition: "border 0.3s ease, box-shadow 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.border = isDark
      ? "1px solid rgba(99,102,241,0.9)"
      : "1px solid rgba(99,102,241,0.8)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 0 2px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
      : "0 4px 24px rgba(99,102,241,0.15), 0 0 12px 3px rgba(99,102,241,0.2)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.border = isDark
      ? "1px solid rgba(24,94,151,0.55)"
      : "1px solid rgba(99,102,241,0.5)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(99,102,241,0.15)";
  }}
>
  {[
    { label: "Total Subjects", value: subjects.length, icon: <BookOpen className="text-indigo-400" />, iconBg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Active", value: activeSubjects.length, icon: <FiEye className="text-emerald-400" />, iconBg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Disabled", value: disabledSubjects.length, icon: <FiEyeOff className="text-slate-400" />, iconBg: "bg-slate-500/10 border-slate-500/20" },
  ].map((stat, i) => (
    <div
      key={i}
      className="rounded-xl p-6"
      style={{
        background: isDark ? "#111827" : "#FFFFFF",
        border: isDark ? "1px solid rgba(24,94,151,0.55)" : "1px solid rgba(99,102,241,0.3)",
        boxShadow: isDark
          ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)"
          : "0 4px 16px rgba(99,102,241,0.08)",
        transition: "border 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = isDark
          ? "1px solid rgba(99,102,241,0.9)"
          : "1px solid rgba(99,102,241,0.7)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 0 0 2px rgba(255,255,255,0.10), 0 4px 16px rgba(0,0,0,0.3), 0 0 12px 2px rgba(99,102,241,0.25)"
          : "0 4px 16px rgba(99,102,241,0.08), 0 0 10px 2px rgba(99,102,241,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = isDark
          ? "1px solid rgba(24,94,151,0.55)"
          : "1px solid rgba(99,102,241,0.3)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)"
          : "0 4px 16px rgba(99,102,241,0.08)";
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-sm font-medium transition-colors"
            style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
          >
            {stat.label}
          </p>
          <p
            className="text-3xl font-bold mt-1 transition-colors"
            style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
          >
            {stat.value}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${stat.iconBg}`}>
          {stat.icon}
        </div>
      </div>
    </div>
  ))}
</div>

        {/* Active Subjects */}
        <section className="mb-10">
          <div className="mb-4">
            <h3
              className="text-2xl font-semibold transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              Active Subjects
            </h3>
            <p
              className="text-sm mt-1 transition-colors"
              style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
            >
              {activeSubjects.length} subjects
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeSubjects.map((subject, index) => (
              <SubjectCard key={subject.id} subject={subject} index={index} isActive={true} />
            ))}
          </div>
        </section>

        {/* Disabled Subjects */}
        <section className="mb-16">
          <div className="mb-4">
            <h3
              className="text-2xl font-semibold transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              Disabled Subjects
            </h3>
            <p
              className="text-sm mt-1 transition-colors"
              style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
            >
              {disabledSubjects.length} subjects
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {disabledSubjects.map((subject, index) => (
              <SubjectCard key={subject.id} subject={subject} index={index} isActive={false} />
            ))}
          </div>
        </section>

        {/* Empty State */}
        {subjects.length === 0 && (
          <div className="text-center py-16">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.08)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.25)"}`,
              }}
            >
              <BookOpen className="w-12 h-12 text-indigo-400" />
            </div>
            <h3
              className="text-2xl font-bold mb-2 transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              No subjects yet
            </h3>
            <p
              className="mb-6 transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
            >
              Create your first subject to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
            >
              <IoMdAddCircleOutline className="text-xl" />
              Create Subject
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default SubjectList;