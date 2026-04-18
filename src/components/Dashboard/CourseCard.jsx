

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getCourseMeta } from "../../utils/courseMeta";
import { useTheme } from "../../utils/useTheme";

const DEFAULT_DESCRIPTION =
  "Engaging chapter-wise quiz sets designed for conceptual clarity and exam readiness.";

const getAccentColor = (gradient = "") => {
  if (gradient.includes("orange") || gradient.includes("red"))    return { raw: "249,115,22",  hex: "#F97316" };
  if (gradient.includes("cyan"))                                   return { raw: "6,182,212",   hex: "#06B6D4" };
  if (gradient.includes("blue"))                                   return { raw: "59,130,246",  hex: "#3B82F6" };
  if (gradient.includes("indigo") || gradient.includes("purple"))  return { raw: "99,102,241",  hex: "#6366F1" };
  if (gradient.includes("green") || gradient.includes("emerald"))  return { raw: "34,197,94",   hex: "#22C55E" };
  if (gradient.includes("pink") || gradient.includes("rose"))      return { raw: "244,63,94",   hex: "#F43F5E" };
  if (gradient.includes("amber") || gradient.includes("yellow"))   return { raw: "245,158,11",  hex: "#F59E0B" };
  if (gradient.includes("teal"))                                   return { raw: "20,184,166",  hex: "#14B8A6" };
  if (gradient.includes("violet") || gradient.includes("fuchsia")) return { raw: "139,92,246",  hex: "#8B5CF6" };
  return { raw: "99,102,241", hex: "#6366F1" };
};

const CourseCard = ({ course, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { Icon, gradient } = getCourseMeta(course.name);
  const accent = getAccentColor(gradient);

  const path = `/courses/${course.name
    .toLowerCase()
    .replace(/\s+/g, "-")}/${course.id}`;

  // ── Dark mode styles ──────────────────────────────────────────
  const darkCard = {
    background: isHovered
      ? "linear-gradient(145deg, #1e293b, #172033)"
      : "linear-gradient(145deg, #182032, #141c2b)",
    border: `1px solid rgba(${accent.raw}, ${isHovered ? 0.55 : 0.25})`,
    boxShadow: isHovered
      ? `0 0 0 1px rgba(${accent.raw},0.20), 0 8px 40px rgba(0,0,0,0.5), 0 0 40px rgba(${accent.raw},0.20)`
      : `0 0 0 1px rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.4), 0 0 16px rgba(${accent.raw},0.10)`,
  };

  // ── Light mode styles ─────────────────────────────────────────
  const lightCard = {
    background: isHovered ? "#FFFFFF" : "#FFFFFF",
    border: `1px solid ${isHovered ? `rgba(${accent.raw}, 0.40)` : "#E2E8F0"}`,
    boxShadow: isHovered
      ? `0 0 0 1px rgba(${accent.raw},0.15), 0 12px 40px rgba(0,0,0,0.10), 0 0 24px rgba(${accent.raw},0.12)`
      : "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
  };

  const cardStyle = isDark ? darkCard : lightCard;

  return (
    <Link
      to={path}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl p-8 overflow-hidden block"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
        ...cardStyle,
        transform: isHovered ? "translateY(-6px)" : "translateY(0)",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Inner gradient wash */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
        style={{
          opacity: isHovered ? (isDark ? 0.08 : 0.05) : (isDark ? 0.04 : 0.02),
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Top colored accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${gradient}`}
        style={{
          opacity: isHovered ? 1 : (isDark ? 0.5 : 0.4),
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Corner blob */}
      <div
        className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${gradient} rounded-bl-full`}
        style={{
          opacity: isHovered ? (isDark ? 0.20 : 0.12) : (isDark ? 0.09 : 0.06),
          transform: isHovered ? "translate(8px,-8px)" : "translate(14px,-14px)",
          transition: "all 0.5s ease",
        }}
      />

      {/* Icon */}
      <div className="relative mb-6">
        <div
          className={`bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-3xl mx-auto rounded-2xl`}
          style={{
            width: 72, height: 72,
            boxShadow: isHovered
              ? `0 8px 28px rgba(${accent.raw},0.40)`
              : `0 4px 14px rgba(${accent.raw},0.22)`,
            transform: isHovered ? "scale(1.08) rotate(5deg)" : "scale(1) rotate(0deg)",
            transition: "all 0.4s ease",
          }}
        >
          <Icon />
        </div>

        {isHovered && (
          <div
            className={`absolute bg-gradient-to-br ${gradient} rounded-2xl animate-ping`}
            style={{
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 72, height: 72,
              opacity: 0.15,
            }}
          />
        )}
      </div>

      {/* Title */}
      <h3
        className="text-xl font-bold text-center mb-3 transition-all duration-300"
        style={{
          color: isHovered
            ? accent.hex
            : isDark ? "#E5E7EB" : "#0F172A",
        }}
      >
        {course.name}
      </h3>

      {/* Description */}
      <p
        className="text-sm mb-6 leading-relaxed text-center min-h-[60px]"
        style={{ color: isDark ? "#6B7280" : "#64748B" }}
      >
        {course.description || DEFAULT_DESCRIPTION}
      </p>

      {/* CTA */}
      <div className="text-center">
        <span
          className={`inline-flex items-center font-semibold text-sm text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}
          style={{ gap: isHovered ? 12 : 6, transition: "gap 0.3s ease" }}
        >
          Start Learning
          <span style={{
            display: "inline-block",
            transform: isHovered ? "translateX(4px)" : "translateX(0)",
            transition: "transform 0.3s ease",
          }}>→</span>
        </span>
      </div>

      {/* Shimmer */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none"
        style={{
          opacity: isDark ? 0.025 : 0.4,
          transform: isHovered ? "translateX(100%)" : "translateX(-100%)",
          transition: "transform 0.9s ease",
        }}
      />
    </Link>
  );
};

export default CourseCard;