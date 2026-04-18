// utils/courseMeta.js

import {
  FaFlask,
  FaCalculator,
  FaBookOpen,
  FaGlobeAsia,
  FaBrain,
  FaCode,
  FaPalette,
  FaLanguage,
  FaFeatherAlt,
  FaLaptopCode,
  FaAtom,
  FaLeaf,
  FaHistory,
  FaLightbulb,
} from "react-icons/fa";

/* ---------------- ICON MAP ---------------- */

const iconMap = {
  science: FaFlask,
  physics: FaAtom,
  chemistry: FaFlask,
  biology: FaLeaf,
  mathematics: FaCalculator,
  math: FaCalculator,
  english: FaBookOpen,
  hindi: FaLanguage,
  sanskrit: FaFeatherAlt,
  socialscience: FaGlobeAsia,
  geography: FaGlobeAsia,
  history: FaHistory,
  civics: FaLightbulb,
  economics: FaBrain,
  computer: FaLaptopCode,
  "information technology": FaCode,
  art: FaPalette,
  drawing: FaPalette,
  gk: FaBrain,
  general: FaBrain,
  moral: FaLightbulb,
};

/* ---------------- GRADIENT MAP ---------------- */

const gradientMap = {
  science: "from-blue-400 to-cyan-500",
  physics: "from-indigo-400 to-purple-500",
  chemistry: "from-green-400 to-emerald-500",
  biology: "from-emerald-400 to-green-600",
  mathematics: "from-orange-400 to-red-500",
  math: "from-orange-400 to-red-500",
  english: "from-pink-400 to-rose-500",
  hindi: "from-amber-400 to-orange-500",
  sanskrit: "from-yellow-400 to-amber-500",
  socialscience: "from-teal-400 to-cyan-500",
  geography: "from-sky-400 to-blue-500",
  history: "from-violet-400 to-purple-500",
  civics: "from-fuchsia-400 to-pink-500",
  economics: "from-purple-400 to-indigo-500",
  computer: "from-cyan-400 to-blue-500",
  "information technology": "from-blue-500 to-indigo-600",
  art: "from-rose-400 to-pink-500",
  drawing: "from-pink-400 to-purple-500",
  gk: "from-indigo-400 to-blue-500",
  general: "from-slate-400 to-gray-500",
  moral: "from-lime-400 to-green-500",
};

/* ---------------- META HELPER ---------------- */

export const getCourseMeta = (courseName = "") => {
  const key = courseName.toLowerCase();

  const matchedKey = Object.keys(iconMap).find((k) =>
    key.includes(k)
  );

  return {
    Icon: matchedKey ? iconMap[matchedKey] : FaBookOpen,
    gradient: matchedKey
      ? gradientMap[matchedKey]
      : "from-purple-400 to-indigo-500",
  };
};
