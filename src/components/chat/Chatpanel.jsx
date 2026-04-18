import React from "react";
import { FaRegCommentDots } from "react-icons/fa";

const Chatpanel = ({ role, isDark = false }) => {
    return (
        <div className="hidden md:flex h-full items-center justify-center px-6">
            <div
                className="text-center max-w-sm rounded-2xl p-8 border"
                style={{
                    background: isDark ? "rgba(15,23,42,0.8)" : "#FFFFFF",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                    boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.35)" : "0 8px 24px rgba(15,23,42,0.06)",
                }}
            >
                <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 
                        rounded-3xl shadow-xl flex items-center justify-center">
                    <FaRegCommentDots className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-xl font-semibold" style={{ color: isDark ? "#E5E7EB" : "#1E293B" }}>
                    Welcome to Intern Chat
                </h2>

                <p className="mt-2 text-sm leading-relaxed" style={{ color: isDark ? "#CBD5E1" : "#64748B" }}>
                    Select {role === "admin" ? "an intern" : "an admin"} from the left panel to start chatting.
                </p>
            </div>
        </div>
    );
};

export default Chatpanel;
