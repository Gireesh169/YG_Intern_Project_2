  import React, { useEffect, useMemo, useState } from "react";
  import AdminOverallStats from "./AdminOverallStats.jsx";
  import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
  } from "chart.js";
  import { Doughnut, Bar } from "react-chartjs-2";
  import supabaseService from "../../../services/supabaseService";
  import { setAnalyticsOfAll } from "../../../slices/analyticsSlice.jsx";
  import { useDispatch, useSelector } from "react-redux";
  import { useTheme } from "../../../utils/useTheme";
  import { ArrowLeft, Users, Target, TrendingUp, AlertTriangle } from "lucide-react";

  ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

  const getRiskLevel = (accuracy) => {
    if (accuracy < 40) return "danger";
    if (accuracy < 70) return "warning";
    return "success";
  };

  const riskStyles = {
    danger: { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", text: "#F87171", label: "At Risk" },
    warning: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", text: "#FBbf24", label: "Average" },
    success: { bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.25)", text: "#4ADE80", label: "Good" },
  };

  const riskStylesLight = {
    danger: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.20)", text: "#DC2626", label: "At Risk" },
    warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.20)", text: "#D97706", label: "Average" },
    success: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.20)", text: "#16A34A", label: "Good" },
  };

  function AdminAnalyticsDashboard() {
    const [students, setStudents] = useState([]);
    const [searchName, setSearchName] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeSection, setActiveSection] = useState("overallStats");
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const { analyticsofall } = useSelector((state) => state.viewAnalytics);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    useEffect(() => {
      const fetchAnalytics = async () => {
        try {
          setLoading(true);
          if (analyticsofall && Object.keys(analyticsofall).length > 0) {
            setStudents(Object.values(analyticsofall));
          } else {
            const data = await supabaseService.get_analytics_all();
            dispatch(setAnalyticsOfAll(data?.perStudent || {}));
            setStudents(Object.values(data?.perStudent || {}));
          }
        } catch (error) {
          console.error("Admin analytics fetch failed:", error);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAnalytics();
    }, []);

    const filteredStudents = useMemo(() => {
      return students.filter((s) => {
        const matchesName = s?.user?.name?.toLowerCase().includes(searchName.toLowerCase());
        const stats = s?.overall?.stats || {};
        const risk = getRiskLevel(stats.accuracy || 0);
        const matchesStatus = statusFilter === "all" ? true : statusFilter === risk;
        return matchesName && matchesStatus;
      });
    }, [students, searchName, statusFilter]);

    const globalStats = useMemo(() => {
      let total = 0, accuracy = 0, mastery = 0, atRisk = 0;
      students.forEach((s) => {
        const stats = s?.overall?.stats;
        if (!stats) return;
        total++;
        accuracy += Number(stats.accuracy || 0);
        mastery += Number(stats.mastery || 0);
        if (stats.accuracy < 40) atRisk++;
      });
      return {
        total,
        avgAccuracy: total ? (accuracy / total).toFixed(1) : 0,
        avgMastery: total ? (mastery / total).toFixed(1) : 0,
        atRisk,
      };
    }, [students]);

    const overallStats = selectedStudent?.overall?.stats || {};
    const subjectStats = Array.isArray(selectedStudent?.subjects?.stats)
      ? selectedStudent.subjects.stats : [];
    const accuracy = Number(overallStats.accuracy || 0);
    const remaining = Math.max(0, 100 - accuracy);

    const rs = isDark ? riskStyles : riskStylesLight;

    // Chart theme colors
    const chartGridColor = isDark ? "rgba(31,41,55,1)" : "rgba(226,232,240,1)";
    const chartTickColor = isDark ? "#9CA3AF" : "#64748B";
    const chartLegendColor = isDark ? "#9CA3AF" : "#475569";

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
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{ background: isDark ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.05)" }} />

        <div className="max-w-7xl mx-auto px-6 mt-16 relative z-10">

          {/* ── ADMIN OVERVIEW ── */}
          {!selectedStudent && (
            <>
              {/* Title */}
              <div className="text-center mb-10">
                <h2
                  className="text-3xl md:text-4xl font-extrabold mb-2 transition-colors"
                  style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                >
                  Admin{" "}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)" }}
                  >
                    AnalyticsDashboard
                  </span>
                </h2>
                <p className="text-sm transition-colors" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
                  Monitor student performance across all subjects
                </p>
              </div>

              {/* Global Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              >
                {[
                  { label: "Total Students", value: globalStats.total, icon: <Users size={20} className="text-indigo-400" />, iconBg: "bg-indigo-500/10 border-indigo-500/20" },
                  { label: "Avg Accuracy", value: `${globalStats.avgAccuracy}%`, icon: <Target size={20} className="text-blue-400" />, iconBg: "bg-blue-500/10 border-blue-500/20" },
                  { label: "Avg Mastery", value: `${globalStats.avgMastery}%`, icon: <TrendingUp size={20} className="text-cyan-400" />, iconBg: "bg-cyan-500/10 border-cyan-500/20" },
                  { label: "At Risk", value: globalStats.atRisk, icon: <AlertTriangle size={20} className="text-red-400" />, iconBg: "bg-red-500/10 border-red-500/20" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 text-white"
                      style={{
                background: isDark ? "#111827" : "#FFFFFF",
                border: isDark
                  ? "2px solid#496b9bff"
                  : "1px solid #E2E8F0",
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
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${stat.iconBg}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-extrabold transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs font-medium mt-1 transition-colors" style={{ color: isDark ? "#c1c4cbff" : "#94A3B8" }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6"
              >
                <input
                  type="text"
                  placeholder="Search student by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl focus:outline-none transition-all text-sm"
                    style={{
                background: isDark ? "#111827" : "#FFFFFF",
                border: isDark
                  ? "2px solid rgba(24,94,151,0.55)"
                  : "1px solid #E2E8F0",
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
                  onFocus={(e) => e.target.style.borderColor = "#6366F1"}
                  onBlur={(e) => e.target.style.borderColor = isDark ? "#1F2937" : "#E2E8F0"}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl focus:outline-none transition-all text-sm cursor-pointer"
                    style={{
                background: isDark ? "#111827" : "#FFFFFF",
                border: isDark
                  ? "2px solid rgba(24,94,151,0.55)"
                  : "1px solid #E2E8F0",
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
                  <option value="all">All Students</option>
                  <option value="success">Good</option>
                  <option value="warning">Average</option>
                  <option value="danger">At Risk</option>
                </select>
              </div>

              {/* Loading */}
              {loading && (
                <div className="text-center py-16">
                  <div className="relative w-12 h-12 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                  </div>
                  <p className="text-sm transition-colors" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
                    Loading analytics...
                  </p>
                </div>
              )}

              {/* No Data */}
              {!loading && filteredStudents.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-sm transition-colors" style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>
                    No students found
                  </p>
                </div>
              )}

              {/* Students Table */}
              {!loading && filteredStudents.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden transition-colors"
                  style={{
                    background: isDark ? "#111827" : "#FFFFFF",
                    border: `2px solid ${isDark ? "#496b9bff" : "#E2E8F0"}`,
                    boxShadow: isDark ? "0 0 40px rgba(99,102,241,0.06)" : "0 8px 32px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Top accent */}
                  <div className="h-px w-full"
                    style={{ background: "linear-gradient(to right, transparent, rgba(99,102,241,0.5), transparent)" }} />

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr style={{
                          background: isDark
                            ? "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.05))"
                            : "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(59,130,246,0.03))",
                        }}>
                          {["Name", "Email", "Accuracy", "Avg Score", "Attempts", "Mastery", "Status", "Action"].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest"
                              style={{
                                color: isDark ? "#6B7280" : "#94A3B8",
                                borderBottom: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody key={theme}>
                        {filteredStudents.map((s, i) => {
                          const stats = s?.overall?.stats || {};
                          const risk = getRiskLevel(stats.accuracy || 0);
                          const rStyle = rs[risk];

                          return (
                            <tr
                              key={i}
                              style={{
                                borderBottom: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                                background: isDark ? "#111827" : "#FFFFFF",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.03)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "#111827" : "#FFFFFF"}
                            >
                              <td className="px-4 py-3 text-sm font-semibold transition-colors"
                                style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                                {s.user?.name}
                              </td>
                              <td className="px-4 py-3 text-sm transition-colors"
                                style={{ color: isDark ? "#b6b9c0ff" : "#475569" }}>
                                {s.user?.email}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-20 h-1.5 rounded-full overflow-hidden"
                                    style={{ background: isDark ? "#1F2937" : "#E2E8F0" }}
                                  >
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${stats.accuracy || 0}%`,
                                        background: risk === "danger" ? "#EF4444" : risk === "warning" ? "#F59E0B" : "#22C55E",
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold transition-colors"
                                    style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                                    {stats.accuracy || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm transition-colors"
                                style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
                                {stats.avgScore || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm transition-colors"
                                style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
                                {stats.attendedTotal || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm transition-colors"
                                style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
                                {stats.mastery || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                  style={{
                                    background: rStyle.bg,
                                    border: `1px solid ${rStyle.border}`,
                                    color: rStyle.text,
                                  }}
                                >
                                  {rStyle.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => { setSelectedStudent(s); setActiveSection("overallStats"); }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                                  style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STUDENT DETAILS ── */}
          {selectedStudent && (
            <>
              {/* Back */}
              <button
                onClick={() => setSelectedStudent(null)}
                className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
                style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A"}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569"}
              >
                <ArrowLeft size={16} />
                Back to students
              </button>

              {/* Tabs */}
              <div
                className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto"
                style={{
                  background: isDark ? "#111827" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#98b2d6ff" : "#E2E8F0"}`,
                }}
              >
                {[
                  ["overallStats", "Overall Stats"],
                  ["overallPerformance", "Overall Performance"],
                  ["subjectTable", "Subject Performance"],
                  ["subjectChart", "Subject Accuracy"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200"
                    style={{
                      background: activeSection === key
                        ? "linear-gradient(135deg, #6366F1, #3B82F6)"
                        : "transparent",
                      color: activeSection === key
                        ? "#FFFFFF"
                        : isDark ? "#cfd4dded" : "#475569",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Student Card */}
              <div
                className="rounded-2xl overflow-hidden transition-colors"
                style={{
                  background: isDark ? "#111827" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#97afd1a6" : "#E2E8F0"}`,
                  boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                {/* Student Header */}
                <div
                  className="px-6 py-5 border-b"
                  style={{ borderColor: isDark ? "#1F2937" : "#E2E8F0" }}
                >
                  <h2
                    className="text-xl font-bold transition-colors"
                    style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                  >
                    {selectedStudent.user?.name}
                  </h2>
                  <p
                    className="text-sm transition-colors"
                    style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                  >
                    {selectedStudent.user?.email}
                  </p>
                </div>

                <div className="p-6">

                  {/* Overall Stats */}
                  {activeSection === "overallStats" && (
                    <AdminOverallStats canonical={selectedStudent} fromAdmin={true} />
                  )}

                  {/* Overall Performance Chart */}
                  {activeSection === "overallPerformance" && (
                    <div className="flex flex-col items-center gap-6">
                      <div style={{ width: 280 }}>
                        <Doughnut
                          data={{
                            labels: ["Accuracy", "Mastery", "Remaining"],
                            datasets: [{
                              data: [accuracy, overallStats.mastery || 0, remaining],
                              backgroundColor: ["#6366F1", "#22C55E", isDark ? "#1F2937" : "#E2E8F0"],
                              borderWidth: 2,
                              borderColor: isDark ? "#111827" : "#FFFFFF",
                            }],
                          }}
                          options={{
                            cutout: "70%",
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { color: chartLegendColor, padding: 16, font: { size: 12 } },
                              },
                              tooltip: {
                                callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
                              },
                            },
                            animation: { animateRotate: true, animateScale: true },
                          }}
                        />
                      </div>
                      <div
                        className="rounded-xl p-4 w-full max-w-xs space-y-2"
                        style={{
                          background: isDark ? "#0B0F19" : "#F8FAFC",
                          border: `1px solid ${isDark ? "#576476ff" : "#E2E8F0"}`,
                        }}
                      >
                        <div className="flex justify-between text-sm" >
                          <span style={{ color: isDark ? "#9CA3AF" : "#475569"}}>Class Avg Accuracy</span>
                          <span className="font-bold" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                            {globalStats.avgAccuracy}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: isDark ? "#9CA3AF" : "#475569" }}>Class Avg Mastery</span>
                          <span className="font-bold" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                            {globalStats.avgMastery}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subject Table */}
                  {activeSection === "subjectTable" && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr style={{
                            background: isDark
                              ? "rgba(99,102,241,0.06)"
                              : "rgba(99,102,241,0.04)",
                          }}>
                            {["Subject", "Accuracy", "Avg Score", "Coverage", "Mastery"].map((h) => (
                              <th key={h}
                                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest"
                                style={{
                                  color: isDark ? "#6B7280" : "#94A3B8",
                                  borderBottom: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {subjectStats.map((s, i) => {
                            const aRisk = s.accuracy < 40 ? "danger" : s.accuracy < 70 ? "warning" : "success";
                            const mRisk = s.mastery < 40 ? "danger" : s.mastery < 70 ? "warning" : "success";
                            return (
                              <tr
                                key={i}
                                style={{
                                  borderBottom: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                                  background: isDark ? "#111827" : "#FFFFFF",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.03)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "#111827" : "#FFFFFF"}
                              >
                                <td className="px-4 py-3 text-sm font-semibold transition-colors"
                                  style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                                  {s.subjectName}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 rounded-full overflow-hidden"
                                      style={{ background: isDark ? "#1F2937" : "#E2E8F0" }}>
                                      <div className="h-full rounded-full"
                                        style={{
                                          width: `${s.accuracy}%`,
                                          background: aRisk === "danger" ? "#EF4444" : aRisk === "warning" ? "#F59E0B" : "#22C55E",
                                        }} />
                                    </div>
                                    <span className="text-xs font-bold" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                                      {s.accuracy}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
                                  {s.avgScore}
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
                                  {s.coverage}%
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                    style={{
                                      background: rs[mRisk].bg,
                                      border: `1px solid ${rs[mRisk].border}`,
                                      color: rs[mRisk].text,
                                    }}>
                                    {s.mastery}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Subject Chart */}
                  {activeSection === "subjectChart" && (
                    <div style={{ height: 360 }}>
                      <Bar
                        data={{
                          labels: subjectStats.map((s) => s.subjectName),
                          datasets: [
                            {
                              label: "Student Accuracy (%)",
                              data: subjectStats.map((s) => s.accuracy),
                              backgroundColor: subjectStats.map((s) =>
                                s.accuracy < 40 ? "#F87171" : s.accuracy < 70 ? "#FBBF24" : "#4ADE80"
                              ),
                              borderRadius: 6,
                            },
                            {
                              label: "Class Avg Accuracy (%)",
                              data: subjectStats.map(() => globalStats.avgAccuracy),
                              backgroundColor: isDark ? "rgba(99,102,241,0.40)" : "rgba(99,102,241,0.30)",
                              borderRadius: 6,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            tooltip: {
                              callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%` },
                            },
                            legend: {
                              position: "bottom",
                              labels: { color: chartLegendColor, padding: 16, font: { size: 12 } },
                            },
                          },
                          scales: {
                            x: {
                              ticks: { color: chartTickColor, font: { size: 11 } },
                              grid: { color: chartGridColor },
                            },
                            y: {
                              beginAtZero: true,
                              max: 100,
                              ticks: { color: chartTickColor, font: { size: 11 } },
                              grid: { color: chartGridColor },
                            },
                          },
                        }}
                      />
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  export default AdminAnalyticsDashboard;