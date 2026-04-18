
import { useState, useEffect } from "react";
import LatexRenderer from "../common/LatexRenderer"; // Reusing existing wrapper
import { parseMathToLatex } from "../../utils/mathParser";
import { HelpCircle, AlertCircle } from "lucide-react";

const MathInput = ({
    onAnswer,
    savedAnswer,
    isAnswered,
    placeholder = "Type math here... (e.g. 1/2, x^2, sqrt(x))"
}) => {
    const [inputVal, setInputVal] = useState("");
    const [latexVal, setLatexVal] = useState("");
    const [error, setError] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    // Load saved answer if available
    useEffect(() => {
        if (savedAnswer) {
            // Expecting savedAnswer to be string (raw input) or object?
            // Our logic saves { userAnswer: string ... } but usually primitives.
            // If we save object { raw: "...", latex: "..." }, we need to handle it.
            // Current QuizInterface saves `userAnswer` from `onAnswer`.

            let initial = "";
            if (typeof savedAnswer === 'object' && savedAnswer.raw) {
                initial = savedAnswer.raw;
            } else if (typeof savedAnswer === 'string') {
                initial = savedAnswer;
            } else if (savedAnswer?.userAnswer) {
                initial = savedAnswer.userAnswer; // If standard structure passed
            }

            if (initial) {
                setInputVal(initial);
                const { latex, error: err } = parseMathToLatex(initial);
                setLatexVal(latex);
                setError(err);
            }
        }
    }, [savedAnswer]);

    const handleChange = (e) => {
        if (isAnswered) return;
        const val = e.target.value;
        setInputVal(val);

        // Live parse
        const { latex, error: parseError } = parseMathToLatex(val);
        setLatexVal(latex);
        setError(parseError);

        // Propagate up. 
        // If error, we might still want to pass the raw input so state is preserved, 
        // but mark validity? QuizInterface checks correctness against "Answer". 
        // We pass the raw input as the "answer" for now, or an object?
        // User Instructions: "Store: raw_input (plain text), latex (converted expression)"
        // QuizInterface expects `userAnswer` to be passed to `saveResponse`.

        // We will pass an object to onAnswer if possible, or just string.
        // If we pass object, we need to ensure QuizInterface handles it.
        // Looking at QuizInterface: `const checkAnswer = (userAnswer, isCorrectFlag, ...)`
        // And `saveResponse` saves `userAnswer`.
        // We should pass `{ raw: val, latex: latex }` as the userAnswer.

        onAnswer({ raw: val, latex: latex }, !parseError && latex !== "" && latex !== null); // IsCorrect? We don't know the correct answer here yet. 
        // QuizInterface's `checkAnswer` usually takes `isCorrectFlag`.
        // BUT for typed inputs (fillblanks), `correct` is determined by comparing strings.
        // here, we likely need to validation first.
        // Since this is a generic input, we just pass the object. The Parent needs to determine correctness.
        // EXCEPT: `onAnswer` in FillBlanks/TrueFalse takes (answer, isCorrect).
        // In QuizInterface: `handleQuestionAnswer` calls `checkAnswer`.

        // Wait, `MathInput` is replacing the question component? Or is it a sub-component?
        // It will be used inside `QuizInterface` logic. 
        // We will follow the pattern. We pass the data.
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            {/* Input Field */}
            <div className="relative">
                <textarea
                    value={inputVal}
                    onChange={handleChange}
                    disabled={isAnswered}
                    className={`w-full p-4 border-2 rounded-xl text-lg font-mono focus:ring-2 focus:outline-none transition-all
            ${error ? "border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50" :
                            isAnswered ? "border-gray-200 bg-gray-50" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"}`
                    }
                    placeholder={placeholder}
                    rows={3}
                />

                {/* Help Toggle */}
                <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Formatting Help"
                >
                    <HelpCircle size={20} />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Live Preview */}
            {latexVal && !error && (
                <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center min-h-[100px]">
                    <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">Live Preview</span>
                    <div className="text-2xl text-gray-800">
                        <LatexRenderer>{`$${latexVal}$`}</LatexRenderer>
                    </div>
                </div>
            )}

            {/* Helper Guide */}
            {(showHelp || (!inputVal && !isAnswered)) && (
                <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="font-semibold mb-2 text-gray-700">How to type math:</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-xs sm:text-sm">
                        <div className="flex justify-between"><span>Fraction</span> <span className="text-indigo-600">1/2</span></div>
                        <div className="flex justify-between"><span>Power</span> <span className="text-indigo-600">x^2</span></div>
                        <div className="flex justify-between"><span>Square Root</span> <span className="text-indigo-600">sqrt(x)</span></div>
                        <div className="flex justify-between"><span>Subscript</span> <span className="text-indigo-600">x_1</span></div>
                        <div className="flex justify-between"><span>Pi</span> <span className="text-indigo-600">pi</span></div>
                        <div className="flex justify-between"><span>Trig</span> <span className="text-indigo-600">sin(x)</span></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MathInput;
