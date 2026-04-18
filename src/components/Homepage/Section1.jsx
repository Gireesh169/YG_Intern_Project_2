

// Section1.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { supabase } from "../../config/supabase";
import { setSignupData } from "../../slices/authSlice.jsx";
import { setCourseData, setTotalNoOfSubjects } from "../../slices/subjectsSlice.jsx";
import { supabaseService } from "../../services/supabaseService";
import { useTheme } from "../../utils/useTheme";

function Section1() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { signupData } = useSelector((state) => state.auth || {});
  const [gradeLoading, setGradeLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gradeLabel = (grade) => {
    if (grade === null || grade === undefined || grade === "") return "Not set";
    const n = Number(grade);
    if (Number.isNaN(n)) return String(grade);
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    if (n % 10 === 1) return `${n}st`;
    if (n % 10 === 2) return `${n}nd`;
    if (n % 10 === 3) return `${n}rd`;
    return `${n}th`;
  };

  const safeSetUserLocal = (userObj) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userObj));
      }
    } catch (error) {
      console.warn("safeSetUserLocal failed:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) console.error("Login error:", error);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleGradeSelect = async (value) => {
    if (!signupData) return;
    const newGrade = value === "" || value === null ? null : Number(value);
    const prevGrade = signupData?.grade ?? null;
    if (newGrade === prevGrade) return;
    const updatedUser = { ...signupData, grade: newGrade };
    safeSetUserLocal(updatedUser);
    localStorage.setItem("selectedGrade", String(newGrade));
    dispatch(setSignupData(updatedUser));
    dispatch(setCourseData([]));
    dispatch(setTotalNoOfSubjects(0));
    setGradeLoading(true);
    try {
      const res = await supabaseService.updateUserGrade(newGrade);
      if (res?.user) {
        const mergedUser = { ...updatedUser, ...res.user };
        safeSetUserLocal(mergedUser);
        dispatch(setSignupData(mergedUser));
      }
    } catch (err) {
      const message = String(err?.message || err || "");
      if (message.includes("User not logged in")) {
        alert(
          "You're not signed in. Your selection is saved locally — sign in to sync to server.",
        );
      } else {
        const revertedUser = { ...signupData, grade: prevGrade };
        safeSetUserLocal(revertedUser);
        dispatch(setSignupData(revertedUser));
        alert(
          "Could not save grade to server. Changes reverted locally.\n\nError: " +
            message,
        );
      }
    } finally {
      setGradeLoading(false);
    }
  };

  return (
    <section id="home">
      <div
        className="min-h-screen w-full relative overflow-hidden transition-colors duration-300"
        style={{
          backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",

          backgroundSize: "28px 28px",
        }}
      >
        {/* Glow decorations */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-3xl pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(99,102,241,0.15), transparent)"
              : "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)",
          }}
        />
        <div
          className="absolute top-20 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.12)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{
            background: isDark
              ? "rgba(59,130,246,0.08)"
              : "rgba(59,130,246,0.10)",
          }}
        />

        <div className="flex flex-col lg:flex-row relative z-10">
          {/* LEFT CONTENT */}
          <div className="w-full lg:w-[60%] flex flex-col items-center lg:items-start text-center lg:text-left pt-10 lg:pt-24 px-6 lg:pl-16 min-h-[60vh] lg:h-[90vh]">
            <div className="w-full h-full space-y-6 lg:space-y-8 flex flex-col items-center lg:items-start">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                style={{
                  background: isDark
                    ? "rgba(99,102,241,0.10)"
                    : "rgba(99,102,241,0.10)",
                  border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.30)"}`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                AI-Powered CBSE Learning
              </div>

              {/* Heading */}
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight transition-colors duration-300"
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              >
                Test your skills with <br className="hidden lg:block" />
                interactive
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
                  }}
                >
                  {" "}
                  quizzes
                </span>
              </h1>

              {/* Description */}
              <p
                className="text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-[580px] transition-colors duration-300"
                style={{ color: isDark ? "#94A3B8" : "#475569" }}
              >
                Master your CBSE subjects with AI-powered quizzes, real-time
                leaderboards, and personalized learning paths.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 mt-6 lg:mt-8 items-center w-full sm:w-auto">
                <button
                  onClick={() => navigate("/quizzes")}
                  className="text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                  }}
                >
                  Start Learning Now →
                </button>

                {!signupData && (
                  <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-3 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                    style={{
                      background: isDark ? "#111827" : "#FFFFFF",
                      border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                      color: isDark ? "#E5E7EB" : "#0F172A",
                      boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <img
                      src="https://www.svgrepo.com/show/355037/google.svg"
                      alt="Google"
                      className="w-5 h-5"
                    />
                    Sign in with Google
                  </button>
                )}
              </div>

              {/* Grade Selector */}
              {signupData && (
                <div
                  className="mt-8 rounded-2xl p-5 w-full sm:w-fit flex justify-center lg:justify-start transition-colors duration-300"
                  style={{
                    background: isDark ? "#111827" : "#FFFFFF",
                    border: `2px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                    boxShadow: isDark
                      ? "0 8px 32px rgba(0,0,0,0.4)"
                      : "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <p
                      className="text-sm font-medium transition-colors"
                      style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                    >
                      Your Grade:{" "}
                      <span className="text-indigo-400 font-bold">
                        {gradeLabel(signupData?.grade)}
                      </span>
                    </p>
                    <select
                      value={signupData?.grade ?? ""}
                      onChange={(e) => handleGradeSelect(e.target.value)}
                      disabled={gradeLoading}
                      className={`text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                        gradeLoading ? "opacity-70 cursor-wait" : ""
                      }`}
                      style={{
                        background: isDark ? "#0B0F19" : "#F8FAFC",
                        border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                        color: isDark ? "#E5E7EB" : "#0F172A",
                      }}
                    >
                      <option value="">Select Grade</option>
                      {[...Array(12)].map((_, i) => {
                        const grade = i + 1;
                        return (
                          <option key={grade} value={grade}>
                            {gradeLabel(grade)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              {/* Social proof */}
              <div className="flex items-center justify-center lg:justify-start gap-4 mt-8">
                <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1517841905240-472988babdf9",
                    "https://plus.unsplash.com/premium_photo-1682089877310-b2308b0dc719",
                    "https://plus.unsplash.com/premium_photo-1683141506839-c8a751f227b2",
                  ].map((src, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 rounded-full overflow-hidden"
                      style={{
                        border: `2px solid ${isDark ? "#0B0F19" : "#F0F4FF"}`,
                      }}
                    >
                      <img
                        src={`${src}?w=600&auto=format&fit=crop&q=60`}
                        alt="Student"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p
                  className="text-sm font-medium transition-colors"
                  style={{ color: isDark ? "#94A3B8" : "#475569" }}
                >
                  Join{" "}
                  <span
                    className="font-bold"
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                  >
                    5000+
                  </span>{" "}
                  students already learning
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="w-full lg:w-[40%] flex justify-center lg:justify-end items-center mt-12 lg:mt-0 px-6 lg:pr-16 relative">
            <div
              className="absolute inset-0 rounded-full blur-[100px] lg:hidden pointer-events-none"
              style={{ background: "rgba(99,102,241,0.05)" }}
            />
            <img
              src="../../../images/hero_Img.png"
              alt="Learning Illustration"
              className="w-full max-w-[550px] transition-all duration-300"
              style={{
                filter: isDark
                  ? "drop-shadow(0 0 30px rgba(99,102,241,0.2))"
                  : "drop-shadow(0 8px 24px rgba(99,102,241,0.15))",
                opacity: isDark ? 1 : 0.92,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Section1;
