import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../utils/useTheme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 hover:scale-105"
      style={{
        background: isDark ? "#111827" : "#F1F5F9",
        borderColor: isDark ? "#1F2937" : "#E2E8F0",
        boxShadow: isDark
          ? "0 0 12px rgba(99,102,241,0.15)"
          : "0 2px 8px rgba(0,0,0,0.08)",
      }}
      title={isDark ? "Switch to Light" : "Switch to Dark"}
    >
      {/* Track */}
      <div
        className="relative w-11 h-6 rounded-full transition-all duration-300"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #6366F1, #3B82F6)"
            : "linear-gradient(135deg, #F59E0B, #EF4444)",
        }}
      >
        {/* Thumb */}
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center"
          style={{
            left: isDark ? "calc(100% - 22px)" : "2px",
            boxShadow: isDark
              ? "0 0 8px rgba(99,102,241,0.5)"
              : "0 0 8px rgba(245,158,11,0.5)",
          }}
        >
          {isDark ? (
            <Moon size={11} className="text-indigo-600" />
          ) : (
            <Sun size={11} className="text-amber-500" />
          )}
        </div>
      </div>

      {/* Label */}
      <span
        className="text-xs font-semibold hidden sm:block"
        style={{ color: isDark ? "#9CA3AF" : "#475569" }}
      >
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
};

export default ThemeToggle;
