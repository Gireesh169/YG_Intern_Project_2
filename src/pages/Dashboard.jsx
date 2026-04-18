// // pages/Dashboard.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { supabaseService } from "../services/supabaseService";
import { setCourseData, setTotalNoOfSubjects } from "../slices/subjectsSlice";
import { BarChart3, TrendingUp, History } from "lucide-react";
import CourseCard from "../components/Dashboard/CourseCard";
import { useTheme } from "../utils/useTheme";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { courseData } = useSelector((state) => state.viewSubject);
  const { signupData } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const isDark = theme === "dark";



  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const selectedGrade = signupData?.grade ?? null;
        const response = await supabaseService.getSubjects("", false, selectedGrade);

        const gradeFilteredSubjects = selectedGrade == null
          ? (response.subjects || [])
          : (response.subjects || []).filter(
              (subject) => Number(subject?.grade) === Number(selectedGrade),
            );

        dispatch(setCourseData(gradeFilteredSubjects));
        dispatch(setTotalNoOfSubjects(gradeFilteredSubjects.length));
      } catch (error) {
        console.error("Error loading courses:", error);
      }
    };

    // Fetch as soon as user is authenticated; grade may hydrate slightly later.
    if (signupData) {
      fetchSubjects();
    }
  }, [dispatch, signupData]); 

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: isDark ? "#0B0F19" : "#F0F4FF" }}
    >
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

      <div className="relative z-10 pt-28 pb-20">
        {/* Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-12 mt-4">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 transition-colors"
            style={{
              background: isDark
                ? "rgba(99,102,241,0.10)"
                : "rgba(99,102,241,0.08)",
              border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.30)"}`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI Powered Adaptive Study Guide
          </div>

          {/* Heading */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4 transition-colors duration-300"
            style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
          >
            Explore{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
              }}
            >
              CBSE Quizzes
            </span>
          </h1>

          {/* Subtext */}
          <p
            className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed transition-colors duration-300"
            style={{ color: isDark ? "#9CA3AF" : "#475569" }}
          >
            Strengthen your Class 9 &amp; 10 subjects with adaptive quizzes
            powered by AI.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mt-8">
            {/* View Analytics — always gradient */}
            <Link
              to="/analytics"
              className="group flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-semibold text-sm sm:text-base text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
              style={{
                background: "linear-gradient(135deg, #6366F1, #3B82F6)",
              }}
            >
              <BarChart3 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              View Analytics
            </Link>

            {/* Quiz History */}
            <Link
              to="/quiz-history"
              className="group flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105"
              style={{
                background: isDark ? "#243147" : "#FFFFFF",
border: `2px solid ${isDark ? "#3B82F6" : "#E2E8F0"}`,
                color: isDark ? "#E5E7EB" : "#0F172A",
                boxShadow: isDark
                  ? "0 0 0 1px rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(59,130,246,0.10)"
                  : "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <History className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
              Quiz History
            </Link>

            {/* Admin Panel */}
            {signupData?.isAdmin && (
              <Link
                to="/admin/dashboard"
                className="group flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105"
                style={{
                  background: isDark ? "#243147" : "#FFFFFF",
border: `2px solid ${isDark ? "#1f56aeff" : "#E2E8F0"}`,
                  color: isDark ? "#E5E7EB" : "#0F172A",
                  boxShadow: isDark
                    ? "0 0 0 1px rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(59,130,246,0.10)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <TrendingUp className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Course Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {courseData?.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>

        {/* Empty state */}
        {/* {!courseData?.length && (
          <div className="text-center py-24">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors"
              style={{
                background: isDark
                  ? "rgba(99,102,241,0.10)"
                  : "rgba(99,102,241,0.08)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.30)"}`,
              }}
            >
              <BarChart3 className="w-7 h-7 text-indigo-400" />
            </div>
            <h3
              className="text-lg font-bold mb-2 transition-colors duration-300"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              Loading subjects...
            </h3>
            <p
              className="text-sm transition-colors duration-300"
              style={{ color: isDark ? "#6B7280" : "#64748B" }}
            >
              Personalizing content for your grade.
            </p>
          </div>
        )} */}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
