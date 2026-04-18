// /**
//  * chatService.js
//  *
//  * Bridges the SmaranAI users table (is_admin boolean, Google OAuth)
//  * with the chat system that expects profiles table (role: admin/intern).
//  *
//  * Strategy:
//  *  - "Admins" in chat  = users where is_admin = true
//  *  - "Interns" in chat = users where is_admin = false (students/teachers treated as interns)
//  *  - We read/write to the `messages` table directly using the existing supabase client
//  *  - No profiles table required — we use the users table instead
//  */

// import { supabase } from "../config/supabase";

// const BASE = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

// // ── Helper: get current session token ──────────────────────────────────────
// async function getToken() {
//   const { data: { session } } = await supabase.auth.getSession();
//   return session?.access_token ?? null;
// }

// // ── Helper: call an edge function with auth ─────────────────────────────────
// async function callEdge(path, body = null, method = "POST") {
//   const token = await getToken();
//   const opts = {
//     method,
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//   };
//   if (body && method !== "GET") opts.body = JSON.stringify(body);
//   const res = await fetch(`${BASE}/${path}`, opts);
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.error || `Edge function ${path} failed (${res.status})`);
//   }
//   return res.json();
// }

// // ── Fetch all admins (is_admin = true) from users table ────────────────────
// // Returns array shaped like: { id, name, email, picture, lastMessage, lastMessageTime, unreadCount }
// export async function loadAdminsFromUsers(currentUserId) {
//   try {
//     // 1. Load admin users
//     const { data: admins, error } = await supabase
//       .from("users")
//       .select("id, name, email, picture, is_admin")
//       .eq("is_admin", true);

//     if (error) throw error;
//     if (!admins?.length) return [];

//     // 2. Load recent messages involving current user
//     const { data: msgs } = await supabase
//       .from("messages")
//       .select("sender_id, receiver_id, message, created_at, is_seen, is_deleted, file_url")
//       .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
//       .eq("is_deleted", false)
//       .order("created_at", { ascending: false })
//       .limit(200);

//     // 3. Build chat metadata map per admin
//     const chatMap = {};
//     if (msgs) {
//       for (const m of msgs) {
//         const adminId =
//           m.sender_id === currentUserId ? m.receiver_id : m.sender_id;

//         if (!chatMap[adminId]) {
//           chatMap[adminId] = {
//             lastMessage: m.message || (m.file_url ? "📎 Attachment" : ""),
//             lastMessageTime: m.created_at,
//             lastMessageSenderId: m.sender_id,
//             lastMessageSeen: m.is_seen,
//             unreadCount: 0,
//           };
//         }

//         // Count unread messages FROM this admin TO current user
//         if (
//           m.receiver_id === currentUserId &&
//           m.sender_id === adminId &&
//           !m.is_seen
//         ) {
//           chatMap[adminId].unreadCount = (chatMap[adminId].unreadCount || 0) + 1;
//         }
//       }
//     }

//     // 4. Enrich admin list with chat metadata
//     const enriched = admins.map((admin) => ({
//       ...admin,
//       full_name: admin.name, // map name → full_name for chat components
//       lastMessage: chatMap[admin.id]?.lastMessage || "Start a conversation",
//       lastMessageTime: chatMap[admin.id]?.lastMessageTime || null,
//       lastMessageSenderId: chatMap[admin.id]?.lastMessageSenderId || null,
//       lastMessageSeen: chatMap[admin.id]?.lastMessageSeen ?? true,
//       unreadCount: chatMap[admin.id]?.unreadCount || 0,
//     }));

//     // Sort by most recent message
//     enriched.sort((a, b) => {
//       if (!a.lastMessageTime) return 1;
//       if (!b.lastMessageTime) return -1;
//       return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
//     });

//     return enriched;
//   } catch (err) {
//     console.error("[chatService] loadAdminsFromUsers:", err);
//     return [];
//   }
// }

// // ── Fetch all non-admin users (interns) who have chatted with admin ─────────
// export async function loadInternsFromUsers(currentUserId) {
//   try {
//     // 1. Get all messages involving current user
//     const { data: msgs, error } = await supabase
//       .from("messages")
//       .select("sender_id, receiver_id, message, created_at, is_seen, file_url")
//       .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
//       .order("created_at", { ascending: false })
//       .limit(500);

//     if (error) throw error;
//     if (!msgs?.length) return [];

//     // 2. Collect unique user IDs that have chatted with admin
//     const chatMap = {};
//     for (const m of msgs) {
//       const userId =
//         m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
//       if (!chatMap[userId]) {
//         chatMap[userId] = {
//           lastMessage: m.message || (m.file_url ? "📎 Attachment" : ""),
//           lastMessageTime: m.created_at,
//           lastMessageSenderId: m.sender_id,
//           lastMessageSeen: m.is_seen,
//           unreadCount: 0,
//         };
//       }
//       if (m.receiver_id === currentUserId && m.sender_id === userId && !m.is_seen) {
//         chatMap[userId].unreadCount = (chatMap[userId].unreadCount || 0) + 1;
//       }
//     }

//     const userIds = Object.keys(chatMap);
//     if (!userIds.length) return [];

//     // 3. Fetch user details from users table
//     const { data: users } = await supabase
//       .from("users")
//       .select("id, name, email, picture, is_admin")
//       .in("id", userIds)
//       .eq("is_admin", false); // only non-admin users

//     if (!users?.length) return [];

//     // 4. Enrich with chat metadata
//     const enriched = users.map((u) => ({
//       ...u,
//       full_name: u.name,
//       ...(chatMap[u.id] ?? {
//         lastMessage: "No messages yet",
//         lastMessageTime: null,
//         lastMessageSenderId: null,
//         lastMessageSeen: true,
//         unreadCount: 0,
//       }),
//     }));

//     enriched.sort((a, b) => {
//       const aT = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
//       const bT = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
//       return bT - aT;
//     });

//     return enriched;
//   } catch (err) {
//     console.error("[chatService] loadInternsFromUsers:", err);
//     return [];
//   }
// }

// // ── Fetch messages between two users ────────────────────────────────────────
// export async function fetchMessagesBetween(userAId, userBId) {
//   try {
//     const { data, error } = await supabase
//       .from("messages")
//       .select("*")
//       .or(
//         `and(sender_id.eq.${userAId},receiver_id.eq.${userBId}),` +
//         `and(sender_id.eq.${userBId},receiver_id.eq.${userAId})`
//       )
//       .eq("is_deleted", false)
//       .order("created_at", { ascending: true });

//     if (error) throw error;
//     return data || [];
//   } catch (err) {
//     console.error("[chatService] fetchMessagesBetween:", err);
//     return [];
//   }
// }

// // ── Send a message ───────────────────────────────────────────────────────────
// export async function sendMessage({ senderId, receiverId, message, fileUrl = null, fileName = null }) {
//   try {
//     const token = await getToken();
//     if (!token) throw new Error("Not authenticated");

//     const res = await fetch(`${BASE}/send-message`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         receiver_id: receiverId,
//         message: message?.trim() || null,
//         file_url: fileUrl,
//         file_name: fileName,
//       }),
//     });

//     if (!res.ok) {
//       // Edge function may not exist — fall back to direct insert
//       const { data, error } = await supabase
//         .from("messages")
//         .insert([{ sender_id: senderId, receiver_id: receiverId, message: message?.trim() || null, file_url: fileUrl, file_name: fileName, is_seen: false }])
//         .select()
//         .single();
//       if (error) throw error;
//       return data;
//     }

//     const json = await res.json();
//     return json.message || json;
//   } catch (err) {
//     // Final fallback: direct insert
//     const { data, error } = await supabase
//       .from("messages")
//       .insert([{ sender_id: senderId, receiver_id: receiverId, message: message?.trim() || null, file_url: fileUrl, file_name: fileName, is_seen: false }])
//       .select()
//       .single();
//     if (error) throw error;
//     return data;
//   }
// }

// // ── Upload a file via edge function ─────────────────────────────────────────
// export async function uploadChatFile(file) {
//   const token = await getToken();
//   if (!token) throw new Error("Not authenticated");

//   const formData = new FormData();
//   formData.append("file", file);

//   const res = await fetch(`${BASE}/upload-chat-file`, {
//     method: "POST",
//     headers: { Authorization: `Bearer ${token}` },
//     body: formData,
//   });

//   if (!res.ok) throw new Error("File upload failed");
//   return res.json(); // { file_url, file_name }
// }

// // ── Soft delete (intern) ─────────────────────────────────────────────────────
// export async function softDeleteMessage(messageId) {
//   const token = await getToken();
//   if (!token) throw new Error("Not authenticated");

//   const res = await fetch(`${BASE}/delete-message-intern`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//     body: JSON.stringify({ message_id: messageId }),
//   });

//   if (!res.ok) {
//     // fallback: direct update
//     const { error } = await supabase.from("messages").update({ is_deleted: true }).eq("id", messageId);
//     if (error) throw error;
//   }
//   return true;
// }

// // ── Hard delete (admin) ──────────────────────────────────────────────────────
// export async function hardDeleteMessage(messageId) {
//   const token = await getToken();
//   if (!token) throw new Error("Not authenticated");

//   const res = await fetch(`${BASE}/delete-message-admin`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//     body: JSON.stringify({ message_id: messageId }),
//   });

//   if (!res.ok) {
//     const { error } = await supabase.from("messages").delete().eq("id", messageId);
//     if (error) throw error;
//   }
//   return true;
// }

// // ── Mark messages as seen ────────────────────────────────────────────────────
// export async function markMessagesAsSeen(senderId, receiverId) {
//   const { error } = await supabase
//     .from("messages")
//     .update({ is_seen: true, seen_at: new Date().toISOString() })
//     .eq("sender_id", senderId)
//     .eq("receiver_id", receiverId)
//     .eq("is_seen", false);

//   if (error) console.error("[chatService] markMessagesAsSeen:", error);
// }

// // ── Edit a message ───────────────────────────────────────────────────────────
// export async function editMessage({ messageId, message, fileUrl, fileName }) {
//   const token = await getToken();
//   if (!token) throw new Error("Not authenticated");

//   const res = await fetch(`${BASE}/update-message`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//     body: JSON.stringify({ message_id: messageId, message: message?.trim() || null, file_url: fileUrl, file_name: fileName }),
//   });

//   if (!res.ok) {
//     const { data, error } = await supabase
//       .from("messages")
//       .update({ message: message?.trim() || null, file_url: fileUrl, file_name: fileName, is_edited: true })
//       .eq("id", messageId)
//       .select()
//       .single();
//     if (error) throw error;
//     return data;
//   }

//   const json = await res.json();
//   return json.message || json;
// }