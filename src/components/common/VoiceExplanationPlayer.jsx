import { useState, useEffect, useRef } from "react";
import { Volume2, Square, Play, Pause } from "lucide-react";

const VoiceExplanationPlayer = ({ text, className = "" }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const utteranceRef = useRef(null);

    useEffect(() => {
        // Cancel any ongoing speech when component unmounts or text changes
        return () => {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setIsPaused(false);
        };
    }, [text]);

    const cleanTextForSpeech = (rawText) => {
        if (!rawText) return "";

        // 1. Remove HTML tags
        let text = rawText.replace(/<[^>]*>/g, " ");

        // 2. Pre-process common symbols (non-nested)
        const symbolReplacements = [
            // --- Greek Letters (Lowercase) ---
            { regex: /\\alpha/g, replacement: " alpha " },
            { regex: /\\beta/g, replacement: " beta " },
            { regex: /\\gamma/g, replacement: " gamma " },
            { regex: /\\delta/g, replacement: " delta " },
            { regex: /\\epsilon/g, replacement: " epsilon " },
            { regex: /\\varepsilon/g, replacement: " epsilon " },
            { regex: /\\zeta/g, replacement: " zeta " },
            { regex: /\\eta/g, replacement: " eta " },
            { regex: /\\theta/g, replacement: " theta " },
            { regex: /\\vartheta/g, replacement: " theta " },
            { regex: /\\iota/g, replacement: " iota " },
            { regex: /\\kappa/g, replacement: " kappa " },
            { regex: /\\lambda/g, replacement: " lambda " },
            { regex: /\\mu/g, replacement: " mu " },
            { regex: /\\nu/g, replacement: " nu " },
            { regex: /\\xi/g, replacement: " xi " },
            { regex: /\\pi/g, replacement: " pi " },
            { regex: /\\rho/g, replacement: " rho " },
            { regex: /\\sigma/g, replacement: " sigma " },
            { regex: /\\tau/g, replacement: " tau " },
            { regex: /\\upsilon/g, replacement: " upsilon " },
            { regex: /\\phi/g, replacement: " phi " },
            { regex: /\\varphi/g, replacement: " phi " },
            { regex: /\\chi/g, replacement: " chi " },
            { regex: /\\psi/g, replacement: " psi " },
            { regex: /\\omega/g, replacement: " omega " },

            // --- Greek Letters (Uppercase) ---
            { regex: /\\Gamma/g, replacement: " Gamma " },
            { regex: /\\Delta/g, replacement: " Delta " },
            { regex: /\\Theta/g, replacement: " Theta " },
            { regex: /\\Lambda/g, replacement: " Lambda " },
            { regex: /\\Xi/g, replacement: " Xi " },
            { regex: /\\Pi/g, replacement: " Pi " },
            { regex: /\\Sigma/g, replacement: " Sigma " },
            { regex: /\\Upsilon/g, replacement: " Upsilon " },
            { regex: /\\Phi/g, replacement: " Phi " },
            { regex: /\\Psi/g, replacement: " Psi " },
            { regex: /\\Omega/g, replacement: " Omega " },

            // --- Basic Operations & Discrete Math ---
            { regex: /\+/g, replacement: " plus " },
            { regex: /-/g, replacement: " minus " },
            { regex: /\\times/g, replacement: " times " },
            { regex: /\\cdot/g, replacement: " times " },
            { regex: /\*/g, replacement: " times " },
            { regex: /\\div/g, replacement: " divided by " },
            { regex: /\\pm/g, replacement: " plus or minus " },
            { regex: /\\mp/g, replacement: " minus or plus " },
            { regex: /=/g, replacement: " equals " },
            { regex: /\\neq/g, replacement: " not equal to " },
            { regex: /\\approx/g, replacement: " approximately " },
            { regex: /\\sim/g, replacement: " similar to " },
            { regex: /\\simeq/g, replacement: " similar to " },
            { regex: /\\propto/g, replacement: " proportional to " },
            { regex: /</g, replacement: " less than " },
            { regex: />/g, replacement: " greater than " },
            { regex: /\\leq/g, replacement: " less than or equal to " },
            { regex: /\\le/g, replacement: " less than or equal to " },
            { regex: /\\geq/g, replacement: " greater than or equal to " },
            { regex: /\\ge/g, replacement: " greater than or equal to " },
            { regex: /\\ll/g, replacement: " much less than " },
            { regex: /\\gg/g, replacement: " much greater than " },

            // --- Sets & Logic ---
            { regex: /\\forall/g, replacement: " for all " },
            { regex: /\\exists/g, replacement: " there exists " },
            { regex: /\\nexists/g, replacement: " there does not exist " },
            { regex: /\\in/g, replacement: " exists in " },
            { regex: /\\notin/g, replacement: " not in " },
            { regex: /\\subset/g, replacement: " subset of " },
            { regex: /\\subseteq/g, replacement: " subset or equal to " },
            { regex: /\\supset/g, replacement: " superset of " },
            { regex: /\\supseteq/g, replacement: " superset or equal to " },
            { regex: /\\cup/g, replacement: " union " },
            { regex: /\\cap/g, replacement: " intersection " },
            { regex: /\\setminus/g, replacement: " minus " }, // Set difference
            { regex: /\\varnothing/g, replacement: " empty set " },
            { regex: /\\emptyset/g, replacement: " empty set " },
            { regex: /\\land/g, replacement: " and " },
            { regex: /\\wedge/g, replacement: " and " },
            { regex: /\\lor/g, replacement: " or " },
            { regex: /\\vee/g, replacement: " or " },
            { regex: /\\neg/g, replacement: " not " },
            { regex: /\\therefore/g, replacement: " therefore " },
            { regex: /\\because/g, replacement: " because " },

            // --- Arrows ---
            { regex: /\\to/g, replacement: " to " },
            { regex: /\\rightarrow/g, replacement: " approaches " },
            { regex: /\\Rightarrow/g, replacement: " implies " },
            { regex: /\\leftarrow/g, replacement: " from " },
            { regex: /\\Leftarrow/g, replacement: " implied by " },
            { regex: /\\leftrightarrow/g, replacement: " if and only if " },
            { regex: /\\iff/g, replacement: " if and only if " },
            { regex: /\\mapsto/g, replacement: " maps to " },
            { regex: /\\uparrow/g, replacement: " up " },
            { regex: /\\downarrow/g, replacement: " down " },

            // --- Calculus & Functions ---
            { regex: /\\int/g, replacement: " integral " },
            { regex: /\\oint/g, replacement: " contour integral " },
            { regex: /\\sum/g, replacement: " summation " },
            { regex: /\\prod/g, replacement: " product " },
            { regex: /\\lim/g, replacement: " limit " },
            { regex: /\\inf/g, replacement: " infimum " },
            { regex: /\\sup/g, replacement: " supremum " },
            { regex: /\\partial/g, replacement: " partial " },
            { regex: /\\nabla/g, replacement: " del " },
            { regex: /\\infty/g, replacement: " infinity " },
            { regex: /\\sin/g, replacement: " sine " },
            { regex: /\\cos/g, replacement: " cosine " },
            { regex: /\\tan/g, replacement: " tangent " },
            { regex: /\\csc/g, replacement: " cosecant " },
            { regex: /\\sec/g, replacement: " secant " },
            { regex: /\\cot/g, replacement: " cotangent " },
            { regex: /\\sinh/g, replacement: " hyperbolic sine " },
            { regex: /\\cosh/g, replacement: " hyperbolic cosine " },
            { regex: /\\tanh/g, replacement: " hyperbolic tangent " },
            { regex: /\\ln/g, replacement: " natural log " },
            { regex: /\\log/g, replacement: " log " },
            { regex: /\\deg/g, replacement: " degrees " },
            { regex: /\\angle/g, replacement: " angle " },

            // --- Geometry & Accents ---
            { regex: /\\perp/g, replacement: " perpendicular to " },
            { regex: /\\parallel/g, replacement: " parallel to " },
            { regex: /\\triangle/g, replacement: " triangle " },
            { regex: /\\square/g, replacement: " square " },
            { regex: /\\circ/g, replacement: " degrees " },
            { regex: /\^\\circ/g, replacement: " degrees " }, // 90^\circ special case

            // --- Structure & Spacing (Cleanup) ---
            { regex: /\\left/g, replacement: " " },
            { regex: /\\right/g, replacement: " " },
            { regex: /\\,/g, replacement: " " },
            { regex: /\\;/g, replacement: " " },
            { regex: /\\:/g, replacement: " " },
            { regex: /\\quad/g, replacement: " " },
            { regex: /\\qquad/g, replacement: " " },
            { regex: /\\big/g, replacement: " " },
            { regex: /\\Big/g, replacement: " " },
            { regex: /\\bigg/g, replacement: " " },
            { regex: /\\Bigg/g, replacement: " " },
            { regex: /\\%/g, replacement: " percent " },

            // --- Common Superscripts/Subscripts shortcuts ---
            { regex: /\^2/g, replacement: " squared " },
            { regex: /\^3/g, replacement: " cubed " },

            // --- Implicit Multiplication ---
            { regex: /\)\s*\(/g, replacement: ") times (" },

        ];

        symbolReplacements.forEach(({ regex, replacement }) => {
            text = text.replace(regex, replacement);
        });

        // Handle unbraced subscripts like x_i (safe check: next char is alphanumeric)
        // We do this before processLatex so simple subscripts are handled easily.
        // But we must NOT touch _{...} which are handled by processLatex.
        text = text.replace(/_([a-zA-Z0-9])/g, " sub $1 ");

        // 3. Recursive parser for extracting balanced {...} content
        // Returns { content, end } where end is the index after the closing brace
        const extractBracedContent = (str, startIndex) => {
            let depth = 0;
            let captured = "";
            let hasStarted = false;

            for (let i = startIndex; i < str.length; i++) {
                const char = str[i];
                if (char === "{") {
                    if (!hasStarted) {
                        hasStarted = true;
                        depth = 1;
                        continue;
                    }
                    depth++;
                } else if (char === "}") {
                    depth--;
                    if (depth === 0) {
                        return { content: captured, end: i + 1 };
                    }
                }

                if (hasStarted) {
                    captured += char;
                } else if (char !== " " && char !== "\n") {
                    // If we encounter non-whitespace before the first {, it's not a braced arg for this parser
                    return null;
                }
            }
            return null; // unbalanced or not found
        };

        // 4. Recursive processor for nested commands
        const processLatex = (input) => {
            // Look for commands like \cmd
            let result = "";
            let i = 0;

            while (i < input.length) {
                if (input[i] === "\\") {
                    // Potential command start
                    const cmdMatch = input.slice(i).match(/^\\([a-zA-Z]+)/);
                    if (cmdMatch) {
                        const cmd = cmdMatch[1];
                        const cmdLen = cmdMatch[0].length;
                        const nextStart = i + cmdLen;

                        if (cmd === "frac") {
                            // Expect 2 args: {num}{den}
                            const arg1 = extractBracedContent(input, nextStart);
                            if (arg1) {
                                const arg2 = extractBracedContent(input, arg1.end);
                                if (arg2) {
                                    result += ` ${processLatex(arg1.content)} over ${processLatex(arg2.content)} `;
                                    i = arg2.end;
                                    continue;
                                }
                            }
                        } else if (cmd === "sqrt") {
                            // Expect 1 arg: {content} (ignoring optional [root])
                            const arg = extractBracedContent(input, nextStart);
                            if (arg) {
                                result += ` square root of ${processLatex(arg.content)} `;
                                i = arg.end;
                                continue;
                            }
                        } else if (cmd === "overline" || cmd === "bar") {
                            // Expect 1 arg: {content}
                            const arg = extractBracedContent(input, nextStart);
                            if (arg) {
                                result += ` ${processLatex(arg.content)} bar `;
                                i = arg.end;
                                continue;
                            }
                        } else if (cmd === "text" || cmd === "mathrm" || cmd === "mathbf" || cmd === "textit") {
                            // Expect 1 arg: {content}
                            const arg = extractBracedContent(input, nextStart);
                            if (arg) {
                                result += ` ${processLatex(arg.content)} `;
                                i = arg.end;
                                continue;
                            }
                        }
                    }
                }
                // Handle Superscripts ^{...}
                if (input[i] === "^") {
                    const arg = extractBracedContent(input, i + 1);
                    if (arg) {
                        result += ` to the power of ${processLatex(arg.content)} `;
                        i = arg.end;
                        continue;
                    }
                }
                // Handle Subscripts _{...}
                if (input[i] === "_") {
                    const arg = extractBracedContent(input, i + 1);
                    if (arg) {
                        result += ` sub ${processLatex(arg.content)} `;
                        i = arg.end;
                        continue;
                    }
                }

                result += input[i];
                i++;
            }
            return result;
        };

        text = processLatex(text);

        // 5. Final cleanup
        text = text
            .replace(/\$+/g, "")          // Remove remaining dollar signs
            .replace(/[{}]/g, "")         // Remove stray braces
            .replace(/\\[a-zA-Z]+/g, "")  // Remove any remaining unknown commands
            .replace(/\s+/g, " ")         // Collapse whitespace
            .trim();

        return text;
    };

    const handlePlay = () => {
        if (!text) return;

        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsPlaying(true);
            return;
        }

        if (isPlaying) {
            // If already playing (and not paused), pause it? 
            // Or maybe stop? Let's implement Pause for better UX.
            window.speechSynthesis.pause();
            setIsPaused(true);
            setIsPlaying(false);
            return;
        }

        // Start new
        window.speechSynthesis.cancel();

        const spokenText = cleanTextForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utteranceRef.current = utterance;

        // Optional: Select a specific voice if desired, or let browser default
        // const voices = window.speechSynthesis.getVoices();
        // utterance.voice = voices.find(v => v.lang.includes('en')) || null;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        utterance.onerror = (e) => {
            console.error("Speech error:", e);
            setIsPlaying(false);
            setIsPaused(false);
        };

        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
    };

    if (!text) return null;

    return (
        <div className={`flex items-center gap-2 bg-purple-50 p-2 rounded-lg border border-purple-100 inline-flex ${className}`}>
            <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:shadow-md transition-all text-sm font-medium"
                title={isPlaying ? "Pause" : isPaused ? "Resume" : "Listen to Explanation"}
            >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? "Pause" : isPaused ? "Resume" : "Listen"}
            </button>

            {(isPlaying || isPaused) && (
                <button
                    onClick={handleStop}
                    className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Stop"
                >
                    <Square size={16} fill="currentColor" />
                </button>
            )}

            {isPlaying && (
                <div className="flex gap-0.5 items-end h-4 ml-1">
                    <span className="w-1 bg-purple-400 animate-[bounce_0.8s_infinite] h-2"></span>
                    <span className="w-1 bg-purple-400 animate-[bounce_0.6s_infinite] h-4"></span>
                    <span className="w-1 bg-purple-400 animate-[bounce_1.0s_infinite] h-3"></span>
                </div>
            )}
        </div>
    );
};

export default VoiceExplanationPlayer;
