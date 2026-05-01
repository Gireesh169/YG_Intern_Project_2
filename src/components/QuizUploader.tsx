import React, { useState } from "react";
import { supabase } from "../config/supabase";

const QuizChapterUploader = () => {
  const [chapterName, setChapterName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [parsedQuestions, setParsedQuestions] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e?.target?.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setFileName("");
      setParsedQuestions(null);
      setMessage({ type: null, text: "" });
      return;
    }

    const nameExtension = selectedFile?.name?.slice?.(-5) || "";
    const isJsonFile =
      nameExtension?.toLowerCase?.() === ".json" ||
      selectedFile?.type === "application/json";

    if (!isJsonFile) {
      setMessage({ type: "error", text: "❌ Please upload a valid JSON file (.json extension)" });
      setFile(null);
      setFileName("");
      setParsedQuestions(null);
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile?.name || "");
    setMessage({ type: null, text: "" });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event?.target?.result || "";
        const data = JSON.parse(fileContent);
        const questions = data?.questions;

        if (!Array.isArray(questions)) {
          setMessage({ type: "error", text: "❌ Invalid JSON format. Missing 'questions' array." });
          setParsedQuestions(null);
          return;
        }

        if (questions.length === 0) {
          setMessage({ type: "error", text: "❌ Questions array is empty." });
          setParsedQuestions(null);
          return;
        }

        setParsedQuestions(questions);
        setMessage({ type: "success", text: `✅ File parsed successfully! Found ${questions.length} question(s)` });
        console.log(`📋 Parsed ${questions.length} questions from file`);
        console.log("📋 Sample question keys:", Object.keys(questions[0]));
      } catch (error) {
        setMessage({ type: "error", text: `❌ JSON parsing error: ${error?.message || "Unknown error"}` });
        setParsedQuestions(null);
      }
    };

    reader.onerror = () => {
      setMessage({ type: "error", text: "❌ Error reading file. Please try again." });
      setParsedQuestions(null);
    };

    reader.readAsText(selectedFile);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    const safeChapterName = chapterName?.trim?.() || "";
    const safeDifficulty = difficulty?.trim?.().toLowerCase?.() || "medium";

    if (!safeChapterName) {
      setMessage({ type: "error", text: "❌ Please enter a Chapter Name" });
      return;
    }

    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(safeDifficulty)) {
      setMessage({ type: "error", text: "❌ Please select a valid difficulty level" });
      return;
    }

    if (!parsedQuestions || parsedQuestions.length === 0) {
      setMessage({ type: "error", text: "❌ No questions loaded. Please upload a JSON file first." });
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      const { data: { session }, error: sessionError } = await supabase?.auth?.getSession?.();

      if (sessionError || !session?.access_token) {
        throw new Error("❌ No authentication token found. Please log in first.");
      }

      const bearerToken = session.access_token;

      // ✅ FIX 1: Send ALL required fields the edge function needs
      // ✅ FIX 2: Use `chapterName` (not `subModuleId`) to match your edge function
      const requestBody = {
        chapterName: safeChapterName,   // was wrongly named subModuleId before
        difficulty: safeDifficulty,     // was missing before
        questions: parsedQuestions,     // questions pass through as-is from JSON
      };

      console.log("📤 Sending to Edge Function:", {
        endpoint: "create_questions_from_file",
        chapterName: safeChapterName,
        difficulty: safeDifficulty,
        questionCount: parsedQuestions.length,
        sampleQuestionKeys: Object.keys(parsedQuestions[0] || {}),
      });

      const response = await fetch(
        `${import.meta?.env?.VITE_SUPABASE_URL}/functions/v1/create_questions_from_file`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      // ✅ FIX 3: Always parse response body to catch edge function errors
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // ✅ FIX 4: Check multiple error fields edge functions return
        const errorMessage =
          result?.error ||
          result?.message ||
          result?.details ||
          `API Error (${response.status})`;
        throw new Error(`❌ API Error: ${errorMessage}`);
      }

      // ✅ FIX 5: Also check if edge function returned ok:false even with 200 status
      if (result?.success === false || result?.error) {
        throw new Error(`❌ Edge Function Error: ${result?.error || result?.message || "Unknown error"}`);
      }

      console.log("📥 Edge Function response:", result);

      setMessage({
        type: "success",
        text: `✅ Successfully created chapter "${safeChapterName}" with ${parsedQuestions.length} question(s)!`,
      });

      // Reset form
      setChapterName("");
      setDifficulty("medium");
      setFile(null);
      setFileName("");
      setParsedQuestions(null);

    } catch (error) {
      const errorMessage = error?.message || "An unexpected error occurred during upload";
      setMessage({ type: "error", text: errorMessage });
      console.error("❌ Upload Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMessageStyle = () => {
    const baseStyle = "mt-4 p-4 rounded-lg font-medium text-sm";
    const typeStyles = {
      success: "bg-green-100 text-green-800 border-2 border-green-300",
      error: "bg-red-100 text-red-800 border-2 border-red-300",
      warning: "bg-yellow-100 text-yellow-800 border-2 border-yellow-300",
    };
    return `${baseStyle} ${typeStyles?.[message?.type] || ""}`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-xl border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📚 Create Chapter with Questions</h2>
        <p className="text-sm text-gray-600">Upload a JSON file to create a new quiz chapter</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="chapterName" className="block text-sm font-semibold text-gray-700 mb-2">
            Chapter Name *
          </label>
          <input
            id="chapterName"
            type="text"
            value={chapterName}
            onChange={(e) => setChapterName(e?.target?.value || "")}
            placeholder="e.g., Exercise 1.1"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="difficulty" className="block text-sm font-semibold text-gray-700 mb-2">
            Difficulty Level *
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e?.target?.value || "medium")}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
        </div>

        <div>
          <label htmlFor="fileInput" className="block text-sm font-semibold text-gray-700 mb-2">
            JSON File *
          </label>
          <input
            id="fileInput"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          />
          {fileName && (
            <p className="mt-2 text-sm text-gray-600">
              📄 Selected: <span className="font-semibold">{fileName}</span>
            </p>
          )}
        </div>

        {parsedQuestions && parsedQuestions.length > 0 && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">
              ✓ Ready to upload: <span className="text-lg">{parsedQuestions.length}</span> question(s)
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !parsedQuestions || !chapterName?.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <><span className="inline-block animate-spin">⚙️</span> Creating Chapter...</>
          ) : (
            <><span>🚀</span> Create Chapter with Questions</>
          )}
        </button>
      </form>

      {message?.text && <div className={getMessageStyle()}>{message.text}</div>}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-700 font-semibold mb-2">📋 Expected JSON Format:</p>
        <pre className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-300 overflow-x-auto">
{`{
  "questions": [
    {
      "id": "Q1",
      "questionType": "mcq",
      "difficulty": "easy",
      "questionText": "...",
      "options": [
        { "optionText": "...", "isCorrect": true }
      ]
    }
  ]
}`}
        </pre>
      </div>
    </div>
  );
};

export default QuizChapterUploader;