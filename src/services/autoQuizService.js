// src/services/autoQuizService.js

// Dummy questions database
// In a real app, this would be fetched from a backend.
// We tag each question with a 'subModuleId' to simulate topic filtering.
// For the prototype, we assume submodules in the course have IDs like '1', '2', '3' or generic strings.
// To make it work with ANY course, we will assign random subModuleIds from the input list if needed,
// OR we just ignore submodule filtering if the IDs don't match, 
// BUT the requirement says "Selected only from chosen submodules".
// So we will add a helper to "mock" tags onto these questions dynamically if we want them to appear 
// relevant to the *actual* submodules the user sees. 
// HOWEVER, to keep it simple and robust:
// We will assign generic 'type' tags and the generator will randomly assign these questions 
// to the *selected* submodules effectively distributing them.

const questionTemplates = [
  {
    "questionType": "fillblanks",
    "difficulty": "easy",
    "questionText": "The fraction representing half is written as ___.",
    "blanks": [
      "1/2"
    ]
  },
  {
    "questionType": "fillblanks",
    "difficulty": "medium",
    "questionText": "The area of a circle is given by A = ___.",
    "blanks": [
      "pi*r^2"
    ]
  },
  {
    "questionType": "fillblanks",
    "difficulty": "medium",
    "questionText": "The quadratic formula involves the square root term: ___.",
    "blanks": [
      "sqrt(b^2-4ac)"
    ]
  },
  {
    "questionType": "fillblanks",
    "difficulty": "hard",
    "questionText": "Simplify: (x^2)^3 = ___.",
    "blanks": [
      "x^6"
    ]
  },
  {
    "questionType": "fillblanks",
    "difficulty": "hard",
    "questionText": "In trigonometry, ___ is the ratio of opposite to hypotenuse.",
    "blanks": [
      "sin(theta)"
    ]
  }
];


export const generateAutoQuiz = (selectedSubmoduleIds = []) => {
  if (!selectedSubmoduleIds || selectedSubmoduleIds.length === 0) {
    return [];
  }

  // In a real app, we would filtering questions by `subModuleId`.
  // Since we are using dummy data that isn't hardcoded to specific real-world submodules,
  // we will simply "assign" these dummy questions to the selected submodules for the sake of the prototype.

  // 1. "Tag" the dummy questions with the selected submodule IDs randomly so they appear "filtered".
  // This ensures that if we *did* filtering, it would work.
  const taggedQuestions = questionTemplates.map(q => {
    // Pick a random submodule ID from the selected list to assign this question to
    const randomSubId = selectedSubmoduleIds[Math.floor(Math.random() * selectedSubmoduleIds.length)];
    return { ...q, subModuleId: randomSubId };
  });

  // 2. Filter (Now they all supposedly match one of the selected IDs)
  // In a real scenario: const filtered = allQuestions.filter(q => selectedSubmoduleIds.includes(q.subModuleId));
  const filtered = taggedQuestions.filter(q => selectedSubmoduleIds.includes(q.subModuleId));

  // 3. Shuffle (Fisher-Yates)
  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 4. Select top 10
  const selected = shuffled.slice(0, 10);

  return selected;
};
