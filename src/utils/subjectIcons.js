import {
  Calculator,
  Atom,
  Globe,
  BookOpen,
  Languages,
  Palette,
  Music,
  Code,
  Brain,
  FlaskConical,
  Dna,
  History,
  Users,
} from "lucide-react";

export const subjectIcons = {
  mathematics: { icon: Calculator, color: "from-blue-500 to-cyan-500", bg: "bg-blue-50" },
  math: { icon: Calculator, color: "from-blue-500 to-cyan-500", bg: "bg-blue-50" },
  science: { icon: Atom, color: "from-purple-500 to-pink-500", bg: "bg-purple-50" },
  physics: { icon: Atom, color: "from-indigo-500 to-purple-500", bg: "bg-indigo-50" },
  chemistry: { icon: FlaskConical, color: "from-green-500 to-emerald-500", bg: "bg-green-50" },
  biology: { icon: Dna, color: "from-teal-500 to-cyan-500", bg: "bg-teal-50" },
  english: { icon: BookOpen, color: "from-rose-500 to-pink-500", bg: "bg-orange-50" },
  language: { icon: Languages, color: "from-pink-500 to-rose-500", bg: "bg-pink-50" },
  history: { icon: History, color: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
  geography: { icon: Globe, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
  "social science": { icon: Users, color: "from-violet-500 to-purple-500", bg: "bg-violet-50" },
  art: { icon: Palette, color: "from-rose-500 to-pink-500", bg: "bg-rose-50" },
  music: { icon: Music, color: "from-fuchsia-500 to-purple-500", bg: "bg-fuchsia-50" },
  computer: { icon: Code, color: "from-slate-500 to-gray-500", bg: "bg-slate-50" },
  default: { icon: Brain, color: "from-purple-500 to-indigo-500", bg: "bg-purple-50" },
};

export const getSubjectIcon = (name = "") => {
  const lower = name.toLowerCase();
  if (subjectIcons[lower]) return subjectIcons[lower];

  for (const key in subjectIcons) {
    if (lower.includes(key)) return subjectIcons[key];
  }

  return subjectIcons.default;
};
