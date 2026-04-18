// Section2.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaRegCheckCircle, FaRegLightbulb } from "react-icons/fa";
import { GiProgression, GiStopwatch } from "react-icons/gi";
import { LuNotebookPen } from "react-icons/lu";
import { AiOutlineThunderbolt } from "react-icons/ai";
import { useTheme } from "../../utils/useTheme";

function Section2() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const topFeatures = [
    {
      icon: <LuNotebookPen />,
      text: "Extensive question bank across all subjects",
    },
    {
      icon: <GiProgression />,
      text: "Difficulty levels from beginner to advanced",
    },
    {
      icon: <FaRegCheckCircle />,
      text: "Industry-standard assessment criteria",
    },
  ];

  const bottomFeatures = [
    {
      icon: <AiOutlineThunderbolt />,
      text: "Instant feedback for every question",
    },
    { icon: <FaRegLightbulb />, text: "Detailed explanations for all answers" },
    { icon: <GiStopwatch />, text: "Real-time score and progress tracking" },
  ];

  return (
    <section id="about">
      <div
        className="py-16 lg:py-20 transition-colors duration-300"
        style={{
          backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* TOP SECTION */}
          <div className="py-10 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
                {/* Badge */}
                <p className="uppercase text-sm font-bold text-indigo-400 tracking-[0.2em]">
                  Assessment Platform
                </p>

                {/* Heading */}
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight transition-colors duration-300"
                  style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
                >
                  Comprehensive{" "}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
                    }}
                  >
                    Quiz Topics
                  </span>
                </h2>

                {/* Description */}
                <p
                  className="text-base sm:text-lg leading-relaxed max-w-xl transition-colors duration-300"
                  style={{ color: isDark ? "#94A3B8" : "#475569" }}
                >
                  From basic concepts to advanced problems, our platform offers
                  quizzes that match industry standards, helping you assess and
                  improve your knowledge from beginner to expert level.
                </p>

                {/* Features */}
                <div className="space-y-4 w-full max-w-md">
                  {topFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 group transition-colors duration-200"
                      style={{ color: isDark ? "#CBD5E1" : "#334155" }}
                    >
                      <span
                        className="text-lg p-2.5 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0 transition-colors"
                        style={{
                          background: isDark
                            ? "rgba(99,102,241,0.10)"
                            : "rgba(99,102,241,0.10)",
                          border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.30)"}`,
                        }}
                      >
                        {feature.icon}
                      </span>
                      <p className="text-left font-medium">{feature.text}</p>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => navigate("/quizzes")}
                  className="mt-6 text-white font-bold px-8 py-3.5 rounded-2xl hover:scale-105 transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                  }}
                >
                  Browse Test →
                </button>
              </div>

              {/* Right Image */}
              <div className="flex justify-center relative">
                <div
                  className="absolute inset-0 rounded-full blur-[80px] pointer-events-none"
                  style={{ background: "rgba(99,102,241,0.05)" }}
                />
                <img
                  src="../../../images/hero_second.png"
                  alt="Quiz Illustration"
                  className="relative w-[80%] sm:w-[70%] md:w-[60%] lg:w-full max-w-md transition-all duration-300"
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

          {/* BOTTOM SECTION */}
          <div
            className="py-14 lg:py-24 rounded-[2.5rem] relative overflow-hidden mt-10 transition-colors duration-300"
            style={{
              background: isDark
                ? "linear-gradient(135deg, #111827, #0F172A)"
                : "linear-gradient(135deg, #FFFFFF, #F1F5F9)",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
              boxShadow: isDark
                ? "0 0 40px rgba(99,102,241,0.15)"
                : "0 8px 40px rgba(99,102,241,0.08)",
            }}
          >
            {/* Inner glow top left */}
            <div
              className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{
                background: isDark
                  ? "rgba(99,102,241,0.08)"
                  : "rgba(99,102,241,0.06)",
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-6 lg:px-16 relative z-10">
              {/* Image */}
              <div className="order-2 lg:order-1 flex justify-center">
                <img
                  src="../../../images/hero_third.svg"
                  alt="Interactive Quiz Illustration"
                  className="w-[80%] sm:w-[70%] md:w-[60%] lg:w-[420px] max-w-md hover:scale-105 transition duration-500"
                  style={{
                    filter: isDark
                      ? "drop-shadow(0 0 40px rgba(59,130,246,0.25))"
                      : "drop-shadow(0 8px 24px rgba(59,130,246,0.15))",
                  }}
                />
              </div>

              {/* Right Content */}
              <div className="order-1 lg:order-2 space-y-7 text-center lg:text-left flex flex-col items-center lg:items-start">
                {/* Badge */}
                <p className="uppercase text-sm font-bold text-indigo-400 tracking-[0.2em]">
                  AI Powered Testing
                </p>

                {/* Heading */}
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight transition-colors duration-300"
                  style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
                >
                  Interactive{" "}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
                    }}
                  >
                    Testing Experience
                  </span>
                </h2>

                {/* Description */}
                <p
                  className="text-base sm:text-lg leading-relaxed max-w-xl transition-colors duration-300"
                  style={{ color: isDark ? "#94A3B8" : "#475569" }}
                >
                  Take quizzes directly in your browser with our AI powered
                  testing interface. Get instant feedback, performance insights,
                  and smart explanations to accelerate learning.
                </p>

                {/* Features */}
                <div className="space-y-5 w-full max-w-md">
                  {bottomFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 group transition-colors duration-200"
                      style={{ color: isDark ? "#CBD5E1" : "#334155" }}
                    >
                      <span
                        className="text-lg p-3 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0 transition-colors"
                        style={{
                          background: isDark
                            ? "rgba(99,102,241,0.10)"
                            : "rgba(99,102,241,0.10)",
                          border: `1px solid ${isDark ? "rgba(99,102,241,0.30)" : "rgba(99,102,241,0.30)"}`,
                        }}
                      >
                        {feature.icon}
                      </span>
                      <p className="text-left font-medium">{feature.text}</p>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => navigate("/quizzes")}
                  className="mt-6 text-white font-bold px-8 py-3.5 rounded-2xl hover:scale-105 transition duration-300"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                  }}
                >
                  Start Quiz →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Section2;
