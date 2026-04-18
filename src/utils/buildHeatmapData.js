export const buildHeatmapData = (subjects = []) => {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return { xLabels: [], yLabels: [], data: [] };
  }

  const xLabels = subjects.map((s) => s.subjectName || "Unknown");
  const yLabels = ["Accuracy", "Coverage", "Mastery", "Avg Score"];

  const clean = (value, attended) => {
    // No attempts → blank cell
    if (!attended || attended === 0) return null;

    // Remove % if backend sends "85%"
    if (typeof value === "string") {
      value = value.replace("%", "").trim();
    }

    const num = Number(value);

    return Number.isFinite(num) ? num : null;
  };

  const data = [
    subjects.map((s) => clean(s.accuracy, s.attendedTotal)),
    subjects.map((s) => clean(s.coverage, s.attendedTotal)),
    subjects.map((s) => clean(s.mastery, s.attendedTotal)),
    subjects.map((s) => clean(s.avgScore, s.attendedTotal)),
  ];

  return { xLabels, yLabels, data };
};
