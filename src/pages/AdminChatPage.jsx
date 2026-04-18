import { useEffect, useRef, useState } from "react";
import { supabase } from "../config/supabase";

import Sidebar from "../components/chat/Sidebar";
import ChatHeader from "../components/chat/ChatHeader";
import MessageInput from "../components/chat/MessageInput";
import Chatpanel from "../components/chat/Chatpanel";
import ChatMessageList from "../components/chat/ChatMessageList";
import FilesPanel from "../components/chat/FilesPanel";
import ProfileModal from "../components/chat/Profile";

export default function AdminChat() {
  const [interns, setInterns] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("conversation");
  const [showProfile, setShowProfile] = useState(false);
  const [token, setToken] = useState(null);


  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const mountedRef = useRef(true);


  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (mountedRef.current) {
        setCurrentUserId(data?.user?.id ?? null);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setToken(session?.access_token ?? null);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId || !token) return;

    loadInterns();
    subscribeToRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId, token]);


  const loadInterns = async () => {
    if (!token) return;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loadInterns`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const { interns } = await response.json();
    if (mountedRef.current) {
      setInterns(interns || []);
    }
  };

  const fetchMessages = async (internId) => {
    if (!token) return;


    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ internId }),
    });

    const { messages } = await response.json();
    if (mountedRef.current) setMessages(messages || []);
  };

  const markAsSeen = async (sender_id) => {
    if (!token) return;


    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark-as-seen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sender_id }),
    });
    if (!res.ok) {
      const error = await res.text();
    } else {
      const data = await res.json();
    }

  };

  const handleDeleteMessage = async (id) => {
    if (!token) return;


    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-message-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message_id: id }),
    });

    if (res.ok) {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }

  };


  const subscribeToRealtime = () => {
    if (channelRef.current) return;

    channelRef.current = supabase
      .channel(`messages-${currentUserId}`)

      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        ({ new: msg }) => {
          if (msg.is_deleted) return;

          const isIncoming = msg.receiver_id === currentUserId;
          const isOutgoing = msg.sender_id === currentUserId;

          if (!isIncoming && !isOutgoing) return;



          if (
            (selectedUser && (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)) ||
            msg.sender_id === currentUserId || msg.receiver_id === currentUserId
          ) {
            setMessages((prev) => [...prev, msg]);
          }


          setInterns((prev) =>
            prev.map((i) => {
              if (
                i.id === msg.sender_id ||
                i.id === msg.receiver_id
              ) {
                return {
                  ...i,
                  lastMessage: msg.message || "📎 Attachment",
                  lastMessageTime: msg.created_at,
                  lastMessageSenderId: msg.sender_id,
                  lastMessageSeen: false,
                  unreadCount:
                    isIncoming
                      ? (i.unreadCount || 0) + 1
                      : i.unreadCount,
                };
              }
              return i;
            })
          );
        }
      )

      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        ({ new: msg }) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? msg : m))
          );

          if (msg.is_seen) {
            setInterns((prev) =>
              prev.map((i) =>
                i.id === msg.sender_id || i.id === msg.receiver_id
                  ? {
                    ...i,
                    unreadCount: 0,
                    lastMessageSeen: true,
                  }
                  : i
              )
            );
          }
        }
      )

      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        ({ old }) => {
          setMessages((prev) =>
            prev.filter((m) => m.id !== old.id)
          );
        }
      )

      .subscribe();
  };



  useEffect(() => {
    if (!selectedUser || !currentUserId) return;

    setMessages([]);
    fetchMessages(selectedUser.id);

    setInterns((prev) =>
      prev.map((i) =>
        i.id === selectedUser.id
          ? { ...i, unreadCount: 0 }
          : i
      )
    );

    markAsSeen(selectedUser.id);
  }, [selectedUser, currentUserId]);



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  return (
    <div className="h-screen w-screen flex bg-[#f0f2f5] overflow-hidden">
      <Sidebar
        users={interns}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        currentUserId={currentUserId}
        setShowProfile={setShowProfile}
      />

      {showProfile && (
        <ProfileModal
          show={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      <div
        className={`flex flex-col flex-1 bg-white
       ${!selectedUser ? "hidden sm:flex" : "flex"}
      `}   >
        {selectedUser && (
          <ChatHeader user={selectedUser} onSelectUser={setSelectedUser} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!selectedUser ? (
            <Chatpanel role="admin" />
          ) : (
            activeTab === "conversation" ? (<ChatMessageList
              messages={messages}
              currentUserId={currentUserId}
              onDelete={handleDeleteMessage}
              onEditSelect={setEditingMessage}
            />) :
              (<FilesPanel messages={messages} user={selectedUser}></FilesPanel>)
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedUser && <MessageInput
          currentUserId={currentUserId}
          selectedUser={selectedUser}
          editingMessage={editingMessage}
          setEditingMessage={setEditingMessage}
        />}
      </div>
    </div>
  );
}
