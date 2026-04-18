import React from "react";
import { FaBolt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../utils/useTheme";

function Section5() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className="py-16 sm:py-20 md:py-24 relative overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main Card */}
        <div
          className="relative max-w-6xl mx-auto rounded-[2rem] p-6 sm:p-10 md:p-16 overflow-hidden transition-all duration-300"
          style={{
            background: isDark ? "#111827" : "#FFFFFF",
            border: `2px solid ${isDark ? "#334155" : "#E2E8F0"}`,
            boxShadow: isDark
              ? "0 0 50px rgba(99,102,241,0.10)"
              : "0 8px 40px rgba(99,102,241,0.08)",
          }}
        >
          {/* Glow accents */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
            style={{
              background: isDark
                ? "rgba(99,102,241,0.10)"
                : "rgba(99,102,241,0.08)",
            }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
            style={{
              background: isDark
                ? "rgba(59,130,246,0.10)"
                : "rgba(59,130,246,0.08)",
            }}
          />

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center md:text-left">
              {/* Badge */}
              <div
                className="flex items-center gap-2 text-indigo-400 px-4 py-2 rounded-full w-fit mb-5 mx-auto md:mx-0 transition-colors"
                style={{
                  background: isDark
                    ? "rgba(99,102,241,0.10)"
                    : "rgba(99,102,241,0.08)",
                  border: `1px solid ${
                    isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.30)"
                  }`,
                }}
              >
                <FaBolt className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Premium Upgrade
                </span>
              </div>

              {/* Heading */}
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-5 tracking-tight transition-colors duration-300"
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              >
                Get QuizMaster{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
                  }}
                >
                  Pro
                </span>
              </h2>

              {/* Description */}
              <p
                className="text-base sm:text-lg mb-8 leading-relaxed max-w-lg mx-auto md:mx-0 transition-colors duration-300"
                style={{ color: isDark ? "#94A3B8" : "#475569" }}
              >
                Unlock advanced quiz analytics, unlimited attempts, detailed
                performance tracking, and exclusive Pro-only subjects. Take your
                learning to the next level today.
              </p>

              {/* Button */}
              <button
                onClick={() => navigate("/pricing")}
                className="w-full sm:w-auto text-white font-bold px-10 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                  boxShadow: isDark
                    ? "0 4px 20px rgba(99,102,241,0.30)"
                    : "0 4px 20px rgba(99,102,241,0.25)",
                }}
              >
                Upgrade to Pro →
              </button>
            </div>

            {/* Right Illustration */}
            <div className="flex justify-center">
              <div
                className="p-6 sm:p-10 rounded-3xl relative group transition-all duration-300"
                style={{
                  background: isDark ? "#0B1220" : "#F8FAFC",
                  border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                  boxShadow: isDark
                    ? "0 8px 32px rgba(0,0,0,0.4)"
                    : "0 8px 32px rgba(0,0,0,0.06)",
                }}
              >
                {/* Internal glow */}
                <div
                  className="absolute inset-0 rounded-3xl blur-2xl transition-all duration-300 pointer-events-none"
                  style={{
                    background: isDark
                      ? "rgba(99,102,241,0.05)"
                      : "rgba(99,102,241,0.03)",
                  }}
                />
                <img
                  src="/images/proPic.svg"
                  alt="QuizMaster Pro Illustration"
                  className="relative w-60 sm:w-72 md:w-80 h-auto object-contain transition-all duration-300"
                  style={{
                    filter: isDark
                      ? "drop-shadow(0 0 20px rgba(99,102,241,0.3))"
                      : "drop-shadow(0 8px 16px rgba(99,102,241,0.15))",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Section5;
