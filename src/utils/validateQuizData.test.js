
import { validateQuizData } from './validateQuizData.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runTests() {
    console.log("Running Quiz Data Validation Tests (Restricted Rules)...\n");

    const validSample = {
        "grade": "9",
        "subject": "Science",
        "textbookRef": "Physics",
        "chapterNumber": 3,
        "chapterName": "Test 30",
        "questions": [
            {
                "questionType": "mcq",
                "difficulty": "easy",
                "questionText": "Unit of luminous intensity?",
                "options": [
                    { "optionText": "Candela", "isCorrect": true },
                    { "optionText": "Lumen", "isCorrect": false }
                ]
            }
        ]
    };

    const testCases = [
        {
            name: "Valid Basic Sample",
            data: validSample,
            expectedValid: true
        },
        {
            name: "Category Removed (Should not error if present or missing)",
            data: {
                ...validSample,
                questions: [{ ...validSample.questions[0], category: "anything" }]
            },
            expectedValid: true
        },
        {
            name: "Context Mismatch",
            data: validSample,
            context: { grade: "10", subject: "Science", textbookRef: "Physics", chapterName: "Test 30" },
            expectedValid: false
        },
        {
            name: "Valid Passage Group",
            data: {
                ...validSample,
                questions: [{
                    "questionType": "mcq", // Using MCQ with passage fields
                    "difficulty": "medium",
                    "questionText": "Read...",
                    "passageId": "P1",
                    "passageTitle": "Title",
                    "passageText": "Text",
                    "options": [{ "optionText": "A", "isCorrect": true }, { "optionText": "B", "isCorrect": false }]
                }]
            },
            expectedValid: true
        },
        {
            name: "Invalid Passage Group (Missing Fields)",
            data: {
                ...validSample,
                questions: [{
                    "questionType": "mcq",
                    "difficulty": "medium",
                    "questionText": "Read...",
                    "passageId": "P1",
                    // Missing title/text
                    "options": [{ "optionText": "A", "isCorrect": true }, { "optionText": "B", "isCorrect": false }]
                }]
            },
            expectedValid: false
        }
    ];

    const output = [];
    let passed = 0;
    let failed = 0;

    testCases.forEach(test => {
        const result = validateQuizData(test.data, test.context);
        const success = result.isValid === test.expectedValid;

        if (success) {
            output.push(`[PASS] ${test.name}`);
            passed++;
        } else {
            output.push(`[FAIL] ${test.name}`);
            output.push(`  Expected valid: ${test.expectedValid}, Got: ${result.isValid}`);
            if (result.errors.length > 0) {
                output.push(`  Errors: ${JSON.stringify(result.errors)}`);
            }
            failed++;
        }
    });

    output.push(`\nSummary: ${passed} Passed, ${failed} Failed`);
    console.log(output.join('\n'));
}

runTests();
