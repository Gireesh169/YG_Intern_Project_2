// import { useEffect, useRef, useState } from "react";
// import { supabase } from "../config/supabase";

// import Sidebar from "../components/chat/Sidebar";
// import ChatHeader from "../components/chat/ChatHeader";
// import MessageInput from "../components/chat/MessageInput";
// import Chatpanel from "../components/chat/Chatpanel";
// import ChatMessageList from "../components/chat/ChatMessageList";
// import ProfileModal from "../components/chat/Profile";
// import FilesPanel from "../components/chat/FilesPanel";

// export default function InternChat() {
//   const [admins, setAdmins] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [editingMessage, setEditingMessage] = useState(null);
//   const [activeTab, setActiveTab] = useState("conversation");
//   const [showProfile, setShowProfile] = useState(false);
//   const [token, setToken] = useState(null);


//   const messagesEndRef = useRef(null);
//   const channelRef = useRef(null);
//   const mountedRef = useRef(true);





//   useEffect(() => {
//     mountedRef.current = true;

//     supabase.auth.getUser().then(async ({ data }) => {
//       if (mountedRef.current) {
//         setCurrentUserId(data?.user?.id ?? null);
//         const {
//           data: { session },
//         } = await supabase.auth.getSession();

//         setToken(session?.access_token ?? null);
//       }
//     });

//     return () => {
//       mountedRef.current = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (!currentUserId || !token) return;

//     loadAdmins();
//     subscribeToRealtime();

//     return () => {
//       if (channelRef.current) {
//         supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }
//     };
//   }, [currentUserId, token]);



//   const loadAdmins = async () => {
//     if (!token) return;
//     const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loadAdmins`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     const { admins } = await response.json();
//     if (mountedRef.current) {
//       setAdmins(admins || []);
//     }
//   };


//   const subscribeToRealtime = () => {
//     if (channelRef.current) return;

//     channelRef.current = supabase
//       .channel(`messages-${currentUserId}`)

//       .on(
//         "postgres_changes",
//         { event: "INSERT", schema: "public", table: "messages" },
//         ({ new: msg }) => {
//           if (msg.is_deleted) return;

//           const isIncoming = msg.receiver_id === currentUserId;
//           const isOutgoing = msg.sender_id === currentUserId;

//           if (!isIncoming && !isOutgoing) return;

//           if (
//             (selectedUser && (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)) ||
//             msg.sender_id === currentUserId || msg.receiver_id === currentUserId
//           ) {
//             setMessages((prev) => [...prev, msg]);
//           }



//           setAdmins((prev) =>
//             prev.map((a) => {
//               if (a.id === msg.sender_id || a.id === msg.receiver_id) {
//                 return {
//                   ...a,
//                   lastMessage: msg.message || "📎 Attachment",
//                   lastMessageTime: msg.created_at,
//                   lastMessageSenderId: msg.sender_id,
//                   unreadCount:
//                     isIncoming
//                       ? (a.unreadCount || 0) + 1
//                       : a.unreadCount,
//                 };
//               }
//               return a;
//             })
//           );
//         }
//       )


//       .on(
//         "postgres_changes",
//         { event: "UPDATE", schema: "public", table: "messages" },
//         ({ new: msg }) => {
//           setMessages((prev) =>
//             prev.map((m) => (m.id === msg.id ? msg : m))
//           );

//           if (msg.is_seen) {
//             setAdmins((prev) =>
//               prev.map((a) =>
//                 a.id === msg.sender_id
//                   ? { ...a, unreadCount: 0, lastMessageSeen: true }
//                   : a
//               )
//             );
//           }
//         }
//       )


//       .on(
//         "postgres_changes",
//         { event: "DELETE", schema: "public", table: "messages" },
//         ({ old }) => {
//           setMessages((prev) => prev.filter((m) => m.id !== old.id));
//         }
//       )
//       .subscribe();
//   };


//   useEffect(() => {
//     if (!selectedUser || !currentUserId) return;

//     setMessages([]);
//     fetchMessages(selectedUser.id);

//     setAdmins((prev) =>
//       prev.map((a) =>
//         a.id === selectedUser.id
//           ? { ...a, unreadCount: 0 }
//           : a
//       )
//     );

//     markAsSeen(selectedUser.id);
//   }, [selectedUser, currentUserId]);


//   const fetchMessages = async (internId) => {
//     if (!token) return;

//     const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-messages`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ internId }),
//     });

//     const { messages } = await response.json();
//     if (mountedRef.current) setMessages(messages || []);
//   };

//   const markAsSeen = async (sender_id) => {
//     if (!token) return;

//     await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark-as-seen`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ sender_id }),
//     });
//   };


//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const handleDeleteMessage = async (id) => {
//     if (!token) return;

//     const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-message-intern`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ message_id: id }),
//     });

//     if (res.ok) {
//     }
//   };

//   return (
//     <div className="h-screen w-screen flex bg-[#f0f2f5] overflow-hidden">
//       <Sidebar
//         users={admins}
//         selectedUser={selectedUser}
//         onSelectUser={setSelectedUser}
//         currentUserId={currentUserId}
//         setShowProfile={setShowProfile}
//       />
//       {showProfile && (
//         <ProfileModal show={showProfile} onClose={() => setShowProfile(false)} />
//       )}

//       <div
//         className={`flex flex-col flex-1 bg-white
//     ${!selectedUser ? "hidden sm:flex" : "flex"}
//   `}   >
//         {selectedUser && (
//           <ChatHeader user={selectedUser} onSelectUser={setSelectedUser} activeTab={activeTab} setActiveTab={setActiveTab} />
//         )}

//         <div className="flex-1 overflow-y-auto px-4 py-4">
//           {!selectedUser ? (
//             <Chatpanel role="intern" />
//           ) : (
//             activeTab === "conversation" ? (<ChatMessageList
//               messages={messages}
//               currentUserId={currentUserId}
//               onDelete={handleDeleteMessage}
//               onEditSelect={setEditingMessage}
//             />) : (<FilesPanel
//               messages={messages} user={selectedUser}
//             />)
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {selectedUser && <MessageInput
//           currentUserId={currentUserId}
//           selectedUser={selectedUser}
//           editingMessage={editingMessage}
//           setEditingMessage={setEditingMessage}
//         />}
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase"; // Path to your main supabase config
import { useTheme } from "../utils/useTheme";
import { Send, Paperclip, Search, User, MessageSquare, ArrowLeft, X } from "lucide-react";
import toast from "react-hot-toast";

// Sub-components (Assuming they are in components/chat/)
import Sidebar from "../components/chat/Sidebar";
import ChatHeader from "../components/chat/ChatHeader";
import ChatMessageList from "../components/chat/ChatMessageList";
import MessageInput from "../components/chat/MessageInput";
import Chatpanel from "../components/chat/Chatpanel";

const Chat = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { signupData } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Current User Info from Redux
  const currentUserId = signupData?.id || signupData?.googleId;
  const currentUserName = signupData?.name || "User";

  // 1. Listen for Real-time Messages
  useEffect(() => {
    if (!currentUserId || !selectedAdmin) return;

    const channel = supabase
      .channel(`chat:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.new.sender_id === selectedAdmin.id) {
            setMessages((prev) => [...prev, payload.new]);
            markAsRead(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAdmin, currentUserId]);

  // 2. Fetch History when Admin is selected
  useEffect(() => {
    if (selectedAdmin) {
      fetchMessages();
    }
  }, [selectedAdmin]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedAdmin.id}),and(sender_id.eq.${selectedAdmin.id},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Could not load chat history");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    await supabase
      .from("messages")
      .update({ is_seen: true })
      .eq("id", messageId);
  };

  const handleSendMessage = async (text, fileUrl = null, fileName = null) => {
    if (!text.trim() && !fileUrl) return;

    const newMessage = {
      sender_id: currentUserId,
      receiver_id: selectedAdmin.id,
      message: text,
      file_url: fileUrl,
      file_name: fileName,
      is_seen: false,
    };

    try {
      const { data, error } = await supabase.from("messages").insert([newMessage]).select();
      if (error) throw error;
      setMessages((prev) => [...prev, data[0]]);
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleCloseChat = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/quizzes");
    }
  };

  return (
    <div 
      className={`flex overflow-hidden transition-colors duration-300 ${embedded ? "h-full relative rounded-2xl" : "h-screen"}`}
      style={{ 
        backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
        backgroundSize: "28px 28px"
      }}
    >
      {/* Background Glow Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none opacity-50"
        style={{ background: isDark ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)" : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)" }} />

      <div className={`flex flex-1 relative z-10 ${embedded ? "h-full m-0 gap-0" : "mt-24 mb-4 mx-4 gap-4 h-[calc(100vh-8rem)]"}`}>
        {/* SIDEBAR - List of Admins/Support */}
        <div 
          className={`${sidebarOpen ? (embedded ? "w-72" : "w-80") : 'w-0'} transition-all duration-300 overflow-hidden md:relative absolute inset-y-0 left-0 z-20`}
        >
          <Sidebar 
            contacts={[]}
            selectedContact={selectedAdmin} 
            setSelectedContact={setSelectedAdmin} 
            currentUserId={currentUserId}
            isDark={isDark}
          />
        </div>

        {/* MAIN CHAT AREA */}
        <div 
          className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${embedded ? "rounded-none border-l" : "rounded-2xl"}`}
          style={{ 
            background: isDark ? "#111827" : "#FFFFFF",
            border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
            boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.05)"
          }}
        >
          {!embedded && (
            <div className="flex justify-end p-2 border-b" style={{ borderColor: isDark ? "#1F2937" : "#E2E8F0" }}>
              <button
                onClick={handleCloseChat}
                className="p-2 rounded-xl border transition-all duration-200 hover:scale-105 hover:rotate-90"
                style={{
                  background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.95)",
                  borderColor: isDark ? "#334155" : "#E2E8F0",
                  color: isDark ? "#CBD5E1" : "#475569",
                  boxShadow: isDark
                    ? "0 6px 16px rgba(0,0,0,0.35), 0 0 12px rgba(99,102,241,0.2)"
                    : "0 4px 12px rgba(15,23,42,0.12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(239,68,68,0.22)" : "#EF4444";
                  e.currentTarget.style.borderColor = "#EF4444";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.95)";
                  e.currentTarget.style.borderColor = isDark ? "#334155" : "#E2E8F0";
                  e.currentTarget.style.color = isDark ? "#CBD5E1" : "#475569";
                }}
                aria-label="Close chat"
                title="Close chat"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {selectedAdmin ? (
            <>
              <ChatHeader 
                contact={selectedAdmin} 
                isDark={isDark} 
                onBack={() => setSidebarOpen(true)} 
              />
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <ChatMessageList 
                  messages={messages} 
                  currentUserId={currentUserId} 
                  isDark={isDark} 
                  loading={loading}
                />
              </div>

              <MessageInput 
                onSendMessage={handleSendMessage} 
                isDark={isDark} 
              />
            </>
          ) : (
            <Chatpanel isDark={isDark} userName={currentUserName} />
          )}
        </div>
      </div>

      {/* Global CSS for scrollbars */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDark ? "#1F2937" : "#E2E8F0"}; 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: ${isDark ? "#374151" : "#CBD5E1"}; 
        }
      `}</style>
    </div>
  );
};

export default Chat;