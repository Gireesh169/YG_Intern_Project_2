// src/utils/conceptToMcq.js
export default function conceptToMcq(conceptText) {
  if (!conceptText || typeof conceptText !== "string") return [];

  return [
    {
      id: "concept-q1",
      question_type: "mcq",
      question_text: "What is the main idea explained in the concept?",
      options: [
        { optionText: "The core principle described in the concept", isCorrect: true },
        { optionText: "An unrelated theory", isCorrect: false },
        { optionText: "A historical background only", isCorrect: false },
        { optionText: "None of the above", isCorrect: false }
      ],
      explanation: "This question checks overall understanding of the concept."
    },
    {
      id: "concept-q2",
      question_type: "mcq",
      question_text: "Which statement best supports the concept?",
      options: [
        { optionText: "A statement aligned with the concept explanation", isCorrect: true },
        { optionText: "A contradicting statement", isCorrect: false },
        { optionText: "An unrelated observation", isCorrect: false },
        { optionText: "An assumption without basis", isCorrect: false }
      ],
      explanation: "Identifies correct interpretation."
    },
    {
      id: "concept-q3",
      question_type: "mcq",
      question_text: "What is a key outcome of the concept discussed?",
      options: [
        { optionText: "A direct result mentioned or implied", isCorrect: true },
        { optionText: "A random outcome", isCorrect: false },
        { optionText: "A side effect not discussed", isCorrect: false },
        { optionText: "No outcome is described", isCorrect: false }
      ],
      explanation: "Checks conceptual consequence."
    },
    {
      id: "concept-q4",
      question_type: "mcq",
      question_text: "Which option correctly applies the concept?",
      options: [
        { optionText: "Correct real-world application", isCorrect: true },
        { optionText: "Incorrect usage", isCorrect: false },
        { optionText: "Opposite application", isCorrect: false },
        { optionText: "Application outside scope", isCorrect: false }
      ],
      explanation: "Tests application understanding."
    },
    {
      id: "concept-q5",
      question_type: "mcq",
      question_text: "Why is this concept important?",
      options: [
        { optionText: "It explains a fundamental idea clearly", isCorrect: true },
        { optionText: "It has no practical relevance", isCorrect: false },
        { optionText: "It is purely theoretical with no use", isCorrect: false },
        { optionText: "It is outdated", isCorrect: false }
      ],
      explanation: "Tests conceptual importance."
    }
  ];
}
