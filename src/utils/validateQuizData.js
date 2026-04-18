/**
 * Validates the structure and content of the quiz data JSON for bulk upload.
 * Enforces strict rules for mandatory fields, question types, categories, and references.
 * Checks alignment with current context if provided.
 * @param {Object} data - The quiz data object.
 * @param {Object} [context] - Optional. Expected values for { grade, subject, textbookRef, chapterName }.
 * @returns {Object} result - { isValid: boolean, errors: string[] }
 */
export const validateQuizData = (data, context = null) => {
  const errors = [];

  // 1. Root Level Validation
  if (!data) {
    return { isValid: false, errors: ["Data is null or undefined."] };
  }

  const mandatoryRootFields = ['grade', 'subject', 'textbookRef', 'chapterNumber', 'chapterName', 'questions'];
  mandatoryRootFields.forEach(field => {
    // FIX: Check for undefined/null/empty string specifically, allowing 0.
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      errors.push(`Missing root-level field: '${field}'`);
    }
  });

  // --- Context Alignment Check (if context provided) ---
  if (context) {
    if (data.grade && String(data.grade) !== String(context.grade)) {
      errors.push(`Root 'grade' mismatch: Expected '${context.grade}', found '${data.grade}'.`);
    }
    if (data.subject && data.subject.toLowerCase() !== context.subject.toLowerCase()) {
      errors.push(`Root 'subject' mismatch: Expected '${context.subject}', found '${data.subject}'.`);
    }
    // API/UI often mixes 'textbookRef' vs 'textbook'. We check what's in data.textbookRef
    if (data.textbookRef && data.textbookRef.toLowerCase() !== context.textbookRef.toLowerCase()) {
      errors.push(`Root 'textbookRef' mismatch: Expected '${context.textbookRef}', found '${data.textbookRef}'.`);
    }
    // Chapter Name check might be loose or strict. User asked to check alignment.
    if (data.chapterName && context.chapterName && data.chapterName.toLowerCase() !== context.chapterName.toLowerCase()) {
      errors.push(`Root 'chapterName' mismatch: Expected '${context.chapterName}', found '${data.chapterName}'.`);
    }
  }

  if (data.questions !== undefined && !Array.isArray(data.questions)) {
    errors.push("Root field 'questions' must be an array.");
    return { isValid: false, errors };
  }

  // 2. Question Level Validation
  if (Array.isArray(data.questions)) {
    if (data.questions.length === 0) {
      errors.push("The 'questions' array is empty.");
    }

    data.questions.forEach((q, index) => {
      const qPrefix = `Question ${index + 1}`;

      // --- Mandatory Fields ---
      if (!q.questionType) errors.push(`${qPrefix}: Missing 'questionType'.`);
      if (!q.difficulty) errors.push(`${qPrefix}: Missing 'difficulty'.`);
      if (!q.questionText) errors.push(`${qPrefix}: Missing 'questionText'.`);

      // 'category' is NO LONGER mandatory.
      // But if present, valid values check (below) still applies.

      // --- Value Checks ---
      const validTypes = ['mcq', 'multi', 'truefalse', 'fillblanks', 'matchfollowing'];
      const validDifficulties = ['easy', 'medium', 'hard'];
      const validCategories = ['recall', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation', 'procedural_skill'];

      if (q.questionType && !validTypes.includes(q.questionType)) {
        errors.push(`${qPrefix}: Invalid 'questionType': '${q.questionType}'. Allowed: ${validTypes.join(', ')}.`);
      }
      if (q.difficulty && !validDifficulties.includes(q.difficulty)) {
        errors.push(`${qPrefix}: Invalid 'difficulty': '${q.difficulty}'. Allowed: ${validDifficulties.join(', ')}.`);
      }
      if (q.category && !validCategories.includes(q.category)) {
        errors.push(`${qPrefix}: Invalid 'category': '${q.category}'. Allowed: ${validCategories.join(', ')}.`);
      }

      // --- Optional Group Coherence Checks ---
      // If one exists, all in the group must exist.
      validateGroupCoherence(q, ['sourceTextbookUrl', 'pageNumber' ],"pageNumber || url ",qPrefix, errors);
      validateGroupCoherence(q, ['passageId', 'passageTitle', 'passageText'], 'Passage', qPrefix, errors);
      validateGroupCoherence(q, ['imageName', 'imageCaption'], 'Image', qPrefix, errors);

      // --- Linkage & Reference Specifics ---

      // Image Extension Check
      if (q.imageName) {
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = '.' + q.imageName.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
          errors.push(`${qPrefix} (Image): Invalid file extension '${ext}'. Allowed: ${allowedExts.join(', ')}`);
        }
      }


      // --- Type-Specific Logic ---
      if (q.questionType) {
        switch (q.questionType) {
          case 'mcq':
            validateMCQ(q, qPrefix, errors);
            break;
          case 'multi':
            validateMulti(q, qPrefix, errors);
            break;
          case 'truefalse':
            validateTrueFalse(q, qPrefix, errors);
            break;
          case 'fillblanks':
            validateFillBlanks(q, qPrefix, errors);
            break;
          case 'matchfollowing':
            validateMatchFollowing(q, qPrefix, errors);
            break;
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// --- Helper Functions ---

/**
 * Checks if a group of optional fields follows "All or None" rule.
 */
function validateGroupCoherence(obj, fields, groupName, prefix, errors) {
  let presentCount = 0;
  fields.forEach(f => {
    if (obj[f] !== undefined && obj[f] !== null && obj[f] !== "") {
      presentCount++;
    }
  });

  if (presentCount > 0 && presentCount < fields.length) {
    errors.push(`${prefix} (${groupName}): Incomplete optional fields. If one is present, ALL must be present: ${fields.join(', ')}.`);
  }
}


function validateMCQ(q, prefix, errors) {
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push(`${prefix} (MCQ): Must have 'options' array with at least 2 items.`);
    return;
  }

  let correctCount = 0;
  q.options.forEach((opt, i) => {
    if (!opt.optionText) errors.push(`${prefix} (MCQ): Option ${i + 1} missing 'optionText'.`);
    if (typeof opt.isCorrect !== 'boolean') errors.push(`${prefix} (MCQ): Option ${i + 1} missing or invalid 'isCorrect' (must be boolean).`);
    if (opt.isCorrect) correctCount++;
  });

  if (correctCount !== 1) {
    errors.push(`${prefix} (MCQ): Must have exactly ONE correct option (found ${correctCount}).`);
  }
}

function validateMulti(q, prefix, errors) {
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push(`${prefix} (Multi): Must have 'options' array with at least 2 items.`);
  }
  if (!Array.isArray(q.multi) || q.multi.length === 0) {
    errors.push(`${prefix} (Multi): Must have 'multi' array (correct answers) with at least 1 item.`);
  }

  if (q.options && q.multi) {
    const optionTexts = new Set(q.options.map(o => o.optionText));
    q.multi.forEach(ans => {
      if (!optionTexts.has(ans)) {
        errors.push(`${prefix} (Multi): Correct answer '${ans}' listed in 'multi' does not exist in 'options'.`);
      }
    });
  }
}

function validateTrueFalse(q, prefix, errors) {
  if (typeof q.correctAnswer !== 'boolean') {
    errors.push(`${prefix} (TrueFalse): 'correctAnswer' must be a boolean (true/false).`);
  }
}

function validateFillBlanks(q, prefix, errors) {
  if (!Array.isArray(q.blanks) || q.blanks.length === 0) {
    errors.push(`${prefix} (FillBlanks): Must have 'blanks' array with at least 1 item.`);
  }
}

function validateMatchFollowing(q, prefix, errors) {
  if (!Array.isArray(q.leftItems) || q.leftItems.length === 0) {
    errors.push(`${prefix} (MatchFollowing): 'leftItems' array is missing or empty.`);
  }
  if (!Array.isArray(q.rightItems) || q.rightItems.length === 0) {
    errors.push(`${prefix} (MatchFollowing): 'rightItems' array is missing or empty.`);
  }
  if (!Array.isArray(q.correctMappings) || q.correctMappings.length === 0) {
    errors.push(`${prefix} (MatchFollowing): 'correctMappings' array is missing or empty.`);
  }

  if (q.correctMappings && Array.isArray(q.correctMappings)) {
    const lLen = q.leftItems ? q.leftItems.length : 0;
    const rLen = q.rightItems ? q.rightItems.length : 0;

    q.correctMappings.forEach((mapping, i) => {
      if (typeof mapping.leftIndex !== 'number' || typeof mapping.rightIndex !== 'number') {
        errors.push(`${prefix} (MatchFollowing): Mapping ${i + 1} has invalid indices.`);
        return;
      }
      if (mapping.leftIndex < 0 || mapping.leftIndex >= lLen) {
        errors.push(`${prefix} (MatchFollowing): Mapping ${i + 1} leftIndex ${mapping.leftIndex} is out of bounds (max ${lLen - 1}).`);
      }
      if (mapping.rightIndex < 0 || mapping.rightIndex >= rLen) {
        errors.push(`${prefix} (MatchFollowing): Mapping ${i + 1} rightIndex ${mapping.rightIndex} is out of bounds (max ${rLen - 1}).`);
      }
    });
  }
}
