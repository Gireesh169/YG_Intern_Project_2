import React from "react";
import QuizChapterUploader from "../components/QuizChapterUploader";

/**
 * Example Admin Page showing QuizChapterUploader in action
 * 
 * This page demonstrates:
 * - How to import the component
 * - How to use it in a layout
 * - How to add instructions for users
 */
export default function AdminQuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📚 Quiz Management Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Create new quiz chapters by uploading JSON files with questions
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Component */}
          <div className="lg:col-span-1">
            <QuizChapterUploader />
          </div>

          {/* Right Column - Instructions & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* How to Use Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📖 How to Use
              </h2>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </span>
                  <span className="pt-0.5">
                    <strong>Prepare your JSON file</strong> with questions in the required format
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </span>
                  <span className="pt-0.5">
                    <strong>Enter chapter name</strong> (e.g., "Algebra Basics", "World History")
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </span>
                  <span className="pt-0.5">
                    <strong>Select difficulty level</strong> (Easy, Medium, or Hard)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </span>
                  <span className="pt-0.5">
                    <strong>Upload your JSON file</strong> and preview the parsed questions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    5
                  </span>
                  <span className="pt-0.5">
                    <strong>Click "Create Chapter"</strong> to submit to the server
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <span className="pt-0.5">
                    <strong>Success!</strong> Your chapter is created with all questions
                  </span>
                </li>
              </ol>
            </div>

            {/* JSON Format Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📝 JSON File Format
              </h2>
              <p className="text-gray-600 mb-3">
                Your JSON file must contain a "questions" array with this structure:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`{
  "questions": [
    {
      "text": "What is 2 + 2?",
      "options": [
        "3",
        "4",
        "5",
        "6"
      ],
      "correctAnswer": 1,
      "difficulty": "easy",
      "explanation": "2 + 2 equals 4"
    },
    {
      "text": "What is photosynthesis?",
      "options": [
        "Plant growth process",
        "How plants make food",
        "Water absorption",
        "Mineral uptake"
      ],
      "correctAnswer": 1,
      "difficulty": "medium"
    }
  ]
}`}</pre>
              </div>
              <p className="text-gray-600 text-sm mt-3">
                <strong>Required fields:</strong> text, options (array), correctAnswer (0-based index)
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Optional fields:</strong> difficulty, explanation
              </p>
            </div>

            {/* Tips Section */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">
                💡 Tips & Best Practices
              </h2>
              <ul className="space-y-2 text-blue-800">
                <li>✓ Use descriptive chapter names that reflect the content</li>
                <li>✓ Validate your JSON syntax using a JSON validator before uploading</li>
                <li>✓ Start with easier questions and progress to harder ones</li>
                <li>✓ Include explanations for correct answers to help students learn</li>
                <li>✓ Test with a small JSON file (2-3 questions) first</li>
                <li>✓ Use consistent difficulty levels across all questions</li>
                <li>✓ Check browser console (F12) for debugging information</li>
              </ul>
            </div>

            {/* Example Files Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📦 Example JSON Files
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">Simple Example (2 questions)</h3>
                  <button
                    onClick={() => {
                      const json = {
                        questions: [
                          {
                            text: "What is React?",
                            options: ["A library", "A framework", "A language", "A database"],
                            correctAnswer: 0,
                            difficulty: "easy",
                            explanation: "React is a JavaScript library for building user interfaces"
                          },
                          {
                            text: "What does useState do?",
                            options: ["Creates components", "Manages state", "Handles routing", "Fetches data"],
                            correctAnswer: 1,
                            difficulty: "medium"
                          }
                        ]
                      };
                      
                      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "react-basics.json";
                      a.click();
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Download react-basics.json
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-gray-700 mb-2">Full Example (5 questions)</h3>
                  <button
                    onClick={() => {
                      const json = {
                        questions: [
                          {
                            text: "What is the capital of France?",
                            options: ["London", "Paris", "Berlin", "Madrid"],
                            correctAnswer: 1,
                            difficulty: "easy"
                          },
                          {
                            text: "Which planet is closest to the Sun?",
                            options: ["Venus", "Mercury", "Earth", "Mars"],
                            correctAnswer: 1,
                            difficulty: "easy",
                            explanation: "Mercury is the first planet from the Sun"
                          },
                          {
                            text: "What year did World War II end?",
                            options: ["1943", "1944", "1945", "1946"],
                            correctAnswer: 2,
                            difficulty: "medium"
                          },
                          {
                            text: "Who wrote 'Romeo and Juliet'?",
                            options: ["Marlowe", "Jonson", "Shakespeare", "Bacon"],
                            correctAnswer: 2,
                            difficulty: "medium"
                          },
                          {
                            text: "What is the chemical formula for sulfuric acid?",
                            options: ["H2SO3", "H2SO4", "HSO4", "H3SO4"],
                            correctAnswer: 1,
                            difficulty: "hard",
                            explanation: "Sulfuric acid is H2SO4, one of the most important industrial chemicals"
                          }
                        ]
                      };
                      
                      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "history-science-quiz.json";
                      a.click();
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Download history-science-quiz.json
                  </button>
                </div>
              </div>
            </div>

            {/* Troubleshooting Section */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-red-900 mb-4">
                ⚠️ Troubleshooting
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-red-800">JSON parsing error?</p>
                  <p className="text-red-700 text-sm">
                    Check JSON syntax using <a href="https://jsonlint.com" className="underline hover:no-underline">jsonlint.com</a>
                  </p>
                </div>
                <div>
                  <p className="font-bold text-red-800">File not uploading?</p>
                  <p className="text-red-700 text-sm">
                    Ensure file has .json extension and is not corrupted
                  </p>
                </div>
                <div>
                  <p className="font-bold text-red-800">Submit button disabled?</p>
                  <p className="text-red-700 text-sm">
                    Make sure chapter name is entered and JSON file is parsed successfully
                  </p>
                </div>
                <div>
                  <p className="font-bold text-red-800">Upload fails?</p>
                  <p className="text-red-700 text-sm">
                    Check that you're logged in and have internet connection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p>
            For more information, check the{" "}
            <a href="#" className="text-blue-600 hover:underline">
              documentation
            </a>
          </p>
          <p className="text-sm mt-2">
            Need help? Open browser console (F12) to see detailed debug information
          </p>
        </div>
      </div>
    </div>
  );
}
