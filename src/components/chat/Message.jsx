import { useState } from "react";
import { FiChevronDown, FiEdit2, FiTrash2 } from "react-icons/fi";
import { FaRegFileAlt } from "react-icons/fa";

export default function Message({ msg, currentUserId, onDelete, onEdit, isDark = false }) {
  const {
    id,
    message: text,
    file_name: filename,
    file_url: fileUrl,
    file_size,
    is_deleted,
    created_at,
    sender_id,
    is_edited
  } = msg;

  const isSender = sender_id === currentUserId;
  const isText = Boolean(text && text.trim());
  const isFile = Boolean(fileUrl);

  const time = new Date(created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const size = file_size ? `${(file_size / 1024).toFixed(2)} KB` : null;

  const [hover, setHover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const FIVE_MINUTES = 5 * 60 * 1000;
  const canEdit =
    Date.now() - new Date(created_at).getTime() < FIVE_MINUTES;

  const handleView = () => {
    if (fileUrl && !is_deleted) window.open(fileUrl, "_blank");
  };

  const handleDownload = async () => {
    if (!fileUrl || is_deleted) return;
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename || "file";
    link.click();
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setShowMenu(false);
      }}
      className={`flex mb-3 ${isSender ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex flex-col ${isSender ? "items-end" : "items-start"
          } max-w-[340px] w-full`}
      >
        {isFile && isText && (
          <div
            className="relative rounded-xl p-3 shadow-sm w-full max-w-[240px] border"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              borderColor: isDark ? "#334155" : "#E2E8F0",
            }}
          >
            {hover && isSender && !is_deleted && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="absolute top-1 right-1 text-slate-600"
              >
                <FiChevronDown size={16} />
              </button>
            )}

            {!is_deleted ? (
              <>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FaRegFileAlt />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: isDark ? "#E5E7EB" : "#111827" }}>{filename}</p>
                    {size && (
                      <p className="text-xs text-slate-500">{size}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleView}
                    className="flex-1 bg-blue-600 text-white py-1.5 text-xs rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 border py-1.5 text-xs rounded"
                    style={{
                      borderColor: isDark ? "#334155" : "#E2E8F0",
                      color: isDark ? "#E5E7EB" : "#0F172A",
                    }}
                  >
                    Download
                  </button>
                </div>
              </>
            ) : (
              <div className="italic text-slate-400 text-sm">
                This file was deleted
              </div>
            )}

            <div
              className={`px-3 py-2 mt-2 rounded-xl text-sm ${isSender
                ? (isDark ? "bg-blue-500/20 text-blue-200" : "bg-blue-100 text-blue-900")
                : (isDark ? "bg-slate-700/40 text-slate-100" : "bg-slate-100 text-slate-800")
                }`}
            >
              {is_deleted ? (
                isSender ? (
                  <span className={`italic line-through ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    this message was deleted
                  </span>
                ) : (
                  <span className={`italic line-through ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {text}
                  </span>
                )
              ) : (
                <span className="break-words">{text}</span>
              )}

              <span className={`block text-[10px] text-right ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {is_edited ? "edited" : ""} {time}
              </span>
            </div>
          </div>
        )}

        {isFile && !isText && (
          <div
            className="relative rounded-xl p-3 shadow-sm w-full max-w-[240px] border"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              borderColor: isDark ? "#334155" : "#E2E8F0",
            }}
          >
            {hover && isSender && !is_deleted && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="absolute top-1 right-1 text-slate-600"
              >
                <FiChevronDown size={16} />
              </button>
            )}

            {is_deleted ? (
              <div className="italic text-slate-400 text-sm">
                This file was deleted
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FaRegFileAlt />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: isDark ? "#E5E7EB" : "#111827" }}>
                      {filename}
                    </p>
                    {size && (
                      <p className="text-xs text-slate-500">{size}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleView}
                    className="flex-1 bg-blue-600 text-white py-1.5 text-xs rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 border py-1.5 text-xs rounded"
                    style={{
                      borderColor: isDark ? "#334155" : "#E2E8F0",
                      color: isDark ? "#E5E7EB" : "#0F172A",
                    }}
                  >
                    Download
                  </button>
                </div>

                <div className="text-right mt-1">
                  <span className={`text-[10px] ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    {is_edited ? "edited" : ""} {time}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {isText && !isFile && (
          <div
            className={`relative px-3 py-2 rounded-xl text-sm shadow-sm ${isSender
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-800"
              }`}
          >
            <div className="flex items-end gap-2">
              {is_deleted ? (
                isSender ? (
                  <span className="italic line-through text-slate-400">
                    this message was deleted
                  </span>
                ) : (
                  <span className="italic line-through text-slate-400">
                    {text}
                  </span>
                )
              ) : (
                <span className="break-words">{text}</span>
              )}
              <span className="text-[10px] text-slate-300 whitespace-nowrap">
                {is_edited ? "edited" : ""} {time}
              </span>
            </div>

            {hover && isSender && !is_deleted && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="absolute top-1 right-1 text-white"
              >
                <FiChevronDown size={16} />
              </button>
            )}
          </div>
        )}

        {showMenu && isSender && !is_deleted && (
          <div className="relative">
            <div
              className="absolute right-0 bottom-full mt-2 w-36 border rounded-xl shadow-lg z-50"
              style={{
                background: isDark ? "#111827" : "#FFFFFF",
                borderColor: isDark ? "#334155" : "#E2E8F0",
              }}
            >
              {canEdit && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(msg);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 w-full text-sm ${isDark ? "text-slate-200 hover:bg-slate-700/50" : "hover:bg-slate-100"}`}
                >
                  <FiEdit2 size={14} />
                  Edit
                </button>
              )}

              <button
                onClick={() => onDelete?.(id)}
                className="flex items-center gap-2 px-3 py-2 w-full text-sm text-red-600 hover:bg-red-50"
              >
                <FiTrash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
