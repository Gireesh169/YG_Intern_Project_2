import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { supabase } from "../../config/supabase";
import Header from "../common/Header.jsx";
import { setSignupData } from "../../slices/authSlice.jsx"; // update path if needed
import { supabaseService } from "../../services/supabaseService"; // adjust path if needed

function Section1() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { signupData } = useSelector((state) => state.auth || {});

  const [gradeLoading, setGradeLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error("Login error:", error);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // helper to format grade like "11th"
  const gradeLabel = (g) => {
    if (g === null || g === undefined || g === "") return "Not set";
    const n = Number(g);
    if (Number.isNaN(n)) return String(g);
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    if (n % 10 === 1) return `${n}st`;
    if (n % 10 === 2) return `${n}nd`;
    if (n % 10 === 3) return `${n}rd`;
    return `${n}th`;
  };

  // Utility: safe localStorage set
  const safeSetUserLocal = (userObj) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userObj));
      }
    } catch (e) {
      console.warn("safeSetUserLocal failed:", e);
    }
  };

  // NEW: async handler that saves locally and sends to backend using the exact name updateUserGrade
  const handleGradeSelect = async (value) => {
    const newGrade = value === "" ? null : Number(value);
    const prevGrade = signupData?.grade ?? null;
    const updatedUser = { ...(signupData || {}), grade: newGrade };
localStorage.setItem("user", JSON.stringify(mergedUser));
localStorage.setItem("selectedGrade", String(newGrade));
    // optimistic local update
    safeSetUserLocal(updatedUser);
    dispatch(setSignupData(updatedUser));

    setGradeLoading(true);
    try {
      // NOTE: calling the method name you asked to keep
      const res = await supabaseService.updateUserGrade(newGrade);
      console.log("updateUserGrade response:", res);

      // If the server returns an updated user/profile, merge it
      if (res?.user) {
        const merged = { ...updatedUser, ...res.user };
        safeSetUserLocal(merged);
        dispatch(setSignupData(merged));
      }

      // (Optional) show success feedback here (toast)
      // e.g., toast.success("Grade saved to server");
    } catch (err) {
      console.error("Failed to update grade:", err);

      const msg = String(err?.message || err || "");

      if (msg.includes("User not logged in")) {
        // user not authenticated — keep local change and prompt to login
        // This avoids losing their selection; tell them to sign in to sync.
        alert(
          "You're not signed in. Your selection is saved locally — sign in to sync to server.",
        );
      } else {
        // server or other error — revert to previous value and inform user
        const reverted = { ...(signupData || {}), grade: prevGrade };
        safeSetUserLocal(reverted);
        dispatch(setSignupData(reverted));
        alert(
          "Could not save grade to server. Changes reverted locally.\n\nError: " +
            msg,
        );
      }
    } finally {
      setGradeLoading(false);
    }
  };

    return (
    <section id="home">
      <Header />
      <div
        className="min-h-screen w-full bg-[#0B0F19] relative overflow-hidden"

      >
        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex">
          {/* Left Content */}
          <div className="w-[60%] flex flex-col pt-16 pl-16 h-[90vh]">
            <div className="w-full h-full space-y-8 pl-8">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                AI-Powered CBSE Platform
              </div>

              <h1 className="text-4xl md:text-7xl font-bold text-[#E5E7EB] leading-tight">
                Test your skills with
                <br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
                  }}
                >
                  interactive quizzes
                </span>
              </h1>

              <p className="text-lg text-[#9CA3AF] leading-relaxed max-w-[540px]">
                Master your CBSE subjects with AI-powered quizzes, real-time
                leaderboards, and personalized learning paths.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={() => navigate("/quizzes")}
                  className="flex items-center justify-center gap-2 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:scale-105 hover:shadow-indigo-500/40 transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                  }}
                >
                  Start Learning →
                </button>

                {!signupData && (
                  <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-2 bg-[#111827] border border-[#1F2937] hover:border-indigo-500/40 text-[#E5E7EB] font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:bg-[#1F2937] hover:scale-105"
                  >
                    <img
                      src="https://www.svgrepo.com/show/355037/google.svg"
                      alt="Google"
                      className="w-5 h-5"
                    />
                    Continue with Google
                  </button>
                )}
              </div>

              {/* Grade selector */}
              {signupData && (
                <div className="mt-6 bg-[#111827] border border-[#1F2937] rounded-xl p-4 w-fit">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <p className="text-[#9CA3AF] text-sm font-medium">
                      Your Grade:{" "}
                      <span className="text-indigo-400 font-bold">
                        {signupData?.grade ? `${signupData.grade}th` : "Not set"}
                      </span>
                    </p>
                    <select
                      id="home-grade-selector"
                      name="home-grade-selector"
                      value={signupData?.grade ?? ""}
                      onChange={(e) => handleGradeSelect(e.target.value)}
                      disabled={gradeLoading}
                      className={`bg-[#0B0F19] border border-[#1F2937] text-[#E5E7EB] text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 transition-all duration-200 ${
                        gradeLoading ? "opacity-50 cursor-wait" : "cursor-pointer"
                      }`}
                    >
                      <option value="">Select Grade</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {gradeLabel(n)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Social proof */}
              <div className="flex items-center gap-3 mt-8">
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=60",
                    "https://plus.unsplash.com/premium_photo-1682089877310-b2308b0dc719?w=600&auto=format&fit=crop&q=60",
                    "https://plus.unsplash.com/premium_photo-1683141506839-c8a751f227b2?w=600&auto=format&fit=crop&q=60",
                  ].map((src, i) => (
                    <div key={i} className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#0B0F19]">
                      <img src={src} alt="Student" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#9CA3AF] font-medium">
                  Join{" "}
                  <span className="text-[#E5E7EB] font-semibold">5,000+</span>{" "}
                  students already learning
                </p>
              </div>

            </div>
          </div>

          {/* Right Image */}
          <div className="flex items-end justify-center lg:justify-end w-[40%] absolute bottom-0 right-0 h-[90vh]">
            <img
              src="../../../images/hero_Img.png"
              alt="Learning Illustration"
              className="w-full mt-8 lg:mt-0 opacity-90"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Section1;
