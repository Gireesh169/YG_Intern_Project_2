import { useEffect, useRef, useState } from "react";
import { supabase } from "../../config/supabase";
import { FaPaperclip, FaPaperPlane, FaTimes, FaEdit, FaFilePdf } from "react-icons/fa";

export default function MessageInput({
  currentUserId,
  selectedUser,
  editingMessage,
  setEditingMessage,
  onSendMessage,
  isDark = false,
}) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message || "");
      setFile(
        editingMessage.file_name
          ? { name: editingMessage.file_name, url: editingMessage.file_url }
          : null
      );
    }
  }, [editingMessage]);

  const onCancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if ((!message.trim() && !file)) return;

    // Chat.jsx integration path (frontend-only support)
    if (typeof onSendMessage === "function") {
      onSendMessage(message.trim(), file?.url || null, file?.name || null);
      setMessage("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!selectedUser) return;

    const { data: { session } = {} } = await supabase.auth.getSession();
    if (!session) return;

    const token = session.access_token;

    let fileUrl = file?.url || null;
    let fileName = file?.name || null;

    if (file && file instanceof File) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-chat-file`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
        );
        if (!res.ok) throw new Error("File upload failed");
        const data = await res.json();
        fileUrl = data.file_url;
        fileName = data.file_name;
      } catch {
        fileUrl = null;
        fileName = null;
      }
    }

    if (!message.trim() && !fileUrl) return;

    if (editingMessage) {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message_id: editingMessage.id,
          message: message.trim() || null,
          file_name: fileName,
          file_url: fileUrl,
        }),
      });
      onCancelEdit();
      return;
    }

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        receiver_id: selectedUser.id,
        message: message.trim() || null,
        file_name: fileName,
        file_url: fileUrl,
      }),
    });

    setMessage("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-2 sm:px-3 pb-2 sm:pb-3">
      {editingMessage && editingMessage.message && (
        <div className="mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 text-sm shadow-sm transition-shadow">
          <span className="flex-1 flex items-center gap-2 text-yellow-800 break-words">
            <FaEdit className="text-yellow-600 flex-shrink-0" />
            <span className="font-medium">{editingMessage.message}</span>
          </span>
          <button
            onClick={onCancelEdit}
            className="mt-1 sm:mt-0 sm:ml-3 p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors flex items-center gap-1"
            aria-label="Cancel edit"
          >
            <FaTimes />
          </button>
        </div>
      )}


      {file && (
        <div
          className="mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden border"
          style={{
            background: isDark ? "#111827" : "#FFFFFF",
            borderColor: isDark ? "#334155" : "#D1D5DB",
          }}
        >
          <span className="flex items-center gap-2 min-w-0">
            <FaFilePdf className="text-gray-500 flex-shrink-0" />
            <span className={`font-medium truncate max-w-[200px] ${isDark ? "text-gray-200" : "text-gray-700"}`}>
              {file.name}
            </span>
            {file.size && (
              <span className="text-gray-400 text-xs flex-shrink-0">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
          </span>
          <button
            onClick={() => setFile(null)}
            className="ml-3 p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
            aria-label="Remove file"
          >
            <FaTimes />
          </button>
        </div>
      )}



      <div
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 shadow-sm border"
        style={{
          background: isDark ? "#111827" : "#FFFFFF",
          borderColor: isDark ? "#334155" : "#E2E8F0",
        }}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        <IconButton isDark={isDark} onClick={() => fileInputRef.current?.click()}>
          <FaPaperclip />
        </IconButton>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
          className="flex-1 rounded-full px-3 py-1.5 text-xs outline-none border"
          style={{
            background: isDark ? "#0F172A" : "#F8FAFC",
            borderColor: isDark ? "#334155" : "#E2E8F0",
            color: isDark ? "#E5E7EB" : "#0F172A",
          }}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={handleSend}
          className="w-8 h-8 bg-blue-600 rounded-lg text-white flex items-center justify-center"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}

function IconButton({ children, onClick, isDark = false }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-full"
      style={{ color: isDark ? "#9CA3AF" : "#94A3B8" }}
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
