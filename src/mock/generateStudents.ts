/* ================= BASIC HELPERS ================= */

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const pickRandom = <T,>(arr: T[], count: number) =>
  [...arr].sort(() => 0.5 - Math.random()).slice(0, count);

/* ================= NORMAL DISTRIBUTION ================= */

const normal = (mean: number, std: number) => {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/* ================= GRADE DIFFICULTY ================= */

const gradeDifficulty = (grade: number) => {
  if (grade <= 4) return 1.05;
  if (grade <= 7) return 1.0;
  if (grade <= 10) return 0.95;
  return 0.9;
};

/* ================= LEARNING STATES (NO RANKING) ================= */

type Tier =
  | "high_exposure"
  | "steady_progress"
  | "inconsistent"
  | "low_exposure"
  | "inactive";

const assignTier = (i: number, total: number): Tier => {
  const p = i / total;
  if (p < 0.06) return "high_exposure";
  if (p < 0.30) return "steady_progress";
  if (p < 0.70) return "inconsistent";
  if (p < 0.90) return "low_exposure";
  return "inactive";
};

const masteryFloorByTier: Record<Tier, number> = {
  high_exposure: 75,
  steady_progress: 60,
  inconsistent: 40,
  low_exposure: 25,
  inactive: 0,
};

/* ================= PROFILES ================= */

const profiles = ["strong", "average", "struggling", "inactive"] as const;
type Profile = typeof profiles[number];

/* ================= STAT GENERATOR ================= */

const generateStats = (
  profile: Profile,
  grade: number,
  tier: Tier
) => {
  if (tier === "inactive") {
    return {
      accuracy: rand(0, 10),
      coverage: rand(0, 10),
      avgScore: rand(0, 10),
      mastery: rand(0, 10),
      attendedTotal: rand(0, 20),
      totalCorrect: rand(0, 5),
      totalIncorrect: rand(0, 15),
      avgTime: 0,
      totalTime: 0,
    };
  }

  const difficulty = gradeDifficulty(grade);
  const floor = masteryFloorByTier[tier];

  const mastery = clamp(
    normal(floor + 8 * difficulty, 6),
    floor,
    90
  );

  const accuracy = clamp(
    normal(mastery + rand(-6, 6), 7),
    Math.max(20, floor - 10),
    98
  );

  const coverage = clamp(
    normal(mastery + rand(-5, 10), 8),
    Math.max(30, floor),
    100
  );

  const attendedTotal = Math.round(
    clamp(normal(450 * difficulty, 140), 50, 1200)
  );

  const totalCorrect = Math.round(attendedTotal * (accuracy / 100));
  const totalIncorrect = attendedTotal - totalCorrect;

  const avgTime = clamp(
    Math.round(normal(60 / difficulty, 12)),
    20,
    140
  );

  return {
    accuracy: Math.round(accuracy),
    coverage: Math.round(coverage),
    avgScore: Math.round(mastery),
    mastery: Math.round(mastery),
    attendedTotal,
    totalCorrect,
    totalIncorrect,
    avgTime,
    totalTime: attendedTotal * avgTime,
  };
};

/* ================= CURRICULUM ================= */

const SUBJECT_POOLS = {
  primary: ["Math", "EVS", "English", "GK", "Art", "Music"],
  middle: ["Math", "Science", "English", "History", "Geography", "Computer"],
  secondary: ["Physics", "Chemistry", "Biology", "Math", "History", "Geography"],
  senior: [
    "Physics",
    "Chemistry",
    "Math",
    "Biology",
    "Economics",
    "Computer Science",
  ],
};

const MODULE_TITLES: Record<string, string[]> = {
  Math: ["Number Systems", "Algebra", "Geometry", "Mensuration"],
  Science: ["Living World", "Matter", "Energy"],
  Physics: ["Motion", "Force", "Work & Energy", "Electricity"],
  Chemistry: ["Matter", "Atoms & Molecules", "Chemical Reactions"],
  Biology: ["Cell Biology", "Life Processes", "Genetics"],
  English: ["Grammar", "Literature", "Writing Skills"],
  EVS: ["Plants", "Animals", "Environment"],
  History: ["Ancient History", "Medieval History", "Modern History"],
  Geography: ["Earth", "Climate", "Resources"],
  Computer: ["Basics", "Programming", "Internet"],
  "Computer Science": ["Programming", "Data Structures", "Algorithms"],
  Economics: ["Microeconomics", "Macroeconomics"],
  GK: ["General Awareness", "Current Affairs"],
  Art: ["Drawing", "Painting"],
  Music: ["Rhythm", "Melody"],
};

const SUBMODULE_TITLES = [
  "Introduction",
  "Core Concepts",
  "Worked Examples",
  "Practice Problems",
  "Real Life Applications",
  "Common Mistakes",
  "Quick Revision",
  "Assessment",
];

const getSubjectPool = (grade: number) => {
  if (grade <= 4) return SUBJECT_POOLS.primary;
  if (grade <= 7) return SUBJECT_POOLS.middle;
  if (grade <= 10) return SUBJECT_POOLS.secondary;
  return SUBJECT_POOLS.senior;
};

/* ================= MAIN GENERATOR ================= */

export const generateDummyStudents = (count = 100) => {
  return Array.from({ length: count }, (_, i) => {
    const grade = (i % 12) + 1;
    const tier = assignTier(i, count);

    const profile: Profile =
      tier === "high_exposure" || tier === "steady_progress"
        ? "strong"
        : tier === "inconsistent"
        ? "average"
        : tier === "low_exposure"
        ? "struggling"
        : "inactive";

    /* -------- SUBJECTS -------- */
    const subjectPool = getSubjectPool(grade);
    const subjectCount = rand(3, Math.min(6, subjectPool.length));
    const selectedSubjects = pickRandom(subjectPool, subjectCount);

    const subjects = selectedSubjects.map((subject) => ({
      subjectName: subject,
      ...generateStats(profile, grade, tier),
    }));

    /* -------- MODULES -------- */
    const modules = selectedSubjects.map((subject) => {
      const moduleTitles = MODULE_TITLES[subject] || ["Fundamentals"];
      const moduleCount = rand(2, 3);
      const selectedModules = pickRandom(moduleTitles, moduleCount);

      return {
        groupName: subject,
        modules: selectedModules.map((m) => ({
          moduleName: m,
          ...generateStats(profile, grade, tier),
        })),
      };
    });

    /* -------- SUBMODULES -------- */
    const subModulesFlat = modules.flatMap((g) =>
      g.modules.flatMap((m) =>
        pickRandom(SUBMODULE_TITLES, rand(6, 8)).map((sm) => ({
          subModuleName: sm,
          ...generateStats(profile, grade, tier),
        }))
      )
    );

    return {
      userId: `dummy-${i + 1}`,
      name: `Student ${i + 1}`,
      profile,
      tier, // keep for internal analytics, do NOT show in UI

      overall: {
        stats: {
          ...generateStats(profile, grade, tier),
          grade,
        },
      },

      subjects: {
        grade,
        stats: subjects,
      },

      modules: {
        grade,
        stats: modules,
      },

      subModulesFlat: {
        grade,
        subModules: subModulesFlat,
      },
    };
  });
};
