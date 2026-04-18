import React from "react";
import { MessageCircle, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../utils/useTheme";

const ChatToggleButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Hide the floating button if we are already on the chat page
  if (location.pathname === "/chat" || location.pathname === "/admin/chat") {
    return null;
  }

  return (
    <button
      onClick={() => navigate("/chat")}
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
      style={{
        background: "linear-gradient(135deg, #6366F1, #3B82F6)",
        boxShadow: isDark 
          ? "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.3)" 
          : "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
      }}
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        
        {/* Optional: Red notification dot if you have unread messages */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 rounded-full" 
              style={{ borderColor: isDark ? "#111827" : "#FFFFFF" }} />
      </div>
      
      {/* Tooltip that appears on hover */}
      <span className="absolute right-16 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with us
      </span>
    </button>
  );
};

export default ChatToggleButton;