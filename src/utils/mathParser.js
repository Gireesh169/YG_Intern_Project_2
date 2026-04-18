/**
 * Parses plain text math input into LaTeX for display.
 * Strict conversion rules to ensure deterministic output.
 */

export const parseMathToLatex = (input) => {
    if (!input) return { latex: "", error: null };

    // 1. Basic Cleaning
    let text = input.trim();

    // 2. Security / Validation Checks
    // Disallow LaTeX control characters that students shouldn't use directly
    if (text.includes("\\")) {
        return { latex: "", error: "Please do not use backslashes (\\). Type plain text like '1/2' or 'sqrt(x)'." };
    }
    if (text.includes("{") || text.includes("}")) {
        return { latex: "", error: "Please do not use curly braces { }. Use parentheses ( ) if needed." };
    }

    // 3. Definitions and replacements
    // We perform replacements in a specific order to avoid collisions.

    // Greek letters (supported set)
    // We replace 'pi' with '\pi', 'theta' with '\theta', etc.
    // Use word boundaries to avoid replacing 'picture' -> '\pictuare'
    const greekLetters = [
        "pi", "theta", "alpha", "beta", "gamma", "delta", "epsilon",
        "lambda", "mu", "sigma", "omega", "phi"
    ];

    // Functions
    const functions = [
        "sin", "cos", "tan", "cot", "sec", "csc",
        "log", "ln", "lim"
    ];

    let processing = text;

    try {
        processing = convertToLatex(processing, greekLetters, functions);
    } catch (err) {
        return { latex: "", error: "Invalid syntax." };
    }

    return { latex: processing, error: null };
};

const convertToLatex = (text, greekLetters, functions) => {
    let result = text;

    // 1. Identify Greek Letters and Functions (add backslash)
    // We use a regex with word boundaries
    greekLetters.forEach(gl => {
        const regex = new RegExp(`\\b${gl}\\b`, 'g');
        result = result.replace(regex, `\\${gl}`);
    });

    functions.forEach(fn => {
        const regex = new RegExp(`\\b${fn}\\b`, 'g');
        result = result.replace(regex, `\\${fn}`);
    });

    // 2. Superscripts / Powers: ^
    // x^2 -> x^{2}
    // x^(a+b) -> x^{a+b}
    result = result.replace(/\^\(([^)]+)\)/g, "^{$1}");
    result = result.replace(/\^([a-zA-Z0-9]+)/g, "^{$1}");

    // 3. Subscripts: _
    result = result.replace(/_\(([^)]+)\)/g, "_{$1}");
    result = result.replace(/_([a-zA-Z0-9]+)/g, "_{$1}");

    // 4. Square roots
    // sqrt(...) -> \sqrt{...}
    let prev;
    let loops = 0;
    do {
        prev = result;
        result = replaceBalancedFunction(result, "sqrt", "\\sqrt");
        loops++;
    } while (prev !== result && loops < 5);

    // 5. Fractions
    // a/b -> \frac{a}{b}
    result = processFractions(result);

    // 6. Multiplication
    // * -> \cdot
    result = result.replace(/\*/g, " \\cdot ");

    return result;
};

// Helper to replace func(...) with \cmd{...} handling balanced parens
function replaceBalancedFunction(str, funcName, latexCmd) {
    let searchStr = funcName + "(";
    let idx = str.indexOf(searchStr);
    while (idx !== -1) {
        let openCount = 1;
        let endIdx = -1;
        // Start scanning after the opening (
        for (let i = idx + searchStr.length; i < str.length; i++) {
            if (str[i] === '(') openCount++;
            else if (str[i] === ')') openCount--;

            if (openCount === 0) {
                endIdx = i;
                break;
            }
        }

        if (endIdx !== -1) {
            // Found balanced
            const content = str.substring(idx + searchStr.length, endIdx);
            const before = str.substring(0, idx);
            const after = str.substring(endIdx + 1);
            str = before + `${latexCmd}{${content}}` + after;
            // Search next
            idx = str.indexOf(searchStr, before.length + latexCmd.length + content.length + 2);
        } else {
            break;
        }
    }
    return str;
}

// Helper for fractions with robust balanced paren scanning
function processFractions(str) {
    let parts = str.split('');
    let i = 0;
    while (i < parts.length) {
        if (parts[i] === '/') {
            // Found division at index i

            // --- Find Numerator (backwards from i-1) ---
            let numStart = i; // Default start (empty)
            let numParenCount = 0;

            // Scan backwards
            for (let k = i - 1; k >= 0; k--) {
                const char = parts[k];
                if (char === ')') {
                    numParenCount++;
                } else if (char === '(') {
                    numParenCount--;
                }

                // If we went "outside" valid scope (e.g. scanning past an opening paren that wasn't closed)
                // ( ... a/b ) -> scanning 'a' backs into '('. count becomes -1.
                // This means 'a' starts after that '('.
                if (numParenCount < 0) {
                    numStart = k + 1;
                    break;
                }

                if (numParenCount === 0) {
                    // Stop at operators or spaces
                    if (["+", "-", "=", " ", "*"].includes(char)) {
                        numStart = k + 1;
                        break;
                    }
                    // Special: If we just finished a group (we saw ')' and now we are at '(', count back to 0)
                    // and we continue specific for implicit multiplication?
                    // No, simpler: if we hit '(', and count is 0, it means we scanned a group `(...)`.
                    // If PREVIOUS char (k-1) is not an operator, do we continue?
                    // e.g. sin(x)/y -> sin(x) is numerator? Yes.
                    // e.g. (a)(b)/c -> (a)(b) is numerator? Yes.
                    // e.g. a(b)/c -> a(b) ?? Maybe.
                    // For now, let's stop if we have a group and then hit non-operator? 
                    // Or just keep greedy until operator.
                    // Greedy until operator is safer for math context like `sin(x)/y`.
                }

                if (k === 0) {
                    numStart = 0;
                }
            }

            // --- Find Denominator (forwards from i+1) ---
            let denStart = i + 1;
            let denEnd = parts.length;
            let denParenCount = 0;

            for (let k = i + 1; k < parts.length; k++) {
                const char = parts[k];
                if (char === '(') {
                    denParenCount++;
                } else if (char === ')') {
                    denParenCount--;
                }

                // If we hit a closing paren that closes an outer scope
                if (denParenCount < 0) {
                    denEnd = k;
                    break;
                }

                if (denParenCount === 0) {
                    // Stop at operators
                    if (["+", "-", "=", " ", "*", "/"].includes(char)) {
                        denEnd = k;
                        break;
                    }
                }
            }

            // Safety check for empty numerator/denominator handling if needed
            if (numStart >= i || denStart >= denEnd) {
                // Something wrong or empty, skip this slash to avoid infinite loop
                i++;
                continue;
            }

            // Extract and clean
            let numerator = parts.slice(numStart, i).join("");
            let denominator = parts.slice(denStart, denEnd).join("");

            // Strip outer parens if completely balanced
            if (numerator.startsWith("(") && numerator.endsWith(")") && isBalancedOuter(numerator)) {
                numerator = numerator.slice(1, -1);
            }
            if (denominator.startsWith("(") && denominator.endsWith(")") && isBalancedOuter(denominator)) {
                denominator = denominator.slice(1, -1);
            }

            const latexFrac = `\\frac{${numerator}}{${denominator}}`;

            const before = parts.slice(0, numStart).join("");
            const after = parts.slice(denEnd).join("");

            str = before + latexFrac + after;

            // Restart scan from 0 to handle nested things correctly
            parts = str.split('');
            i = 0;
            continue;
        }
        i++;
    }
    return str;
}

function isBalancedOuter(str) {
    if (!str.startsWith("(") || !str.endsWith(")")) return false;
    let count = 0;
    for (let j = 0; j < str.length; j++) {
        if (str[j] === '(') count++;
        if (str[j] === ')') count--;
        if (count === 0 && j < str.length - 1) return false;
    }
    return count === 0;
}
