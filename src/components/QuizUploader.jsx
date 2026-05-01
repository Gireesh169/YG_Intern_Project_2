import React, { useState } from "react";
import { supabase } from "../config/supabase";

const QuizUploader = () => {
  const [file, setFile] = useState(null);
  const [subModuleId, setSubModuleId] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [fileName, setFileName] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e?.target?.files?.[0];
    
    if (!selectedFile) {
      setFile(null);
      setParsedQuestions(null);
      setFileName("");
      return;
    }

    // Validate file type
    if (!selectedFile.type.includes("json") && !selectedFile.name.endsWith(".json")) {
      setMessage({
        type: "error",
        text: "Please upload a valid JSON file",
      });
      setFile(null);
      setParsedQuestions(null);
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setMessage({ type: null, text: "" });

    // Parse JSON file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event?.target?.result;
        const jsonData = JSON.parse(content);

        // Extract questions array with optional chaining
        const questions = jsonData?.questions;

        if (!Array.isArray(questions)) {
          setMessage({
            type: "error",
            text: 'Invalid JSON format. Must contain a "questions" array.',
          });
          setParsedQuestions(null);
          return;
        }

        if (questions.length === 0) {
          setMessage({
            type: "warning",
            text: "JSON file contains an empty questions array.",
          });
        } else {
          setMessage({
            type: "success",
            text: `✓ Successfully parsed ${questions.length} question(s)`,
          });
        }

        setParsedQuestions(questions);
      } catch (error) {
        setMessage({
          type: "error",
          text: `JSON parsing error: ${error?.message || "Invalid JSON"}`,
        });
        setParsedQuestions(null);
      }
    };

    reader.onerror = () => {
      setMessage({
        type: "error",
        text: "Error reading file. Please try again.",
      });
      setParsedQuestions(null);
    };

    reader.readAsText(selectedFile);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    // Validation
    if (!subModuleId?.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a Sub-Module ID",
      });
      return;
    }

    if (!parsedQuestions) {
      setMessage({
        type: "error",
        text: "No questions to upload. Please select and parse a JSON file first.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("No authentication token. Please log in first.");
      }

      const accessToken = session?.access_token;

      // Call Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            subModuleId: subModuleId?.trim(),
            questions: parsedQuestions,
          }),
        }
      );

      if (!response?.ok) {
        const errorData = await response?.json().catch(() => ({}));
        throw new Error(
          errorData?.error ||
          errorData?.message ||
          `Upload failed (${response?.status})`
        );
      }

      const result = await response?.json();

      setMessage({
        type: "success",
        text: `✓ Successfully uploaded ${parsedQuestions?.length} question(s)!`,
      });

      // Reset form
      setFile(null);
      setFileName("");
      setSubModuleId("");
      setParsedQuestions(null);

      console.log("Upload response:", result);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "An unexpected error occurred during upload",
      });
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Message styling
  const getMessageStyles = () => {
    const baseStyle = "mt-4 p-4 rounded-lg text-sm font-medium";
    const typeStyles = {
      success: "bg-green-100 text-green-800 border border-green-300",
      error: "bg-red-100 text-red-800 border border-red-300",
      warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    };
    return `${baseStyle} ${typeStyles[message?.type] || ""}`;
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Quiz</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sub-Module ID Input */}
        <div>
          <label htmlFor="subModuleId" className="block text-sm font-medium text-gray-700 mb-2">
            Sub-Module ID *
          </label>
          <input
            id="subModuleId"
            type="text"
            value={subModuleId}
            onChange={(e) => setSubModuleId(e?.target?.value || "")}
            placeholder="Enter sub-module identifier"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* File Upload Input */}
        <div>
          <label htmlFor="jsonFile" className="block text-sm font-medium text-gray-700 mb-2">
            JSON File *
          </label>
          <input
            id="jsonFile"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
            disabled={loading}
          />
          {fileName && (
            <p className="mt-2 text-sm text-gray-600">
              📄 Selected: <span className="font-medium">{fileName}</span>
            </p>
          )}
        </div>

        {/* Questions Preview */}
        {parsedQuestions && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{parsedQuestions?.length}</span> question(s) ready to upload
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !parsedQuestions || !subModuleId?.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span> Uploading...
              </span>
            ) : (
              "Submit"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setFile(null);
              setFileName("");
              setSubModuleId("");
              setParsedQuestions(null);
              setMessage({ type: null, text: "" });
            }}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Clear
          </button>
        </div>

        {/* Message Display */}
        {message?.text && (
          <div className={getMessageStyles()}>
            {message?.text}
          </div>
        )}
      </form>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Expected JSON format:</strong>
          <br />
          {`{ "questions": [...] }`}
        </p>
      </div>
    </div>
  );
};

export default QuizUploader;
