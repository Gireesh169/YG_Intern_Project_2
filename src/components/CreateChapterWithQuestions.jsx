import React, { useState } from "react";
import { supabase } from "../config/supabase";

// CreateChapterWithQuestions
// - Safe handling of undefined/null values
// - Validates inputs and JSON file
// - Sends { subModuleId, questions } to Edge Function

export default function CreateChapterWithQuestions() {
  const [chapterName, setChapterName] = useState("");
  const [difficulty, setDifficulty] = useState(""); // "easy" | "medium" | "hard"
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });

  // Safe helper to normalize strings without crashing
  const safeLower = (v) => v?.toLowerCase?.() || "";

  // Handle difficulty button clicks
  const chooseDifficulty = (d) => {
    setDifficulty(d || "");
    setMessage({ type: null, text: "" });
  };

  // Handle file selection (store File object)
  const handleFileChange = (e) => {
    const f = e?.target?.files?.[0] || null;
    setFile(f);
    setMessage({ type: null, text: "" });
  };

  // Validate and submit
  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    // Basic validations
    const safeChapter = chapterName?.trim?.() || "";
    const safeDifficulty = safeLower(difficulty) || ""; // normalized

    if (!safeChapter) {
      setMessage({ type: "error", text: "Please enter a Chapter Name." });
      return;
    }

    if (!["easy", "medium", "hard"].includes(safeDifficulty)) {
      setMessage({ type: "error", text: "Please select a difficulty (Easy/Medium/Hard)." });
      return;
    }

    if (!file) {
      setMessage({ type: "error", text: "Please upload a JSON file containing questions." });
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      // Read file safely using file.text()
      const text = await file.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Invalid JSON: " + (err?.message || "parse error"));
      }

      // Extract questions as requested
      const questions = data?.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("JSON must include a non-empty 'questions' array.");
      }

      // Get session token safely
      const sessionResp = await supabase?.auth?.getSession?.();
      const session = sessionResp?.data?.session;
      const token = session?.access_token;

      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      // Prepare payload
      const payload = {
        subModuleId: safeChapter,
        questions: questions,
      };

      // Debug log
      console.log("Submitting payload to /functions/v1/create_questions_from_file:", payload);

      // API call
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_questions_from_file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp?.ok) {
        const errBody = await resp?.json?.().catch(() => ({}));
        const errMsg = errBody?.error || errBody?.message || `API Error (${resp?.status})`;
        throw new Error(errMsg);
      }

      const result = await resp.json().catch(() => null);
      console.log("Edge function response:", result);

      setMessage({ type: "success", text: `Chapter created with ${questions.length} question(s).` });

      // reset form state
      setChapterName("");
      setDifficulty("");
      setFile(null);
    } catch (err) {
      console.error("CreateChapterWithQuestions error:", err);
      setMessage({ type: "error", text: err?.message || "Unexpected error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Create Chapter with Questions</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Chapter Name</label>
          <input
            value={chapterName}
            onChange={(e) => setChapterName(e?.target?.value || "")}
            type="text"
            placeholder="e.g., Algebra Basics"
            className="w-full border px-3 py-2 rounded"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Difficulty</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => chooseDifficulty("easy")}
              className={`px-3 py-2 rounded ${safeLower(difficulty) === "easy" ? "bg-green-500 text-white" : "bg-gray-100"}`}
              disabled={loading}
            >
              Easy
            </button>
            <button
              type="button"
              onClick={() => chooseDifficulty("medium")}
              className={`px-3 py-2 rounded ${safeLower(difficulty) === "medium" ? "bg-yellow-500 text-white" : "bg-gray-100"}`}
              disabled={loading}
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => chooseDifficulty("hard")}
              className={`px-3 py-2 rounded ${safeLower(difficulty) === "hard" ? "bg-red-600 text-white" : "bg-gray-100"}`}
              disabled={loading}
            >
              Hard
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">JSON File</label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Creating..." : "Create Chapter with Questions"}
          </button>
        </div>
      </form>

      {message?.text && (
        <div className={`mt-4 p-3 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <div>Expected JSON shape:</div>
        <pre className="bg-gray-50 p-2 mt-2">{`{ "questions": [ ... ] }`}</pre>
      </div>
    </div>
  );
}
