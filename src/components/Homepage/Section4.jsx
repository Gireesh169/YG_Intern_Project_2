

import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaFlask,
  FaCalculator,
  FaBook,
  FaGlobeAsia,
  FaLanguage,
} from "react-icons/fa";
import { useTheme } from "../../utils/useTheme";

const subjectMeta = [
  {
    name: "Science",
    icon: <FaFlask />,
    color: "#9333ea",
    description: "Explore the wonders of biology, chemistry, and physics.",
    buttonClass: "bg-purple-600 hover:bg-purple-700",
  },
  {
    name: "Math",
    icon: <FaCalculator />,
    color: "#4f46e5",
    description:
      "Sharpen your problem-solving skills with algebra and geometry.",
    buttonClass: "bg-indigo-600 hover:bg-indigo-700",
  },
  {
    name: "English",
    icon: <FaBook />,
    color: "#ec4899",
    description: "Improve your grammar, vocabulary, and literary knowledge.",
    buttonClass: "bg-pink-600 hover:bg-pink-700",
  },
  {
    name: "Hindi",
    icon: <FaLanguage />,
    color: "#dc2626",
    description: "Test your Hindi language comprehension and script knowledge.",
    buttonClass: "bg-red-600 hover:bg-red-700",
  },
  {
    name: "Geography",
    icon: <FaGlobeAsia />,
    color: "#0d9488",
    description:
      "Learn about our planet, its landscapes, and diverse cultures.",
    buttonClass: "bg-teal-600 hover:bg-teal-700",
  },
];

const Section4 = () => {
  const navigate = useNavigate();
  const { token, session, signupData } = useSelector((state) => state.auth);
  const isAuthenticated = Boolean(token || session || signupData);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const infiniteSubjects = [...subjectMeta, ...subjectMeta];

  const handleSubjectClick = () => navigate("/quizzes");

  return (
    <section
      className="flex flex-col items-center py-12 md:py-16 px-4 overflow-hidden relative font-sans transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)"
            : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)",
        }}
      />

      {/* TITLE */}
      <h1
        className="text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-10 transition-colors duration-300 relative z-10"
        style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
      >
        Choose Your{" "}
        <span
          className="text-transparent bg-clip-text"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
          }}
        >
          Learning Path
        </span>{" "}
        🚀
      </h1>

      <div className="relative w-full max-w-7xl overflow-hidden group">
        {/* LEFT FADE */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-20 md:w-44 z-10"
          style={{
            background: isDark
              ? "linear-gradient(to right, #0B0F19, transparent)"
              : "linear-gradient(to right, #F0F4FF, transparent)",
          }}
        />

        {/* RIGHT FADE */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-20 md:w-44 z-10"
          style={{
            background: isDark
              ? "linear-gradient(to left, #0B0F19, transparent)"
              : "linear-gradient(to left, #F0F4FF, transparent)",
          }}
        />

        {/* SCROLL TRACK */}
        <div className="flex w-max animate-scroll hover:[animation-play-state:paused] py-4">
          {infiniteSubjects.map((subject, index) => (
            <div
              key={index}
              onClick={() => handleSubjectClick(subject)}
              className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-4 md:mx-8 flex-shrink-0 rounded-full border-[3px] transition-all duration-500 flex flex-col justify-center items-center text-center p-8 cursor-pointer group/card"
              style={{
                background: isDark
                  ? "rgba(26,26,46,0.60)"
                  : "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                borderColor: "transparent",
                boxShadow: isDark
                  ? "0 4px 24px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(0,0,0,0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = subject.color;
                e.currentTarget.style.boxShadow = `0 0 35px ${subject.color}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 4px 24px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(0,0,0,0.08)";
              }}
            >
              {/* Icon */}
              <div
                className="text-4xl md:text-5xl mb-2 transition-transform duration-300 group-hover/card:scale-125"
                style={{ color: subject.color }}
              >
                {subject.icon}
              </div>

              {/* Name */}
              <h2
                className="text-base sm:text-lg md:text-xl font-bold mt-1 transition-colors"
                style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
              >
                {subject.name}
              </h2>

              {/* Description */}
              <p
                className="text-[10px] sm:text-xs mt-1 px-4 line-clamp-2 leading-tight transition-colors"
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              >
                {subject.description}
              </p>

              {/* Hover Button */}
              <div className="absolute bottom-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubjectClick(subject);
                  }}
                  className={`px-4 py-1.5 text-[10px] md:text-xs rounded-full ${subject.buttonClass} text-white font-bold shadow-lg`}
                >
                  Start Quiz →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom hint text */}
      <p
        className="text-sm md:text-base mt-10 italic text-center transition-colors relative z-10"
        style={{ color: isDark ? "#64748B" : "#94A3B8" }}
      >
        {isAuthenticated
          ? "Hover over a subject to pause the scroll and start the quiz."
          : "Login to access your personalized quizzes and track your progress."}
      </p>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll { animation: scroll 35s linear infinite; }
      `}</style>
    </section>
  );
};

export default Section4;
