import { useState, useEffect } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { supabaseService } from "../../../services/supabaseService";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiPlus, FiTrash2 } from "react-icons/fi";
import { ArrowLeft, Layers, BookOpen } from "lucide-react";
import DeleteConfirmModal from "../../../components/DeleteConfirmModal";
import { verifyDeletePassword } from "../../../utils/verifyDeletePassword";
import { setCourseInfoAdmin } from "../../../slices/viewCoursesSlice";
import { useTheme } from "../../../utils/useTheme";

const ModuleList = () => {
  const { courseName } = useParams();
  const [modules, setModules] = useState([]);
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [subjectInfo, setSubjectInfo] = useState(null);
  const dispatch = useDispatch();
  const { courseInfoAdmin } = useSelector((state) => state.viewCourse);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { signupData } = useSelector((state) => state.auth);
  const currentGrade = signupData?.grade;

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const key = searchParams.get("key");
  const gradeFromQuery = searchParams.get("grade");
  const navigate = useNavigate();

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleBackToSubjects = () => {
    const grade = currentGrade || gradeFromQuery;
    if (!grade) {
      toast.error("Grade missing. Cannot go back.");
      return;
    }
    navigate(`/admin/subjects?grade=${grade}`);
  };

  useEffect(() => {
    if (key) {
      setSubjectId(key);
      fetchModules();
    }
  }, [courseName, key, currentGrade]);

  const fetchModules = async () => {
    try {
      const identifier = key || courseName;
      if (
        courseInfoAdmin.length === 0 ||
        key !== courseInfoAdmin?.subject?.id
      ) {
        const response = await supabaseService.getCourseDetails(
          identifier,
          true,
          "all",
        );
        dispatch(setCourseInfoAdmin(response));
        setModules(response.modules);
        setSubjectId(response.subject?.id || key);
        setSubjectInfo(response.subject || null);
      } else {
        setModules(courseInfoAdmin.modules);
        setSubjectId(courseInfoAdmin.subject?.id || key);
        setSubjectInfo(courseInfoAdmin.subject || null);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to fetch modules");
    }
  };

  const toggleModule = async (moduleId, currentIsActive) => {
    const enable = !currentIsActive;
    const confirmed = window.confirm(
      enable ? "Enable this module?" : "Disable this module?",
    );
    if (!confirmed) return;
    try {
      await supabaseService.toggleModule(moduleId, enable);
      toast.success(`Module ${enable ? "enabled" : "disabled"} successfully`);
      fetchModules();
    } catch (error) {
      console.error("Error toggling module:", error);
      toast.error(error.message || "Failed to toggle Textbooks & References");
    }
  };

  const createModule = async () => {
    if (!newModuleName.trim()) {
      toast.error("Textbooks & References name can't be empty");
      return;
    }
    if (!key) {
      toast.error("Subject ID is missing");
      return;
    }
    setIsCreating(true);
    try {
      await supabaseService.createModule(
        key,
        newModuleName,
        newModuleDescription,
      );
      toast.success("Textbooks & References created successfully");
      fetchModules();
      setNewModuleName("");
      setNewModuleDescription("");
      setShowCreateModule(false);
    } catch (error) {
      console.error("Error creating module:", error);
      toast.error(error.message || "Failed to create Textbooks & References");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteModule = async (password) => {
    try {
      setDeleting(true);
      await verifyDeletePassword(password);
      await supabaseService.deleteModuleSafe(selectedModuleId);
      toast.success("Textbooks & References deleted successfully");
      setShowDeleteModal(false);
      setSelectedModuleId(null);
      fetchModules();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
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
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)"
            : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)",
        }}
      />
      <div
        className="absolute top-20 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{
          background: isDark
            ? "rgba(99,102,241,0.08)"
            : "rgba(99,102,241,0.06)",
        }}
      />

      <div className="max-w-4xl mx-auto px-6 mt-20 relative z-10">
        {/* Back Button */}
        <button
          onClick={handleBackToSubjects}
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
          style={{ color: isDark ? "#9CA3AF" : "#475569" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569")
          }
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subjects
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1
              className="text-4xl font-bold mb-2 transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              Subject :{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
                }}
              >
                {courseName}
              </span>
            </h1>
            <p
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              Manage Textbooks & References and lessons
            </p>
          </div>

          <button
            onClick={() => setShowCreateModule(!showCreateModule)}
            className="group flex items-center gap-2 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
            style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
          >
            {showCreateModule ? (
              <>
                <span className="transform group-hover:rotate-90 transition-transform">
                  ✕
                </span>{" "}
                Cancel
              </>
            ) : (
              <>
                <FiPlus className="text-xl group-hover:rotate-90 transition-transform" />{" "}
                Add Textbooks & References
              </>
            )}
          </button>
        </div>

        {/* Create Form */}
        {showCreateModule && (
          <div
            className="rounded-2xl p-6 mb-8 animate-slideDown transition-colors"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
              boxShadow: isDark
                ? "0 4px 24px rgba(0,0,0,0.3)"
                : "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              className="text-xl font-bold mb-4 transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              Create New Textbooks & References
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                  style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
                >
                  Textbooks & References Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Chapter 1: Introduction"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                  style={{
                    background: isDark ? "#0B0F19" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                    color: isDark ? "#E5E7EB" : "#0F172A",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = isDark
                      ? "#1F2937"
                      : "#E2E8F0")
                  }
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                  style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
                >
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Brief description of the module..."
                  value={newModuleDescription}
                  onChange={(e) => setNewModuleDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all resize-none"
                  style={{
                    background: isDark ? "#0B0F19" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                    color: isDark ? "#E5E7EB" : "#0F172A",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = isDark
                      ? "#1F2937"
                      : "#E2E8F0")
                  }
                  rows="3"
                />
              </div>

              <button
                onClick={createModule}
                disabled={isCreating}
                className="w-full text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
                style={{
                  background: "linear-gradient(135deg, #22C55E, #10B981)",
                }}
              >
                {isCreating ? "Creating..." : "Create Module"}
              </button>
            </div>
          </div>
        )}

        {/* Subject Info Box */}
        {subjectInfo && (
          <div
            className="rounded-xl p-4 mb-6 flex flex-wrap gap-6 transition-colors"
            style={{
  backgroundColor: isDark ? "#1A2235" : "#FFFFFF",
  border: isDark
    ? "2px solid rgba(24, 94, 151, 0.55)"
    : "1px solid #E2E8F0",
  boxShadow: isDark
    ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
    : "0 4px 16px rgba(99,102,241,0.08)",
  //transition: "border 0.3s ease, box-shadow 0.3s ease",
}}
onMouseEnter={(e) => {
  e.currentTarget.style.border = "1px solid rgba(99,102,241,0.9)";
  e.currentTarget.style.boxShadow = isDark
    ? "0 0 0 2px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
    : "0 4px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.border = isDark
    ? "2px solid rgba(24, 94, 151, 0.55)"
    : "1px solid #E2E8F0";
  e.currentTarget.style.boxShadow = isDark
    ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
    : "0 4px 16px rgba(99,102,241,0.08)";
}}
          >
            <div className="flex flex-col">
              <span
                className="text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
              >
                Grade
              </span>
              <span
                className="text-base font-semibold mt-1 transition-colors"
                style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
              >
                {currentGrade ||
                  gradeFromQuery ||
                  subjectInfo?.grade ||
                  subjectInfo?.grade_name ||
                  "—"}
              </span>
            </div>
            <div className="flex flex-col">
              <span
                className="text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
              >
                Subject
              </span>
              <span
                className="text-base font-semibold mt-1 transition-colors"
                style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
              >
                {subjectInfo.name || courseName}
              </span>
            </div>
          </div>
        )}

        {/* Stats Card */}
        <div
          className="rounded-xl p-6 mb-8 transition-colors"
         style={{
  backgroundColor: isDark ? "#1A2235" : "#FFFFFF",
  border: isDark
    ? "2px solid rgba(24, 94, 151, 0.55)"
    : "1px solid #E2E8F0",
  boxShadow: isDark
    ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
    : "0 4px 16px rgba(99,102,241,0.08)",
  transition: "border 0.3s ease, box-shadow 0.3s ease",
}}
onMouseEnter={(e) => {
  e.currentTarget.style.border = "1px solid rgba(99,102,241,0.9)";
  e.currentTarget.style.boxShadow = isDark
    ? "0 0 0 2px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
    : "0 4px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.border = isDark
    ? "2px solid rgba(24, 94, 151, 0.55)"
    : "1px solid #E2E8F0";
  e.currentTarget.style.boxShadow = isDark
    ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
    : "0 4px 16px rgba(99,102,241,0.08)";
}}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                icon: <BookOpen className="text-indigo-400 w-6 h-6" />,
                iconBg: "bg-indigo-500/10 border-indigo-500/20",
                label: "Total Textbooks & References",
                value: modules.length,
              },
              {
                icon: <FiEye className="text-emerald-400 w-6 h-6" />,
                iconBg: "bg-emerald-500/10 border-emerald-500/20",
                label: "Active",
                value: modules.filter((m) => m.isActive).length,
              },
              {
                icon: <FiEyeOff className="text-slate-400 w-6 h-6" />,
                iconBg: "bg-slate-500/10 border-slate-500/20",
                label: "Disabled",
                value: modules.filter((m) => !m.isActive).length,
              },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center ${stat.iconBg}`}
                >
                  {stat.icon}
                </div>
                <div>
                  <p
                    className="text-sm transition-colors"
                    style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-2xl font-bold transition-colors"
                    style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
  {modules?.map((module, index) => (
    <div
      key={module.id}
      className="group rounded-xl overflow-hidden transition-all duration-300"
     style={{
  backgroundColor: isDark ? "#1A2235" : "#FFFFFF",
  border: isDark
    ? "2px solid rgba(24, 94, 151, 0.55)"
    : "1px solid #E2E8F0",
  boxShadow: isDark
    ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
    : "0 4px 16px rgba(99,102,241,0.08)",
  transition: "border 0.3s ease, box-shadow 0.3s ease",
}}
onMouseEnter={(e) => {
  e.currentTarget.style.border = "1px solid rgba(99,102,241,0.9)";
  e.currentTarget.style.boxShadow = isDark
    ? "0 0 0 2px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
    : "0 4px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.border = isDark
    ? "2px solid rgba(24, 94, 151, 0.55)"
    : "1px solid #E2E8F0";
  e.currentTarget.style.boxShadow = isDark
    ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
    : "0 4px 16px rgba(99,102,241,0.08)";
}}
    >
      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={`/admin/courses/modules/${module.name}?key=${module.id}&subjectId=${subjectId}&grade=${currentGrade || gradeFromQuery || ""}&subjectName=${encodeURIComponent(courseName)}`}
            className="flex items-center gap-4 flex-1 min-w-0 group/link"
          >
            {/* Number Badge */}
            <div
              className="w-10 h-10 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 group-hover/link:scale-110 transition-transform"
              style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
            >
              {index + 1}
            </div>

            {/* Module Name */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-semibold truncate transition-colors group-hover/link:text-indigo-400"
                style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
              >
                {module.name}
              </h3>
              <p
                className="text-sm mt-1 transition-colors"
                style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
              >
                {module.totalSubModules} chapters
              </p>
              {!module.isActive && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium mt-1 transition-colors"
                  style={{
                    background: isDark ? "rgba(107,114,128,0.15)" : "rgba(107,114,128,0.10)",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    border: `1px solid ${isDark ? "rgba(107,114,128,0.25)" : "rgba(107,114,128,0.20)"}`,
                  }}
                >
                  <FiEyeOff className="w-3 h-3" /> Disabled
                </span>
              )}
            </div>
          </Link>

          {/* Toggle Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleModule(module.id, module.isActive);
            }}
            className="px-4 py-2 rounded-lg transition-all font-medium text-sm flex items-center gap-2 flex-shrink-0 hover:scale-105"
            style={{
              background: module.isActive
                ? isDark ? "rgba(107,114,128,0.15)" : "rgba(107,114,128,0.10)"
                : isDark ? "rgba(34,197,94,0.10)" : "rgba(34,197,94,0.08)",
              color: module.isActive
                ? isDark ? "#9CA3AF" : "#6B7280"
                : isDark ? "#4ADE80" : "#16A34A",
              border: `1px solid ${
                module.isActive
                  ? isDark ? "rgba(107,114,128,0.25)" : "rgba(107,114,128,0.20)"
                  : isDark ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.20)"
              }`,
            }}
          >
            {module.isActive ? (
              <>
                <FiEyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Disable</span>
              </>
            ) : (
              <>
                <FiEye className="w-4 h-4" />
                <span className="hidden sm:inline">Enable</span>
              </>
            )}
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedModuleId(module.id);
              setShowDeleteModal(true);
            }}
            className="px-3 py-2 rounded-lg transition-all font-medium text-sm flex items-center justify-center hover:scale-105"
            style={{
              background: isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.08)",
              color: isDark ? "#F87171" : "#DC2626",
              border: `1px solid ${isDark ? "rgba(239,68,68,0.20)" : "rgba(239,68,68,0.18)"}`,
            }}
            title="Delete Textbooks & References"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
        {/* Empty State */}
        {modules.length === 0 && (
          <div
            className="text-center py-16 rounded-xl transition-colors"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
            }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: isDark
                  ? "rgba(99,102,241,0.10)"
                  : "rgba(99,102,241,0.08)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.25)"}`,
              }}
            >
              <Layers className="w-12 h-12 text-indigo-400" />
            </div>
            <h3
              className="text-2xl font-bold mb-2 transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              No Textbooks & References yet
            </h3>
            <p
              className="mb-6 transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
            >
              Create your first Textbooks & References to get started
            </p>
            <button
              onClick={() => setShowCreateModule(true)}
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #6366F1, #3B82F6)",
              }}
            >
              <FiPlus className="text-xl" />
              Add Textbooks & References
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedModuleId(null);
          }}
          onConfirm={handleDeleteModule}
          itemName="Textbooks & References"
          matchName={`${currentGrade || gradeFromQuery || "0"}/${subjectInfo?.name || courseName || "Subject"}/${modules.find((m) => m.id === selectedModuleId)?.name || ""}`}
          loading={deleting}
        />
      )}

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

export default ModuleList;
