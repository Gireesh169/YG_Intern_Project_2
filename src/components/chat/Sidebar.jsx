// import { useState } from "react";
// import { FiLogOut, FiMoreVertical, FiSearch } from "react-icons/fi";
// import { BsCheck2All } from "react-icons/bs";
// import { supabase } from "../../config/supabase";
// import { BiUser } from "react-icons/bi";
// import { FaRegCommentDots } from "react-icons/fa";

// export default function Sidebar({ users, selectedUser, onSelectUser, currentUserId, setShowProfile }) {
//   const [search, setSearch] = useState("");
//   const [showMenu, setShowMenu] = useState(false);

//   const filteredChats = users.filter((user) =>
//     (user.full_name || "").toLowerCase().includes(search.toLowerCase())
//   );

//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//     } catch (_) { }
//     localStorage.clear();
//     sessionStorage.clear();
//     window.location.reload();
//   };

//   return (
//     <div
//       className={`h-screen bg-[#f0f2f5] border-r border-slate-200 flex flex-col flex-shrink-0 md:w-[340px] xl:w-[360px] ${selectedUser ? "hidden sm:flex" : "w-screen"
//         }`}
//     >
//       <div className="sticky top-0 z-20 bg-[#f0f2f5]">
//         <div className="relative px-3 py-3 flex items-center justify-between border-b border-slate-200 h-[52px] md:h-[60px]">
//           <div className="flex items-center gap-3">
//             <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-3 shadow-lg flex items-center justify-center hover:scale-105 transition-transform duration-200">
//               <FaRegCommentDots className="w-5 h-5 text-white" />
//             </div>

//             <div className="leading-tight">
//               <h1 className="text-sm md:text-base font-semibold text-gray-800">Intern Chat</h1>
//               <p className="text-[11px] text-gray-500">Team Messaging</p>
//             </div>
//           </div>

//           <div className="relative">
//             <button
//               onClick={() => setShowMenu(!showMenu)}
//               onMouseEnter={() => setShowMenu(true)}
//               onMouseLeave={() => setShowMenu(false)}
//               className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition"
//             >
//               <FiMoreVertical />
//             </button>

//             {showMenu && (
//               <div
//                 onMouseEnter={() => setShowMenu(true)}
//                 onMouseLeave={() => setShowMenu(false)}
//                 className="absolute right-0 mt-0 w-40 bg-white rounded-xl shadow-lg border z-50"
//               >
//                 <button
//                   onClick={handleLogout}
//                   className="w-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 text-red-600"
//                 >
//                   <FiLogOut /> Logout
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowProfile(true);
//                     setShowMenu(false);
//                   }}
//                   className="w-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100"
//                 >
//                   <BiUser /> Profile
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="px-4 py-3 bg-slate-100">
//           <div className="flex items-center gap-2 bg-slate-200 rounded-full px-4 py-2">
//             <FiSearch className="text-slate-500" />
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search chats..."
//               className="w-full bg-transparent text-sm outline-none"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         {filteredChats.length ? (
//           filteredChats.map((user) => (
//             <ChatItem
//               key={user.id}
//               user={user}
//               isActive={selectedUser?.id === user.id}
//               onClick={() => onSelectUser(user)}
//               currentUserId={currentUserId}
//             />
//           ))
//         ) : (
//           <p className="text-center text-xs text-gray-500 mt-4">No chats found</p>
//         )}
//       </div>
//     </div>
//   );
// }

// function ChatItem({ user, isActive, onClick, currentUserId }) {
//   const { full_name, email, lastMessage, lastMessageTime, unreadCount, lastMessageSenderId, lastMessageSeen } = user;
//   const isLastMsgMine = lastMessageSenderId === currentUserId;

//   return (
//     <div
//       onClick={onClick}
//       className={`px-4 py-3 cursor-pointer transition ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-slate-100"
//         }`}
//     >
//       <div className="flex gap-3">
//         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
//           {(full_name || email || "U")[0].toUpperCase()}
//         </div>

//         <div className="flex-1 min-w-0">
//           <div className="flex justify-between items-center">
//             <p className="font-semibold text-gray-800 text-sm truncate">{full_name || email}</p>

//             {lastMessageTime && (
//               <span className="text-xs text-gray-400">
//                 {new Date(lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//               </span>
//             )}
//           </div>

//           <div className="flex justify-between items-center mt-1">
//             <div className="flex items-center gap-1 min-w-0">
//               {isLastMsgMine && <BsCheck2All className={`text-sm ${lastMessageSeen ? "text-blue-500" : "text-gray-400"}`} />}
//               <p className="text-sm text-gray-500 truncate">{lastMessage || "No messages yet"}</p>
//             </div>

//             {unreadCount > 0 && (
//               <span className="bg-blue-600 text-white text-xs min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-2">
//                 {unreadCount}
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import { FiLogOut, FiMoreVertical, FiSearch } from "react-icons/fi";
import { BsCheck2All } from "react-icons/bs";
import { supabase } from "../../config/supabase";
import { BiUser } from "react-icons/bi";
import { FaRegCommentDots } from "react-icons/fa";
import { useTheme } from "../../utils/useTheme";

// Note: I changed the prop name from 'users' to 'contacts' to match your Chat.jsx
export default function Sidebar({ contacts = [], selectedContact, setSelectedContact, currentUserId, setShowProfile }) {
  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Safe filtering: (contacts || []) ensures it never tries to filter 'undefined'
  const filteredChats = (contacts || []).filter((user) =>
    (user.full_name || user.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) { }
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  // Theme Variables
  const sidebarBg = isDark ? "#111827" : "#FFFFFF";
  const headerBg = isDark ? "#0B0F19" : "#f0f2f5";
  const borderColor = isDark ? "#1F2937" : "#e2e8f0";
  const textPrimary = isDark ? "#E5E7EB" : "#1f2937";
  const inputBg = isDark ? "#1F2937" : "#e2e8f0";

  return (
    <div
      className={`h-full flex flex-col flex-shrink-0 transition-colors duration-300 md:w-[340px] xl:w-[360px] ${
        selectedContact ? "hidden md:flex" : "w-full"
      }`}
      style={{ 
        background: sidebarBg, 
        borderRight: `1px solid ${borderColor}` 
      }}
    >
      {/* Header Section */}
      <div className="sticky top-0 z-20" style={{ background: headerBg }}>
        <div 
          className="relative px-4 py-3 flex items-center justify-between border-b h-[60px]"
          style={{ borderColor: borderColor }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-2.5 shadow-lg shadow-indigo-500/20">
              <FaRegCommentDots className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold" style={{ color: textPrimary }}>Intern Chat</h1>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>Support Team</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? "#1F2937" : "#e2e8f0"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <FiMoreVertical size={20} />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl border z-50 overflow-hidden animate-in fade-in zoom-in duration-200"
                style={{ 
                  background: isDark ? "#1F2937" : "#FFFFFF", 
                  borderColor: borderColor 
                }}
              >
                <button
                  onClick={() => { setShowProfile(true); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-sm flex items-center gap-3 transition-colors hover:bg-indigo-500/10"
                  style={{ color: textPrimary }}
                >
                  <BiUser size={18} /> Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-sm flex items-center gap-3 hover:bg-red-500/10 text-red-500 border-t"
                  style={{ borderColor: borderColor }}
                >
                  <FiLogOut size={18} /> Logout Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
          <div 
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50"
            style={{ background: inputBg }}
          >
            <FiSearch style={{ color: isDark ? "#6B7280" : "#94A3B8" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: textPrimary }}
            />
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.length > 0 ? (
          filteredChats.map((user) => (
            <ChatItem
              key={user.id}
              user={user}
              isActive={selectedContact?.id === user.id}
              onClick={() => setSelectedContact(user)}
              currentUserId={currentUserId}
              isDark={isDark}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center mt-10 px-6 text-center">
            <p className="text-sm font-medium" style={{ color: isDark ? "#4B5563" : "#94A3B8" }}>
              No active conversations found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatItem({ user, isActive, onClick, currentUserId, isDark }) {
  const { full_name, name, email, lastMessage, lastMessageTime, unreadCount, lastMessageSenderId, lastMessageSeen } = user;
  const displayName = full_name || name || email || "Unknown User";
  const isLastMsgMine = lastMessageSenderId === currentUserId;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-4 cursor-pointer transition-all duration-200 border-l-4 ${
        isActive 
          ? "bg-indigo-500/10 border-indigo-500" 
          : "border-transparent hover:bg-indigo-500/5"
      }`}
    >
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          {displayName[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="font-bold text-sm truncate" style={{ color: isDark ? "#E5E7EB" : "#1f2937" }}>
              {displayName}
            </p>
            {lastMessageTime && (
              <span className="text-[10px] font-medium" style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>
                {new Date(lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 min-w-0">
              {isLastMsgMine && (
                <BsCheck2All className={`text-sm ${lastMessageSeen ? "text-blue-500" : "text-gray-500"}`} />
              )}
              <p className="text-xs truncate font-medium" style={{ color: isDark ? "#9CA3AF" : "#64748B" }}>
                {lastMessage || "Start a conversation"}
              </p>
            </div>

            {unreadCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1.5 animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}