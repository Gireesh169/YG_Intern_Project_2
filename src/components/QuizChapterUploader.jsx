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

  // Handle file selection and parsing
  const handleFileChange = (e) => {
    const selectedFile = e?.target?.files?.[0];

    // Reset if no file
    if (!selectedFile) {
      setFile(null);
      setFileName("");
      setParsedQuestions(null);
      setMessage({ type: null, text: "" });
      return;
    }

    // Validate file type - SAFE CHECK without .toLowerCase()
    const nameExtension = selectedFile?.name?.slice?.(-5) || "";
    const isJsonFile =
      nameExtension?.toLowerCase?.() === ".json" ||
      selectedFile?.type === "application/json";

    if (!isJsonFile) {
      setMessage({
        type: "error",
        text: "❌ Please upload a valid JSON file (.json extension)",
      });
      setFile(null);
      setFileName("");
      setParsedQuestions(null);
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile?.name || "");
    setMessage({ type: null, text: "" });

    // Parse the file
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event?.target?.result || "";
        // Use explicit variable name `data` and extract questions as required
        const data = JSON.parse(fileContent);
        const questions = data?.questions;

        // Validate questions array exists and is an array
        if (!Array.isArray(questions)) {
          setMessage({
            type: "error",
            text: "❌ Invalid JSON format. Missing 'questions' array.",
          });
          setParsedQuestions(null);
          return;
        }

        // Validate questions array is not empty
        if (questions.length === 0) {
          setMessage({
            type: "error",
            text: "❌ Questions array is empty. Please add at least one question.",
          });
          setParsedQuestions(null);
          return;
        }

        // Success - store questions
        setParsedQuestions(questions);
        setMessage({
          type: "success",
          text: `✅ File parsed successfully! Found ${questions.length} question(s)`,
        });

        console.log(`📋 Parsed ${questions.length} questions from file`);
      } catch (error) {
        // JSON parsing failed
        const errorMsg = error?.message || "Unknown error";
        setMessage({
          type: "error",
          text: `❌ JSON parsing error: ${errorMsg}`,
        });
        setParsedQuestions(null);
        console.error("JSON Parse Error:", error);
      }
    };

    reader.onerror = () => {
      setMessage({
        type: "error",
        text: "❌ Error reading file. Please try again.",
      });
      setParsedQuestions(null);
    };

    // Start reading file as text
    reader.readAsText(selectedFile);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    // VALIDATION: Safe checks without .toLowerCase() on undefined
    const safeChapterName = chapterName?.trim?.() || "";
    const safeDifficulty = difficulty?.trim?.().toLowerCase?.() || "medium";

    // Check chapter name
    if (!safeChapterName) {
      setMessage({
        type: "error",
        text: "❌ Please enter a Chapter Name",
      });
      return;
    }

    // Check difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties?.includes?.(safeDifficulty)) {
      setMessage({
        type: "error",
        text: "❌ Please select a valid difficulty level",
      });
      return;
    }

    // Check parsed questions
    if (!parsedQuestions || parsedQuestions?.length === 0) {
      setMessage({
        type: "error",
        text: "❌ No questions loaded. Please upload and parse a JSON file first.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      // Get current user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase?.auth?.getSession?.();

      if (sessionError || !session?.access_token) {
        throw new Error(
          "❌ No authentication token found. Please log in first."
        );
      }

      const bearerToken = session?.access_token || "";

      // Prepare request body - API expects { subModuleId, questions }
      const requestBody = {
        subModuleId: safeChapterName,
        questions: parsedQuestions,
      };

      // Log request for debugging
      console.log("📤 Sending request to Edge Function:");
      console.log("Body:", requestBody);

      // Make API call to Supabase Edge Function
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

      // Handle response
      if (!response?.ok) {
        const errorData = await response?.json?.().catch?.(() => ({}));
        const errorMessage =
          errorData?.error ||
          errorData?.message ||
          `API Error (${response?.status})`;

        throw new Error(`❌ API Error: ${errorMessage}`);
      }

      const result = await response?.json?.() || {};

      // Success!
      setMessage({
        type: "success",
        text: `✅ Successfully created chapter "${safeChapterName}" with ${parsedQuestions?.length} question(s)!`,
      });

      console.log("📥 Response from Edge Function:", result);

      // Reset form
      setChapterName("");
      setDifficulty("medium");
      setFile(null);
      setFileName("");
      setParsedQuestions(null);
    } catch (error) {
      // Handle errors
      const errorMessage =
        error?.message ||
        "An unexpected error occurred during upload";

      setMessage({
        type: "error",
        text: errorMessage,
      });

      console.error("Upload Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic message styling
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
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📚 Create Chapter with Questions
        </h2>
        <p className="text-sm text-gray-600">
          Upload a JSON file to create a new quiz chapter
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chapter Name Input */}
        <div>
          <label
            htmlFor="chapterName"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Chapter Name *
          </label>
          <input
            id="chapterName"
            type="text"
            value={chapterName}
            onChange={(e) => setChapterName(e?.target?.value || "")}
            placeholder="e.g., Algebra Basics"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading}
          />
        </div>

        {/* Difficulty Selector */}
        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
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

        {/* File Upload */}
        <div>
          <label
            htmlFor="fileInput"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
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

        {/* Questions Preview */}
        {parsedQuestions && parsedQuestions?.length > 0 && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">
              ✓ Ready to upload: <span className="text-lg">{parsedQuestions?.length}</span> question(s)
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !parsedQuestions || !chapterName?.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin">⚙️</span>
              Creating Chapter...
            </>
          ) : (
            <>
              <span>🚀</span>
              Create Chapter with Questions
            </>
          )}
        </button>
      </form>

      {/* Message Display */}
      {message?.text && (
        <div className={getMessageStyle()}>
          {message?.text}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-700 font-semibold mb-2">
          📋 Expected JSON Format:
        </p>
        <pre className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-300 overflow-x-auto">
{`{
  "questions": [
    {
      "text": "Question?",
      "options": ["A", "B"],
      "correctAnswer": 0
    }
  ]
}`}
        </pre>
      </div>

      {/* Debug Info */}
      {process?.env?.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700">
          <p>
            <strong>Debug:</strong> Check browser console for request details
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizChapterUploader;
