export const getDifficultyConfig = (difficulty = "") => {
  const configs = {
    easy: { color: "bg-green-500", text: "text-green-700", border: "border-green-200", icon: "🟢" },
    medium: { color: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-200", icon: "🟡" },
    hard: { color: "bg-red-500", text: "text-red-700", border: "border-red-200", icon: "🔴" },
  };

  return configs[difficulty.toLowerCase()] || configs.medium;
};
