

import { useNavigate } from "react-router-dom";
import { BookOpen, BarChart2, Shield, GraduationCap } from "lucide-react";
import { useTheme } from "../../utils/useTheme"; 


const AdminDashboard = () => {
  const navigate = useNavigate();
   const { theme } = useTheme();                  
  const isDark = theme === "dark";

  return (
    <div
      className="min-h-screen bg-[#0B0F19] relative overflow-hidden"
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-gradient-to-b from-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Shield size={12} />
            Admin Panel
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#E5E7EB] mb-2 leading-tight">
            Admin{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
              }}
            >
              Dashboard
            </span>
          </h2>
          <p className="text-[#9CA3AF]\">Choose what you want to manage</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">



          {/* Content Management */}


<div
  onClick={() => navigate("/admin/grades")}
  className="group cursor-pointer relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
  onMouseEnter={e => {
    e.currentTarget.style.border = isDark
      ? '1px solid rgba(99,102,241,1)'
      : '1px solid rgba(99,102,241,1)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 16px 3px rgba(220,226,233,0.2)'
      : '0 4px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.border = isDark
      ? '1px solid rgba(220,226,233,0.8)'
      : '1px solid rgba(99,102,241,0.3)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)'
      : '0 4px 16px rgba(99,102,241,0.08)';
  }}
  style={{
    backgroundColor: isDark ? "#111827" : "#FFFFFF",
    border: isDark
      ? '2px solid rgba(220,226,233,0.8)'
      : '2px solid rgba(99,102,241,0.3)',
    boxShadow: isDark
      ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)"
      : "0 4px 16px rgba(99,102,241,0.08)",
    transition: "border 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease",
  }}
>
  {/* Top glow line */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  {/* Shimmer */}
  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
  {/* Corner glow */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

  <div className="relative flex items-center gap-5">
    <div
      className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
      style={{ boxShadow: "0 0 20px rgba(99,102,241,0)" }}
    >
      <BookOpen className="w-7 h-7 text-indigo-400" />
    </div>
    <div>
      <h3
        className="text-xl font-bold mb-1 group-hover:text-white transition-colors"
        style={{ color: isDark ? "#E5E7EB" : "#0f172a" }}
      >
        Content Management
      </h3>
      <p className="text-sm" style={{ color: isDark ? "#6B7280" : "#64748b" }}>
        Manage grades, subjects, modules & chapters
      </p>
    </div>
  </div>

  {/* Bottom arrow */}
<span
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer hover:scale-105"
  style={{
    background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)",
    border: isDark ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(99,102,241,0.2)",
    color: isDark ? "#A5B4FC" : "#4F46E5",
    marginTop: "25px",
  }}
>
  Click me →
</span>
</div>

  {/* Performance Analytics */}
<div
  onClick={() => navigate("/admin/performance-analytics")}
  className="group cursor-pointer relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
  onMouseEnter={e => {
    e.currentTarget.style.border = isDark
      ? '1px solid rgba(99,102,241,1)'
      : '1px solid rgba(99,102,241,1)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 16px 3px rgba(220,226,233,0.2)'
      : '0 4px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.border = isDark
      ? '1px solid rgba(220,226,233,0.8)'
      : '1px solid rgba(99,102,241,0.3)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)'
      : '0 4px 16px rgba(99,102,241,0.08)';
  }}
  style={{
    backgroundColor: isDark ? "#111827" : "#FFFFFF",
    border: isDark
      ? '2px solid rgba(220,226,233,0.8)'
      : '2px solid rgba(99,102,241,0.3)',
    boxShadow: isDark
      ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)"
      : "0 4px 16px rgba(99,102,241,0.08)",
    transition: "border 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease",
  }}
>
  {/* Top glow line */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  {/* Shimmer */}
  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
  {/* Corner glow */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

  <div className="relative flex items-center gap-5">
    <div
      className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
      style={{ boxShadow: "0 0 20px rgba(99,102,241,0)" }}
    >
      <BookOpen className="w-7 h-7 text-indigo-400" />
    </div>
    <div>
      <h3
        className="text-xl font-bold mb-1 group-hover:text-white transition-colors"
        style={{ color: isDark ? "#E5E7EB" : "#0f172a" }}
      >
         Performance Analytics
      </h3>
      <p className="text-sm" style={{ color: isDark ? "#6B7280" : "#64748b" }}>
      Track student performance & rankings
      </p>
    </div>
  </div>

  {/* Bottom arrow */}
<span
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer hover:scale-105"
  style={{
    background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)",
    border: isDark ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(99,102,241,0.2)",
    color: isDark ? "#A5B4FC" : "#4F46E5",
    marginTop: "25px",
  }}
>
  Click me →
</span>
</div>
        
          
          
 {/* Teacher Management  */}   
 <div
  onClick={() => navigate("/admin/teacher-quiz-management")}
  className="group cursor-pointer relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
  onMouseEnter={e => {
    e.currentTarget.style.border = isDark
      ? '1px solid rgba(99,102,241,1)'
      : '1px solid rgba(99,102,241,1)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 16px 3px rgba(220,226,233,0.2)'
      : '0 4px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.border = isDark
      ? '1px solid rgba(220,226,233,0.8)'
      : '1px solid rgba(99,102,241,0.3)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)'
      : '0 4px 16px rgba(99,102,241,0.08)';
  }}
  style={{
    backgroundColor: isDark ? "#111827" : "#FFFFFF",
    border: isDark
      ? '1px solid rgba(220,226,233,0.8)'
      : '1px solid rgba(99,102,241,0.3)',
    boxShadow: isDark
      ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)"
      : "0 4px 16px rgba(99,102,241,0.08)",
    transition: "border 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease",
  }}
>
  {/* Top glow line */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  {/* Shimmer */}
  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
  {/* Corner glow */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

  <div className="relative flex items-center gap-5">
    <div
      className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
      style={{ boxShadow: "0 0 20px rgba(99,102,241,0)" }}
    >
      <BookOpen className="w-7 h-7 text-indigo-400" />
    </div>
    <div>
      <h3
        className="text-xl font-bold mb-1 group-hover:text-white transition-colors"
        style={{ color: isDark ? "#E5E7EB" : "#0f172a" }}
      >
         Teacher Quiz Management
      </h3>
      <p className="text-sm" style={{ color: isDark ? "#6B7280" : "#64748b" }}>
     Edit quizzes, disable & view mistake leaderboard
      </p>
    </div>
  </div>

  {/* Bottom arrow */}
<span
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer hover:scale-105"
  style={{
    background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)",
    border: isDark ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(99,102,241,0.2)",
    color: isDark ? "#A5B4FC" : "#4F46E5",
    marginTop: "25px",
  }}
>
  Click me →
</span>
</div>
        


        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

