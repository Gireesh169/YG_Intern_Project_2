
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseService } from "../../../services/supabaseService";
import toast from "react-hot-toast";
import { 
  FiEdit2, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle,
  FiArrowLeft,
  FiSearch
} from "react-icons/fi";
import { FileText, Award, BarChart3 } from "lucide-react";
import QuestionMistakesModal from "../../../components/teacher/QuestionMistakesModal";
import { useSelector } from "react-redux";
import { useTheme } from "../../../utils/useTheme";



function TeacherQuizManagement() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmodule, setSelectedSubmodule] = useState(null);
  const [showMistakesModal, setShowMistakesModal] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === "dark";
//    const [selectedGrade, setSelectedGrade] = useState(9); 
   const { signupData } = useSelector((state) => state.auth);
const selectedGrade = signupData?.grade;

  useEffect(() => {
    // Load quizzes as soon as user is available; grade may hydrate later.
    if (signupData) {
      fetchAllQuizzes();
    }
  }, [signupData, selectedGrade]);

  const fetchAllQuizzes = async () => {
    try {
      setLoading(true);
      const response = await supabaseService.getSubjects("", true, selectedGrade ?? null);
      
      // Fetch modules and submodules for each subject
      const subjectsWithDetails = await Promise.all(
        response.subjects.map(async (subject) => {
          try {
            const courseDetails = await supabaseService.getCourseDetails(
              subject.id,
              true,
              selectedGrade
            );
            return {
              ...subject,
              modules: courseDetails.modules || []
            };
          } catch (error) {
            console.error(`Error fetching details for subject ${subject.id}:`, error);
            return {
              ...subject,
              modules: []
            };
          }
        })
      );

      setSubjects(subjectsWithDetails);
    } catch (error) {
      console.error("Error fetching quizzes: ", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubmodule = async (submoduleId, currentIsActive) => {
    const enable = !currentIsActive;
    const confirmed = window.confirm(
      enable 
        ? "Enable this quiz? Students will be able to see and attempt it." 
        : "Disable this quiz? Students won't be able to see it."
    );
    
    if (!confirmed) return;

    try {
      await supabaseService.toggleSubModule(submoduleId, enable);
      toast.success(`Quiz ${enable ? "enabled" : "disabled"} successfully`);
      fetchAllQuizzes();
    } catch (error) {
      console.error("Error toggling quiz:", error);
      toast.error(error.message || "Failed to toggle quiz");
    }
  };

  const handleViewMistakes = (submodule, subject, module) => {
    setSelectedSubmodule({
      ...submodule,
      subjectName: subject.name,
      moduleName: module.name
    });
    setShowMistakesModal(true);
  };

  const handleEditQuiz = (submoduleId) => {
    navigate(`/admin/review/${submoduleId}`);
  };

  const getDifficultyConfig = (difficulty) => {
    const configs = {
      hard: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Hard" },
      easy: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", label: "Easy" },
      medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", label: "Medium" },
    };
    return configs[difficulty?.toLowerCase()] || configs.medium;
  };

  // Filter subjects based on search
  const filteredSubjects = subjects.filter(subject => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Search in subject name
    if (subject.name.toLowerCase().includes(searchLower)) return true;
    
    // Search in modules and submodules
    return subject.modules?.some(module => {
      if (module.name.toLowerCase().includes(searchLower)) return true;
      return module.subModules?.some(submodule => 
        submodule.name.toLowerCase().includes(searchLower)
      );
    });
  });

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? "#0B0F19" : "#F3F6FF" }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDark ? "text-gray-400" : "text-slate-600"}>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: isDark ? "#0B0F19" : "#F3F6FF" }}
    >

      
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-gradient-to-b from-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

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


      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className={`inline-flex items-center gap-2 mb-6 transition-colors ${
              isDark ? "text-purple-400 hover:text-purple-300" : "text-indigo-700 hover:text-indigo-900"
            }`}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </button>

          <h1 className={`text-4xl md:text-5xl font-extrabold mb-2 leading-tight ${isDark ? "text-[#E5E7EB]" : "text-slate-900"}`}>
            Teacher{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
            style={{
                backgroundImage:
                  "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
              }}>
              Quiz Management
            </span>
          </h1>
          <p className={isDark ? "text-[#9CA3AF]" : "text-slate-600"}>Edit quizzes, manage availability & view student mistakes</p>
        </div>



        {/* Search Bar */}
        <div className="mb-8">
          <div className=" z-999 relative max-w-md   rounded-2xl"
           style={{
                background: isDark ? "#111827" : "#FFFFFF",
                border: isDark
                  ? "2px solid rgba(24,94,151,0.55)"
                  : "1px solid #d6dce3ff",
                boxShadow: isDark
                  ? "0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)"
                  : "0 8px 32px rgba(0,0,0,0.08)",
                transition: "border 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = isDark
                  ? "2px solid rgba(99,102,241,0.9)"
                  : "1px solid rgba(99,102,241,0.5)";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 0 0 2px rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
                  : "0 8px 32px rgba(0,0,0,0.08), 0 0 12px 3px rgba(99,102,241,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = isDark
                  ? "2px solid rgba(24,94,151,0.55)"
                  : "1px solid #E2E8F0";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)"
                  : "0 8px 32px rgba(0,0,0,0.08)";
              }}
          >
            <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            <input
              type="text"
              placeholder="Search subjects, modules, or quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-colors ${
                isDark
                  ? "bg-[#111827] border border-[#1F2937] text-gray-200 placeholder-gray-500 focus:border-purple-500/50"
                  : "bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-indigo-500"
              }`}
            />
          </div>
        </div>

        {/* Stats Summary */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

<div
  className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.01]
    ${
      isDark
        ? "bg-[#111827] border-[#2B3A55] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        : "bg-white border-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
    }`}
>

    <div className="flex items-center gap-4">

      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center
        ${
          isDark
            ? "bg-purple-500/10"
            : "bg-purple-100"
        }`}
      >
        <FileText
          className={`w-7 h-7 ${
            isDark ? "text-purple-400" : "text-purple-700"
          }`}
        />
      </div>

      {/* Text */}
      <div>

        <p
          className={`text-xs font-bold uppercase tracking-wider mb-1
          ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Total Quizzes
        </p>

        <p
          className={`text-2xl font-bold
          ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          {subjects.reduce((acc, subject) =>
            acc + subject.modules?.reduce(
              (mAcc, module) =>
                mAcc + (module.subModules?.length || 0),
              0
            ), 0
          )}
        </p>

      </div>

    </div>

  </div>



       <div
  className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.01]
    ${
      isDark
        ? "bg-[#111827] border-[#2B3A55] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        : "bg-white border-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
    }`}
>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <FiEye className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p
          className={`text-xs font-bold uppercase tracking-wider mb-1
          ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Active
        </p>
               <p
          className={`text-2xl font-bold
          ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
                  {subjects.reduce((acc, subject) => 
                    acc + subject.modules?.reduce((mAcc, module) => 
                      mAcc + (module.subModules?.filter(sm => sm.is_active).length || 0), 0
                    ), 0
                  )}
                </p>
              </div>
            </div>
          </div>

     <div
  className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.01]
    ${
      isDark
        ? "bg-[#111827] border-[#2B3A55] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        : "bg-white border-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
    }`}
>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                    <p
          className={`text-xs font-bold uppercase tracking-wider mb-1
          ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
Pro content
        </p>
                           <p
          className={`text-2xl font-bold
          ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
                  {subjects.reduce((acc, subject) => 
                    acc + subject.modules?.reduce((mAcc, module) => 
                      mAcc + (module.subModules?.filter(sm => sm.is_pro).length || 0), 0
                    ), 0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="space-y-6">
          {filteredSubjects.length === 0 && (
            <div className={`rounded-xl p-12 text-center border ${isDark ? "bg-[#111827] border-[#1F2937]" : "bg-white border-slate-300 shadow-sm"}`}>
              <FiAlertCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-slate-500"}`} />
              <p className={isDark ? "text-gray-400" : "text-slate-600"}>No quizzes found matching your search.</p>
            </div>
          )}

          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className={`rounded-2xl overflow-hidden border ${
                isDark
                  ? "bg-[#111827] border-[#2B3A55] shadow-[0_12px_30px_rgba(0,0,0,0.3)]"
                  : "bg-white border-slate-300 shadow-sm"
              }`}
            >
              {/* Subject Header */}
              <div className={`p-6 border-b ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}>
                <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? "text-gray-200" : "text-slate-900"}`}>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {subject.name.charAt(0)}
                  </div>
                  {subject.name}
                </h2>
              </div>

              {/* Modules */}
              {subject.modules?.map((module) => (
                <div key={module.id} className={`p-6 border-b last:border-b-0 ${isDark ? "border-[#1F2937]" : "border-slate-200"}`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-slate-800"}`}>
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    {module.name}
                  </h3>

                  {/* Submodules (Quizzes) */}
                  <div className="space-y-3 ml-4">
                    {module.subModules?.map((submodule) => {
                      const diffConfig = getDifficultyConfig(submodule.difficulty);
                      
                      return (
                        <div
                            key={submodule.id}
                            className={`rounded-xl p-4 border transition-colors ${
                              isDark
                                ? "bg-[#0F172A] border-[#334155] hover:border-indigo-400/60"
                                : "bg-slate-50 border-slate-300 hover:border-indigo-400"
                            }`}
                          >
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex flex-col">
                                <h4 className={`font-medium flex items-center gap-2 flex-wrap ${isDark ? "text-gray-200" : "text-slate-900"}`}>
                                  {submodule.name}
                                  {!submodule.is_active && (
                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                                      isDark ? "bg-gray-800 text-gray-400" : "bg-slate-200 text-slate-600"
                                    }`}>
                                      <FiEyeOff className="w-3 h-3" />
                                      Disabled
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border ${diffConfig.bg} ${diffConfig.text} ${diffConfig.border}`}>
                                    {diffConfig.label}
                                  </span>
                                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-slate-600"}`}>
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    {submodule.questionCount || 0} Questions
                                  </span>
                                  {submodule.is_pro && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md border border-amber-500/30">
                                      <Award className="w-3 h-3" />
                                      Pro
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewMistakes(submodule, subject, module)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
                                  isDark
                                    ? "bg-blue-500/12 hover:bg-blue-500/20 text-blue-300 border-blue-400/35"
                                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                }`}
                                title="View Mistake Leaderboard"
                              >
                                <BarChart3 className="w-4 h-4" />
                                Mistakes
                              </button>

                              <button
                                onClick={() => handleEditQuiz(submodule.id)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
                                  isDark
                                    ? "bg-indigo-500/12 hover:bg-indigo-500/20 text-indigo-300 border-indigo-400/35"
                                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                                }`}
                                title="Edit Quiz Questions"
                              >
                                <FiEdit2 className="w-4 h-4" />
                                Edit
                              </button>

                              <button
                                onClick={() => toggleSubmodule(submodule.id, submodule.is_active)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
                                  submodule.is_active
                                    ? isDark
                                      ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                                    : isDark
                                      ? "bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-300 border-emerald-400/35"
                                      : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                }`}
                                title={submodule.is_active ? "Disable Quiz" : "Enable Quiz"}
                              >
                                {submodule.is_active ? (
                                  <>
                                    <FiEyeOff className="w-4 h-4" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <FiEye className="w-4 h-4" />
                                    Enable
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(!module.subModules || module.subModules.length === 0) && (
                      <p className={`text-sm italic ${isDark ? "text-gray-500" : "text-slate-500"}`}>No quizzes in this module</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mistakes Modal */}
      {showMistakesModal && selectedSubmodule && (
        <QuestionMistakesModal
          submodule={selectedSubmodule}
          onClose={() => {
            setShowMistakesModal(false);
            setSelectedSubmodule(null);
          }}
        />
      )}
    </div>
  );
}

export default TeacherQuizManagement;
