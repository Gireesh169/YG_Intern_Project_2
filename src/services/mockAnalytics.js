// src/services/mockAnalytics.js
// Deterministic dummy analytics generator for a subject/submodule.
// Export getDummyAnalyticsForSubject(subjectId)

const hashNumber = (str, mod = 100) => {
  let h = 2166136261;
  for (let i = 0; i < (str || "").length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h) % mod;
};

export const getDummyAnalyticsForSubject = (subjectId) => {
  const seed = String(subjectId || "default");
  const base = 10 + hashNumber(seed, 40); // between 10-49
  const quizzes = 5 + hashNumber(seed + "q", 20); // between 5-24
  const correct = Math.floor(quizzes * (0.4 + (hashNumber(seed + "c", 30) / 100)));
  const incorrect = Math.max(0, Math.floor(quizzes * (0.3 + (hashNumber(seed + "w", 20) / 100))));
  const totalQuestions = quizzes * (5 + hashNumber(seed + "t", 6)); // ~ quizzes * 5..10
  const bestScore = 50 + hashNumber(seed + "b", 50); // 50..99

  const timeline = Array.from({ length: 8 }, (_, i) => {
    const label = `Day ${i * 4 + 1}`;
    const score = Math.max(10, Math.min(98, Math.round((hashNumber(seed + "s" + i, 100) + 30) / (1 + i * 0.08))));
    const accuracy = Math.max(10, Math.min(99, Math.round(score * (0.7 + (hashNumber(seed + "a" + i, 30) / 100)))));
    return { label, score, accuracy };
  });

  const activity = Array.from({ length: 30 }, (_, i) => {
    const day = `Day ${i + 1}`;
    const spike = (i + hashNumber(seed, 7)) % 7 === 0 ? 2 + (hashNumber(seed + "sp" + i, 3)) : (hashNumber(seed + "d" + i, 3) === 0 ? 1 : 0);
    return { day, label: day, count: spike };
  });

  return {
    stats: {
      totalTimeSpent: (quizzes * 600) + (hashNumber(seed + "time", 3600)),
      correctAnswers: correct * (5 + hashNumber(seed + "m", 3)),
      incorrectAnswers: incorrect * (5 + hashNumber(seed + "n", 3)),
      totalQuestions: totalQuestions,
      totalQuizzes: quizzes,
      bestScore,
    },
    questionClassification: {
      important: Array.from({ length: base }, (_, i) => `imp_${seed}_${i + 1}`),
      ok: Array.from({ length: base * 2 }, (_, i) => `ok_${seed}_${i + 1}`),
      bad: Array.from({ length: Math.max(3, Math.floor(base / 3)) }, (_, i) => `bad_${seed}_${i + 1}`),
      common: Array.from({ length: base + 5 }, (_, i) => `com_${seed}_${i + 1}`),
    },
    timeline,
    activity,
  };
};
