import React, { useState, ChangeEvent, FormEvent } from "react";
import { supabase } from "../config/supabase";

// Type definitions
interface Message {
  type: "success" | "error" | "warning" | null;
  text: string;
}

interface Question {
  text?: string;
  options?: string[];
  correctAnswer?: number;
  difficulty?: string;
  explanation?: string;
  [key: string]: unknown;
}

interface ApiRequestBody {
  chapterName: string;
  difficulty: string;
  questions: Question[];
}

const QuizChapterUploaderTS: React.FC = () => {
  const [chapterName, setChapterName] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: null, text: "" });
  const [parsedQuestions, setParsedQuestions] = useState<Question[] | null>(null);

  // Handle file selection and parsing
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e?.target?.files?.[0];

    // Reset if no file
    if (!selectedFile) {
      setFile(null);
      setFileName("");
      setParsedQuestions(null);
      setMessage({ type: null, text: "" });
      return;
    }

    // Validate file type - SAFE CHECK without .toLowerCase() on undefined
    const nameExtension: string = selectedFile?.name?.slice?.(-5) || "";
    const isJsonFile: boolean =
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

    reader.onload = (event: ProgressEvent<FileReader>): void => {
      try {
        const fileContent: string = (event?.target?.result as string) || "";
        const jsonData: { questions?: unknown } = JSON.parse(fileContent);

        // SAFE EXTRACTION: Using optional chaining to prevent undefined errors
        const questionsArray: unknown = jsonData?.questions;

        // Validate questions array exists and is an array
        if (!Array.isArray(questionsArray)) {
          setMessage({
            type: "error",
            text: "❌ Invalid JSON format. Missing 'questions' array.",
          });
          setParsedQuestions(null);
          return;
        }

        // Validate questions array is not empty
        if ((questionsArray as Question[])?.length === 0) {
          setMessage({
            type: "error",
            text: "❌ Questions array is empty. Please add at least one question.",
          });
          setParsedQuestions(null);
          return;
        }

        // Success - store questions
        const typedQuestions: Question[] = questionsArray as Question[];
        setParsedQuestions(typedQuestions);
        setMessage({
          type: "success",
          text: `✅ File parsed successfully! Found ${typedQuestions?.length} question(s)`,
        });

        console.log(`📋 Parsed ${typedQuestions?.length} questions from file`);
      } catch (error: unknown) {
        // JSON parsing failed
        const errorMsg: string =
          error instanceof Error ? error.message : "Unknown error";
        setMessage({
          type: "error",
          text: `❌ JSON parsing error: ${errorMsg}`,
        });
        setParsedQuestions(null);
        console.error("JSON Parse Error:", error);
      }
    };

    reader.onerror = (): void => {
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
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e?.preventDefault?.();

    // VALIDATION: Safe checks without .toLowerCase() on undefined
    const safeChapterName: string = chapterName?.trim?.() || "";
    const safeDifficulty: string = difficulty?.trim?.().toLowerCase?.() || "medium";

    // Check chapter name
    if (!safeChapterName) {
      setMessage({
        type: "error",
        text: "❌ Please enter a Chapter Name",
      });
      return;
    }

    // Check difficulty
    const validDifficulties: string[] = ["easy", "medium", "hard"];
    if (!validDifficulties?.includes?.(safeDifficulty)) {
      setMessage({
        type: "error",
        text: "❌ Please select a valid difficulty level",
      });
      return;
    }

    // Check parsed questions
    if (!parsedQuestions || (parsedQuestions as Question[])?.length === 0) {
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

      const bearerToken: string = session?.access_token || "";

      // Prepare request body
      const requestBody: ApiRequestBody = {
        chapterName: safeChapterName,
        difficulty: safeDifficulty,
        questions: parsedQuestions as Question[],
      };

      // Log request for debugging
      console.log("📤 Sending request to Edge Function:");
      console.log("Body:", requestBody);

      // Make API call to Supabase Edge Function
      const response: Response = await fetch(
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
        const errorMessage: string =
          (errorData as Record<string, unknown>)?.error ||
          (errorData as Record<string, unknown>)?.message ||
          `API Error (${response?.status})`;

        throw new Error(`❌ API Error: ${errorMessage}`);
      }

      const result = (await response?.json?.()) || {};

      // Success!
      setMessage({
        type: "success",
        text: `✅ Successfully created chapter "${safeChapterName}" with ${(parsedQuestions as Question[])?.length} question(s)!`,
      });

      console.log("📥 Response from Edge Function:", result);

      // Reset form
      setChapterName("");
      setDifficulty("medium");
      setFile(null);
      setFileName("");
      setParsedQuestions(null);
    } catch (error: unknown) {
      // Handle errors
      const errorMessage: string =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during upload";

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
  const getMessageStyle = (): string => {
    const baseStyle: string = "mt-4 p-4 rounded-lg font-medium text-sm";
    const typeStyles: Record<string, string> = {
      success: "bg-green-100 text-green-800 border-2 border-green-300",
      error: "bg-red-100 text-red-800 border-2 border-red-300",
      warning: "bg-yellow-100 text-yellow-800 border-2 border-yellow-300",
    };

    return `${baseStyle} ${typeStyles?.[message?.type as string] || ""}`;
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
            onChange={(e: ChangeEvent<HTMLInputElement>): void =>
              setChapterName(e?.target?.value || "")
            }
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
            onChange={(e: ChangeEvent<HTMLSelectElement>): void =>
              setDifficulty(e?.target?.value || "medium")
            }
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
        {parsedQuestions && (parsedQuestions as Question[])?.length > 0 && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">
              ✓ Ready to upload:{" "}
              <span className="text-lg">{(parsedQuestions as Question[])?.length}</span> question(s)
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

export default QuizChapterUploaderTS;
