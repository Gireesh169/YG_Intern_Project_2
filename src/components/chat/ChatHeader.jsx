import { useState } from "react";
import { FaArrowLeft, FaInfoCircle, FaEllipsisV } from "react-icons/fa";

export default function ChatHeader({
  user,
  contact,
  onSelectUser,
  onBack,
  activeTab = "conversation",
  setActiveTab = () => {},
  isDark = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeUser = user || contact;
  const handleBack = onBack || (() => onSelectUser?.(null));

  if (!activeUser) return null;

  return (
    <div
      className="h-[56px] md:h-[64px] px-3 md:px-5 flex items-center justify-between border-b transition-colors"
      style={{
        background: isDark ? "#0F172A" : "#FFFFFF",
        borderColor: isDark ? "#1F2937" : "#E2E8F0",
      }}
    >
      <div className="flex items-center gap-3">
        <IconButton isDark={isDark} onClick={handleBack}>
          <FaArrowLeft />
        </IconButton>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
          {(activeUser.full_name || activeUser.name || activeUser.email || "U")[0].toUpperCase()}
        </div>
        <div className="leading-tight">
          <p
            className="text-sm md:text-lg max-w-[160px] truncate font-extrabold"
            style={{ color: isDark ? "#E5E7EB" : "#1E293B" }}
          >
            {activeUser.full_name || activeUser.name || activeUser.email}
          </p>
        </div>
      </div>
      <div className="hidden md:flex gap-4 mt-0.5 text-sm">
        <Tab
          isDark={isDark}
          active={activeTab === "conversation"}
          onClick={() => setActiveTab("conversation")}
        >
          Conversation
        </Tab>
        <Tab
          isDark={isDark}
          active={activeTab === "files"}
          onClick={() => setActiveTab("files")}
        >
          Files
        </Tab>
      </div>

      <div className="relative flex items-center gap-1">


        <IconButton isDark={isDark} onClick={() => setMenuOpen((v) => !v)}>
          <FaEllipsisV />
        </IconButton>

        {menuOpen && (
          <div
            className="absolute right-0 top-10 w-40 rounded-lg shadow-md z-50 border"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              borderColor: isDark ? "#1F2937" : "#E2E8F0",
            }}
          >
            <MenuItem
              isDark={isDark}
              active={activeTab === "conversation"}
              onClick={() => {
                setActiveTab("conversation");
                setMenuOpen(false);
              }}
            >
              Conversation
            </MenuItem>
            <MenuItem
              isDark={isDark}
              active={activeTab === "files"}
              onClick={() => {
                setActiveTab("files");
                setMenuOpen(false);
              }}
            >
              Files
            </MenuItem>
          </div>
        )}
      </div>
    </div>
  );
}


function IconButton({ children, className = "", onClick, isDark = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition text-sm ${className}`}
      style={{ color: isDark ? "#94A3B8" : "#64748B" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDark ? "#1F2937" : "#F1F5F9";
        e.currentTarget.style.color = isDark ? "#E5E7EB" : "#334155";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = isDark ? "#94A3B8" : "#64748B";
      }}
    >
      {children}
    </button>
  );
}

function Tab({ children, active, onClick, isDark = false }) {
  return (
    <button
      onClick={onClick}
      className="font-medium transition"
      style={{
        color: active
          ? (isDark ? "#A5B4FC" : "#4F46E5")
          : (isDark ? "#9CA3AF" : "#64748B"),
      }}
    >
      {children}
    </button>
  );
}

function MenuItem({ children, active, onClick, isDark = false }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm font-medium"
      style={{
        color: active
          ? (isDark ? "#A5B4FC" : "#4F46E5")
          : (isDark ? "#E5E7EB" : "#334155"),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDark ? "#1F2937" : "#F1F5F9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </button>
  );
}
