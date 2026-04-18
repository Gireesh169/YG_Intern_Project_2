// supabaseService.js
import { supabase } from "../config/supabase";
import lightImageChapter from "../mock/light_image_chapter.json";


// Base URL for Supabase Edge Functions
const EDGE_FUNCTION_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// In-memory caches (REMOVED)


// Small helper to build a controlled Error from edge function response
function buildEdgeError(status, parsed = {}) {
  const err = new Error(parsed.error || parsed.message || `Edge function failed (${status})`);
  err.status = status;
  err.payload = parsed;
  return err;
}

function isUnsupportedJwtAlgorithmError(errOrPayload) {
  const text = typeof errOrPayload === "string"
    ? errOrPayload
    : JSON.stringify(errOrPayload || {});
  return /unsupported\s+jwt\s+algorithm\s+es256/i.test(text);
}

function isMissingAuthorizationHeaderError(errOrPayload) {
  const text = typeof errOrPayload === "string"
    ? errOrPayload
    : JSON.stringify(errOrPayload || {});
  return /missing\s+authorization\s+header/i.test(text);
}

function isAuthJwtCompatibilityError(errOrPayload) {
  const text = typeof errOrPayload === "string"
    ? errOrPayload
    : JSON.stringify(errOrPayload || {});
  return /unsupported\s+jwt\s+algorithm\s+es256|unauthorized_unsupported_token_algorithm/i.test(text);
}

async function fetchCourseDetailsDirect(courseNameOrId) {
  const courseIdLike = String(courseNameOrId);
  const subjectQueries = [
    supabase.from("subjects").select("*").eq("id", courseNameOrId).maybeSingle(),
    supabase.from("subjects").select("*").ilike("name", courseIdLike).maybeSingle(),
  ];

  let subjectRow = null;
  let subjectError = null;

  for (const query of subjectQueries) {
    const { data, error } = await query;
    if (!error && data) {
      subjectRow = data;
      break;
    }
    subjectError = error;
  }

  if (!subjectRow) {
    throw subjectError || new Error("Subject not found");
  }

  const moduleFkColumns = ["subject_id", "subjectId", "subject", "parentSubjectId"];
  let modulesData = null;
  let modulesError = null;

  for (const column of moduleFkColumns) {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq(column, subjectRow.id)
      .order("id", { ascending: true });

    if (error) {
      modulesError = error;
      continue;
    }

    if (data && data.length > 0) {
      modulesData = data;
      break;
    }

    if (!modulesData) {
      modulesData = data || [];
    }
  }

  if (!modulesData && modulesError) throw modulesError;

  const modulesWithSubmodules = await Promise.all(
    (modulesData || []).map(async (moduleRow) => {
      const subModuleFkColumns = ["module_id", "moduleId", "module", "chapterId", "parentModuleId"];
      let subModulesData = null;
      let subModulesError = null;

      for (const column of subModuleFkColumns) {
        const { data, error } = await supabase
          .from("sub_modules")
          .select("*")
          .eq(column, moduleRow.id)
          .order("id", { ascending: true });

        if (error) {
          subModulesError = error;
          continue;
        }

        if (data && data.length > 0) {
          subModulesData = data;
          break;
        }

        if (!subModulesData) {
          subModulesData = data || [];
        }
      }

      if (!subModulesData && subModulesError) throw subModulesError;

      const normalizedSubModules = (subModulesData || []).map((subModuleRow) => ({
        ...subModuleRow,
        id: subModuleRow.id ?? subModuleRow.subModuleId ?? subModuleRow.sub_module_id,
        subModuleId: subModuleRow.subModuleId ?? subModuleRow.sub_module_id ?? subModuleRow.id,
        moduleId: subModuleRow.moduleId ?? subModuleRow.module_id ?? moduleRow.id,
        isActive: subModuleRow.isActive ?? subModuleRow.is_active ?? false,
        isPro: subModuleRow.isPro ?? subModuleRow.is_pro ?? false,
        questionCount:
          subModuleRow.questionCount ??
          subModuleRow.totalQuestions ??
          subModuleRow.questions_count ??
          subModuleRow.questionsCount ??
          0,
      }));

      return {
        ...moduleRow,
        id: moduleRow.id ?? moduleRow.moduleId ?? moduleRow.module_id,
        moduleId: moduleRow.moduleId ?? moduleRow.module_id ?? moduleRow.id,
        subjectId: moduleRow.subjectId ?? moduleRow.subject_id ?? subjectRow.id,
        isActive: moduleRow.isActive ?? moduleRow.is_active ?? false,
        totalSubModules:
          moduleRow.totalSubModules ??
          moduleRow.total_submodules ??
          normalizedSubModules.length,
        subModules: normalizedSubModules,
      };
    }),
  );

  return {
    subject: subjectRow,
    modules: modulesWithSubmodules,
    totalModules: modulesWithSubmodules.length,
    fallback: true,
  };
}

// Wrapper to call edge functions with consistent error handling & logging
async function callEdgeFunction(
  path,
  { method = "POST", body = null, searchParams = {} } = {},
  accessToken,
  canRetryWithoutAuth = true,
) {
  const url = new URL(`${EDGE_FUNCTION_BASE_URL}/${path}`);
  Object.entries(searchParams || {}).forEach(([k, v]) => {
    // append only defined values (convert booleans to strings)
    if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
  });

  const headers = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const opts = {
    method,
    headers,
  };

  if (body && method.toUpperCase() !== "GET") opts.body = JSON.stringify(body);

  const res = await fetch(url.toString(), opts);

  // try parse as json, otherwise fallback to text (useful for 404/html responses)
  let parsed = null;
  let text = null;
  try {
    parsed = await res.json();
  } catch (e) {
    try { text = await res.text(); } catch (e2) { text = null; }
  }

  if (!res.ok) {
    // include server text when JSON absent to help debugging
    const payload = parsed || (text ? { text } : { status: res.statusText, status: res.status });
    if (accessToken && canRetryWithoutAuth && isUnsupportedJwtAlgorithmError(payload)) {
      return callEdgeFunction(path, { method, body, searchParams }, null, false);
    }
    if (isUnsupportedJwtAlgorithmError(payload) || isMissingAuthorizationHeaderError(payload)) {
      // Let callers handle expected auth-shape failures via their fallback logic.
      throw buildEdgeError(res.status, payload);
    }
    console.error("[callEdgeFunction] error response:", url.toString(), payload);
    throw buildEdgeError(res.status, payload);
  }

  return parsed;
}

function createEmptyCanonicalAnalytics(raw = {}) {
  return {
    overall: {
      stats: {
        grade: null,
        avgTime: 0,
        totalTime: 0,
        totalCorrect: 0,
        attendedTotal: 0,
        avgTimeUnique: 0,
        totalIncorrect: 0,
        totalTimeUnique: 0,
        totalCorrectUnique: 0,
        totalUniqueAttended: 0,
        totalIncorrectUnique: 0,
        totalUniqueQuestions: 0,
        coverage: 0,
        mastery: 0,
        accuracy: 0,
        finalAccuracy: 0,
        avgScore: 0,
      },
    },
    subjects: [],
    subjectsMeta: { grade: null, stats: [] },
    modules: [],
    modulesMeta: { grade: null, stats: [] },
    subModulesFlat: { grade: null, subModules: [] },
    raw,
    fallback: true,
  };
}

function fetchAnalyticsFromLocalStorage(scopeId = null) {
  if (typeof window === "undefined") return createEmptyCanonicalAnalytics({ source: "local-empty" });

  let questionAnswers = [];
  try {
    questionAnswers = JSON.parse(localStorage.getItem("lastQuizQuestionAnswers") || "[]");
  } catch {
    questionAnswers = [];
  }

  if (!Array.isArray(questionAnswers) || questionAnswers.length === 0) {
    return createEmptyCanonicalAnalytics({ source: "local-empty" });
  }

  const rows = questionAnswers
    .filter((a) => a && (a.questionId != null || a.question_id != null))
    .map((a) => ({
      question_id: a.questionId ?? a.question_id,
      is_correct: a.isCorrect === true,
      time_spent: Number(a.timeSpent ?? a.time_spent ?? 0),
      created_at: a.timestamp ?? new Date().toISOString(),
    }));

  if (!rows.length) return createEmptyCanonicalAnalytics({ source: "local-empty" });

  const totalQuestions = rows.length;
  const totalCorrect = rows.filter((r) => r.is_correct === true).length;
  const totalIncorrect = rows.filter((r) => r.is_correct === false).length;
  const totalTime = rows.reduce((sum, r) => sum + Number(r.time_spent || 0), 0);
  const avgTime = totalQuestions ? totalTime / totalQuestions : 0;

  const uniqueMap = new Map();
  rows.forEach((r) => {
    const id = String(r.question_id);
    if (!uniqueMap.has(id)) uniqueMap.set(id, []);
    uniqueMap.get(id).push(r);
  });
  const totalUniqueAttended = uniqueMap.size;
  let totalCorrectUnique = 0;
  uniqueMap.forEach((attempts) => {
    if (attempts.some((a) => a.is_correct === true)) totalCorrectUnique += 1;
  });
  const totalIncorrectUnique = Math.max(totalUniqueAttended - totalCorrectUnique, 0);

  const byDate = {};
  rows.forEach((r) => {
    const day = String(r.created_at || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    if (!byDate[day]) {
      byDate[day] = {
        correctAnswers: 0,
        incorrectAnswers: 0,
        attempted: 0,
        totalQuestions: 0,
      };
    }
    byDate[day].attempted += 1;
    byDate[day].totalQuestions += 1;
    if (r.is_correct === true) byDate[day].correctAnswers += 1;
    if (r.is_correct === false) byDate[day].incorrectAnswers += 1;
  });

  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    overall: {
      stats: {
        grade: null,
        avgTime,
        totalTime,
        totalCorrect,
        attendedTotal: totalQuestions,
        avgTimeUnique: totalUniqueAttended ? totalTime / totalUniqueAttended : 0,
        totalIncorrect,
        totalTimeUnique: totalTime,
        totalCorrectUnique,
        totalUniqueAttended,
        totalIncorrectUnique,
        totalUniqueQuestions: totalUniqueAttended,
        coverage: 0,
        mastery: accuracy,
        accuracy,
        finalAccuracy: accuracy,
        avgScore: accuracy,
      },
    },
    subjects: [],
    subjectsMeta: { grade: null, stats: [] },
    modules: [],
    modulesMeta: { grade: null, stats: [] },
    subModulesFlat: { grade: null, subModules: [] },
    raw: {
      source: "local-storage",
      byDate,
      questionAnswers,
      scopeId: scopeId ?? null,
    },
    fallback: true,
  };
}

async function fetchAnalyticsDirectFromDb(googleId, scopeId = null) {
  if (!googleId) return createEmptyCanonicalAnalytics({ error: "missing_google_id", source: "direct-db" });

  const { data: userQas, error: qaError } = await supabase
    .from("user_qas")
    .select("question_id, is_correct, time_spent, created_at")
    .eq("google_id", googleId)
    .order("created_at", { ascending: true })
    .limit(5000);

  if (qaError) {
    return createEmptyCanonicalAnalytics({ error: qaError.message || qaError, source: "direct-db" });
  }

  if (!Array.isArray(userQas) || userQas.length === 0) {
    return createEmptyCanonicalAnalytics({ source: "direct-db-empty" });
  }

  const questionIds = [...new Set(userQas.map((r) => r.question_id).filter(Boolean))];
  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("id, question_text, sub_module_id, submodule_id, subModuleId, chapter_id, chapterId")
    .in("id", questionIds);

  if (qError) {
    return createEmptyCanonicalAnalytics({ error: qError.message || qError, source: "direct-db" });
  }

  const questionMap = new Map((questions || []).map((q) => [String(q.id), q]));

  const getSubModuleId = (q) =>
    q?.sub_module_id ?? q?.submodule_id ?? q?.subModuleId ?? q?.chapter_id ?? q?.chapterId ?? null;

  const subModuleIds = [...new Set((questions || []).map(getSubModuleId).filter(Boolean))];
  let subModules = [];
  if (subModuleIds.length) {
    const { data } = await supabase
      .from("sub_modules")
      .select("id, name, module_id, moduleId")
      .in("id", subModuleIds);
    subModules = data || [];
  }
  const subModuleMap = new Map(subModules.map((s) => [String(s.id), s]));

  const moduleIds = [...new Set(subModules.map((s) => s.module_id ?? s.moduleId).filter(Boolean))];
  let modules = [];
  if (moduleIds.length) {
    const { data } = await supabase
      .from("modules")
      .select("id, name, subject_id, subjectId")
      .in("id", moduleIds);
    modules = data || [];
  }
  const moduleMap = new Map(modules.map((m) => [String(m.id), m]));

  const subjectIds = [...new Set(modules.map((m) => m.subject_id ?? m.subjectId).filter(Boolean))];
  let subjects = [];
  if (subjectIds.length) {
    const { data } = await supabase
      .from("subjects")
      .select("id, name, grade")
      .in("id", subjectIds);
    subjects = data || [];
  }
  const subjectMap = new Map(subjects.map((s) => [String(s.id), s]));

  const scopedRows = userQas.filter((row) => {
    if (!scopeId) return true;
    const q = questionMap.get(String(row.question_id));
    const subId = getSubModuleId(q);
    return String(subId) === String(scopeId);
  });

  const rows = scopedRows.length ? scopedRows : userQas;

  const totalQuestions = rows.length;
  const totalCorrect = rows.filter((r) => r.is_correct === true).length;
  const totalIncorrect = rows.filter((r) => r.is_correct === false).length;
  const totalTime = rows.reduce((sum, r) => sum + Number(r.time_spent || 0), 0);
  const avgTime = totalQuestions ? totalTime / totalQuestions : 0;

  const questionAttemptMap = new Map();
  rows.forEach((r) => {
    const qid = String(r.question_id);
    if (!questionAttemptMap.has(qid)) questionAttemptMap.set(qid, []);
    questionAttemptMap.get(qid).push(r);
  });
  const totalUniqueAttended = questionAttemptMap.size;
  let totalCorrectUnique = 0;
  questionAttemptMap.forEach((attempts) => {
    if (attempts.some((a) => a.is_correct === true)) totalCorrectUnique += 1;
  });
  const totalIncorrectUnique = Math.max(totalUniqueAttended - totalCorrectUnique, 0);

  const byDate = {};
  rows.forEach((r) => {
    const day = String(r.created_at || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    if (!byDate[day]) {
      byDate[day] = {
        correctAnswers: 0,
        incorrectAnswers: 0,
        attempted: 0,
        totalQuestions: 0,
      };
    }
    byDate[day].attempted += 1;
    byDate[day].totalQuestions += 1;
    if (r.is_correct === true) byDate[day].correctAnswers += 1;
    if (r.is_correct === false) byDate[day].incorrectAnswers += 1;
  });

  const subjectAgg = new Map();
  const moduleAgg = new Map();
  const subAgg = new Map();

  const bumpAgg = (map, key, seed, row) => {
    if (!map.has(key)) map.set(key, { ...seed, _qidSet: new Set(), _qidCorrectSet: new Set() });
    const a = map.get(key);
    a.totalQuestions += 1;
    a.totalTime += Number(row.time_spent || 0);
    if (row.is_correct === true) a.totalCorrect += 1;
    if (row.is_correct === false) a.totalIncorrect += 1;
    const qid = String(row.question_id);
    a._qidSet.add(qid);
    if (row.is_correct === true) a._qidCorrectSet.add(qid);
  };

  rows.forEach((row) => {
    const q = questionMap.get(String(row.question_id));
    const subId = getSubModuleId(q);
    const sub = subId != null ? subModuleMap.get(String(subId)) : null;
    const modId = sub?.module_id ?? sub?.moduleId ?? null;
    const mod = modId != null ? moduleMap.get(String(modId)) : null;
    const subjId = mod?.subject_id ?? mod?.subjectId ?? null;
    const subj = subjId != null ? subjectMap.get(String(subjId)) : null;

    bumpAgg(
      subAgg,
      String(subId ?? "unknown"),
      {
        subModuleId: subId,
        subModuleName: sub?.name ?? `Submodule ${subId ?? "Unknown"}`,
        moduleId: modId,
        moduleName: mod?.name ?? "",
        subjectId: subjId,
        subjectName: subj?.name ?? "",
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalTime: 0,
      },
      row,
    );

    bumpAgg(
      moduleAgg,
      String(modId ?? "unknown"),
      {
        moduleId: modId,
        moduleName: mod?.name ?? `Module ${modId ?? "Unknown"}`,
        subjectId: subjId,
        subjectName: subj?.name ?? "",
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalTime: 0,
      },
      row,
    );

    bumpAgg(
      subjectAgg,
      String(subjId ?? "unknown"),
      {
        subjectId: subjId,
        subjectName: subj?.name ?? `Subject ${subjId ?? "Unknown"}`,
        grade: subj?.grade ?? null,
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalTime: 0,
      },
      row,
    );
  });

  const finalizeAgg = (arr) =>
    arr.map((a) => {
      const uniqueAttended = a._qidSet.size;
      const uniqueCorrect = a._qidCorrectSet.size;
      const uniqueIncorrect = Math.max(uniqueAttended - uniqueCorrect, 0);
      return {
        ...a,
        attendedTotal: a.totalQuestions,
        totalUniqueAttended: uniqueAttended,
        totalCorrectUnique: uniqueCorrect,
        totalIncorrectUnique: uniqueIncorrect,
        avgTime: a.totalQuestions ? a.totalTime / a.totalQuestions : 0,
      };
    });

  const subModulesFlat = finalizeAgg(Array.from(subAgg.values()));
  const modulesFinalFlat = finalizeAgg(Array.from(moduleAgg.values()));
  const subjectsFinal = finalizeAgg(Array.from(subjectAgg.values()));

  const modulesBySubject = subjectsFinal.map((s) => ({
    subjectId: s.subjectId,
    subjectName: s.subjectName,
    modules: modulesFinalFlat.filter((m) => String(m.subjectId) === String(s.subjectId)),
  }));

  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    overall: {
      stats: {
        grade: subjectsFinal.find((s) => s.grade != null)?.grade ?? null,
        avgTime,
        totalTime,
        totalCorrect,
        attendedTotal: totalQuestions,
        avgTimeUnique: totalUniqueAttended ? totalTime / totalUniqueAttended : 0,
        totalIncorrect,
        totalTimeUnique: totalTime,
        totalCorrectUnique,
        totalUniqueAttended,
        totalIncorrectUnique,
        totalUniqueQuestions: totalUniqueAttended,
        coverage: 0,
        mastery: accuracy,
        accuracy,
        finalAccuracy: accuracy,
        avgScore: accuracy,
      },
    },
    subjects: subjectsFinal,
    subjectsMeta: { grade: subjectsFinal.find((s) => s.grade != null)?.grade ?? null, stats: subjectsFinal },
    modules: modulesBySubject,
    modulesMeta: { grade: subjectsFinal.find((s) => s.grade != null)?.grade ?? null, stats: modulesBySubject },
    subModulesFlat: { grade: subjectsFinal.find((s) => s.grade != null)?.grade ?? null, subModules: subModulesFlat },
    raw: {
      source: "direct-db",
      byDate,
      subjects: subjectsFinal,
      modules: modulesBySubject,
      subModulesFlat,
      questionAnswers: rows,
    },
    fallback: true,
  };
}

export const supabaseService = {
  // ---------------- Helper / misc ----------------

  async updateUserGrade(grade) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    try {
      const res = await callEdgeFunction("update_grade", { body: { grade } }, accessToken, false);
      return res;
    } catch (err) {
      // Edge function may reject ES256 tokens. Keep UX working by syncing grade to auth metadata.
      if (
        !isUnsupportedJwtAlgorithmError(err?.payload || err?.message || "") &&
        !isMissingAuthorizationHeaderError(err?.payload || err?.message || "")
      ) {
        throw err;
      }

      const { data, error } = await supabase.auth.updateUser({
        data: { grade },
      });

      if (error) throw error;

      return {
        user: {
          id: data?.user?.id,
          grade: data?.user?.user_metadata?.grade ?? grade,
        },
        fallback: true,
      };
    }
  },

  async getGoogleId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return user.user_metadata?.sub || user.user_metadata?.provider_id || user.email || user.id;
  },

  // ==========================================
  // SUBJECTS
  // ==========================================
  async getSubjects_Ori(search = "", includeDisabled = false) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("User not logged in");

      const result = await callEdgeFunction(
        "subjects_list",
        { method: "GET", searchParams: { search, includeDisabled } },
        accessToken
      );

      return {
        subjects: result.subjects || [],
        totalSubjects: result.totalSubjects || 0,
      };
    } catch (error) {
      console.error("Error fetching subjects:", error.message || error);
      throw error;
    }
  },

  // supabaseService.js — final getSubjects
  // async getSubjects(search = "", includeDisabled = false, isActive = null) {
  //   // Cache logic removed

  //   const { data: sessionData } = await supabase.auth.getSession();
  //   const accessToken = sessionData?.session?.access_token;
  //   if (!accessToken) throw new Error("User not logged in");

  //   const searchParams = {};
  //   if (search) searchParams.search = search;
  //   if (includeDisabled !== null) searchParams.includeDisabled = includeDisabled;
  //   if (isActive !== null) searchParams.isActive = isActive;

  //   const endpoint = search ? "subjects_list" : "subjects_list_by_grade";
  //   const result = await callEdgeFunction(endpoint, { method: "GET", searchParams }, accessToken);

  //   const response = {
  //     grade: result.grade ?? null,
  //     subjects: result.subjects ?? [],
  //     totalSubjects: result.totalSubjects ?? result.subjects?.length ?? 0,
  //   };

  //   return response;
  // },

  async getSubjects(search = "", includeDisabled = false, gradeOrIsActive = null) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("User not logged in");

  let grade = null;
  let isActive = null;
  if (typeof gradeOrIsActive === "boolean") {
    // Backward compatibility for older callers that used the third arg as isActive.
    isActive = gradeOrIsActive;
  } else {
    grade = gradeOrIsActive;
  }

  const searchParams = {};
  if (search) searchParams.search = search;
  if (includeDisabled !== null) searchParams.includeDisabled = includeDisabled;
  if (isActive !== null) searchParams.isActive = isActive;
  if (grade !== null && grade !== undefined && grade !== "") searchParams.grade = grade;

  const endpoint = search ? "subjects_list" : "subjects_list_by_grade";
  try {
    const result = await callEdgeFunction(endpoint, { method: "GET", searchParams }, accessToken, false);

    return {
      grade: result.grade ?? grade ?? null,
      subjects: result.subjects ?? [],
      totalSubjects: result.totalSubjects ?? result.subjects?.length ?? 0,
    };
  } catch (err) {
    if (
      isUnsupportedJwtAlgorithmError(err?.payload || err?.message || "") ||
      isMissingAuthorizationHeaderError(err?.payload || err?.message || "")
    ) {
      const direct = await this.getSubjectsDirect(search, includeDisabled, grade);
      return {
        grade,
        subjects: direct.subjects ?? [],
        totalSubjects: direct.totalSubjects ?? 0,
        fallback: true,
      };
    }
    throw err;
  }
},

  // Direct DB fallback for subjects
  async getSubjectsDirect(search = "", includeDisabled = false, grade = null) {
    try {
      let q = supabase.from("subjects").select("*");

      if (search && String(search).trim() !== "") {
        q = q.ilike("name", `%${search}%`);
      }

      if (!includeDisabled) {
        q = q.eq("is_active", true);
      }

      if (grade !== null && grade !== undefined && String(grade).trim() !== "") {
        q = q.eq("grade", Number(grade));
      }

      const res = await q.order("id", { ascending: true });

      if (res.error) {
        console.error("getSubjectsDirect error:", res.error);
        throw res.error;
      }

      return {
        subjects: res.data ?? [],
        totalSubjects: Array.isArray(res.data) ? res.data.length : 0,
      };
    } catch (err) {
      console.error("getSubjectsDirect failed:", err);
      throw err;
    }
  },

  // ==========================================
  // COURSES (Subjects with Modules)
  // ==========================================
  // async getCourseDetails(courseNameOrId, includeDisabled = false, isActive = null) {
  //   if (!courseNameOrId) throw new Error("courseName or courseId is required");

  //   const courseNameParam = typeof courseNameOrId === "string" ? courseNameOrId : String(courseNameOrId);

  //   const { data: sessionData } = await supabase.auth.getSession();
  //   const accessToken = sessionData?.session?.access_token;
  //   if (!accessToken) throw new Error("User not logged in");

  //   const candidateFunctions = [
  //     "getCourseDetails",
  //     "get_course_details",
  //     "course_details",
  //     "get_course_details_by_name",
  //     "getcoursedetails",
  //   ];

  //   const searchParams = { courseName: courseNameParam };
  //   if (includeDisabled !== undefined && includeDisabled !== null) searchParams.includeDisabled = String(includeDisabled);
  //   if (isActive !== undefined && isActive !== null) searchParams.isActive = String(isActive);

  //   let lastError = null;
  //   for (const fn of candidateFunctions) {
  //     try {
  //       const res = await callEdgeFunction(fn, { method: "GET", searchParams }, accessToken);
  //       return res;
  //     } catch (err) {
  //       lastError = err;
  //       console.warn(`[getCourseDetails] attempt "${fn}" failed:`, err?.message || err, err?.payload ?? "");
  //     }
  //   }

  //   const msg = `getCourseDetails: no deployed edge function matched. Tried: ${candidateFunctions.join(
  //     ", "
  //   )}. Last error: ${lastError?.message ?? JSON.stringify(lastError?.payload ?? lastError)}`;
  //   const e = new Error(msg);
  //   e.payload = lastError?.payload ?? lastError;
  //   throw e;
  // },



  
async getCourseDetails(courseNameOrId, includeDisabled = false, grade = null) {
  if (!courseNameOrId) throw new Error("courseName or courseId is required");

  // Fast path: direct DB read avoids slow sequential edge-function probing.
  try {
    return await fetchCourseDetailsDirect(courseNameOrId);
  } catch (directErr) {
    // Fall through to edge functions for environments where direct DB reads are restricted.
  }

  const courseNameParam = typeof courseNameOrId === "string" ? courseNameOrId : String(courseNameOrId);

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("User not logged in");

  const candidateFunctions = [
    "getCourseDetails",
    "get_course_details",
    "course_details",
    "get_course_details_by_name",
    "getcoursedetails",
  ];

  const searchParams = { courseName: courseNameParam };
  if (includeDisabled !== undefined && includeDisabled !== null) searchParams.includeDisabled = String(includeDisabled);
  if (grade !== undefined && grade !== null) searchParams.grade = String(grade); // ✅ Add grade parameter

  let lastError = null;
  for (const fn of candidateFunctions) {
    try {
      const res = await callEdgeFunction(fn, { method: "GET", searchParams }, accessToken);
      return res;
    } catch (err) {
      lastError = err;

      if (isAuthJwtCompatibilityError(err?.payload || err?.message || "") || isMissingAuthorizationHeaderError(err?.payload || err?.message || "")) {
        break;
      }
    }
  }

  const msg = `getCourseDetails: no deployed edge function matched. Tried: ${candidateFunctions.join(
    ", "
  )}. Last error: ${lastError?.message ?? JSON.stringify(lastError?.payload ?? lastError)}`;
  const e = new Error(msg);
  e.payload = lastError?.payload ?? lastError;
  throw e;
},




  // ==========================================
  // SUB-MODULES
  // ==========================================
  async getSubModules(moduleId, includeDisabled = false) {
    // Cache logic removed

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const subModuleFkColumns = ["module_id", "moduleId", "module", "chapterId", "parentModuleId"];

    for (const column of subModuleFkColumns) {
      const { data, error } = await supabase
        .from("sub_modules")
        .select("*")
        .eq(column, moduleId)
        .order("id", { ascending: true });

      if (error) continue;

      const normalized = (data || []).map((s) => ({
        ...s,
        id: s.id ?? s.subModuleId ?? s.sub_module_id,
        subModuleId: s.subModuleId ?? s.sub_module_id ?? s.id,
        moduleId: s.moduleId ?? s.module_id ?? moduleId,
        isActive: s.isActive ?? s.is_active ?? false,
        isPro: s.isPro ?? s.is_pro ?? false,
        questionCount:
          s.questionCount ??
          s.totalQuestions ??
          s.questions_count ??
          s.questionsCount ??
          0,
      }));

      return {
        subModules: includeDisabled ? normalized : normalized.filter((s) => s.isActive),
        totalSubModules: includeDisabled ? normalized.length : normalized.filter((s) => s.isActive).length,
        fallback: true,
      };
    }

    const result = await callEdgeFunction(
      "get_submodules",
      { method: "GET", searchParams: { moduleId, includeDisabled } },
      accessToken
    );

    const response = {
      subModules: (result.subModules || []).map((s) => ({
        ...s,
        id: s.id ?? s.subModuleId ?? s.sub_module_id,
        subModuleId: s.subModuleId ?? s.sub_module_id ?? s.id,
        moduleId: s.moduleId ?? s.module_id ?? moduleId,
        isActive: s.isActive ?? s.is_active ?? false,
        isPro: s.isPro ?? s.is_pro ?? false,
        questionCount:
          s.questionCount ??
          s.totalQuestions ??
          s.questions_count ??
          s.questionsCount ??
          0,
      })),
      totalSubModules: result.totalSubModules || result.subModules?.length || 0,
    };

    return response;
  },




  // --- FRONTEND ONLY FIX: call the new questions table directly ---
  // Replace your existing getSubModuleWithQuestions with this function
  async getSubModuleWithQuestions(subModuleId) {
    if (subModuleId === "light-image-chapter") {
      return {
        submodule: {
          id: "light-image-chapter",
          name: "Light – Image Based Questions"
        },
        questions: lightImageChapter.questions,
        _meta: { source: "mock-json" }
      };
    }
    if (!subModuleId) throw new Error("SubModule ID is required");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;


    // 1️⃣ Try edge function (unchanged)
    try {
      const result = await callEdgeFunction(
        "get_submodule_with_questions",
        { body: { subModuleId } },
        accessToken
      );

      return {
        submodule: result.submodule ?? null,
        questions: result.questions ?? [],
        _meta: { source: "edge-function" },
      };
    } catch (err) {
      console.warn("Edge failed, falling back to direct DB");
    }

    // 2️⃣ Try REAL FK columns (THIS WAS MISSING)
    const FK_COLUMNS = [
      "sub_module_id",
      "submodule_id",
      "subModuleId",
      "chapter_id",
      "chapterId"
    ];

    for (const col of FK_COLUMNS) {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq(col, subModuleId);

      if (!error && data?.length > 0) {
        return {
          submodule: null,
          questions: data || [],
          _meta: { source: `questions.${col}` },
        };
      }
    }

    // 3️⃣ FINAL fallback (client-side filter)
    const { data: all, error } = await supabase
      .from("questions")
      .select("*")
      .limit(1000);

    if (error) throw error;

    const matches = (all || []).filter((q) => {
      const qSubId = q.sub_module_id ?? q.submodule_id ?? q.subModuleId ?? q.chapter_id ?? q.chapterId;
      return String(qSubId) === String(subModuleId);
    });

    return {
      submodule: null,
      questions: matches,
      _meta: { source: "client-filter" },
    };
  },


  // ==========================================
  // QUESTIONS
  // ==========================================
  async getQuestions(subModuleId, difficulty = null) {
    if (!subModuleId) throw new Error("SubModule ID is required");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const result = await callEdgeFunction("get_questions", { body: { subModuleId, difficulty } }, accessToken);

    return {
      questions: result.questions || [],
      totalQuestions: result.totalQuestions || 0,
    };
  },

  async getAutoQuiz(submoduleIds) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    console.debug("[getAutoQuiz] Requesting auto quiz for:", submoduleIds);

    const directDbFallback = async () => {
      const ids = (submoduleIds || []).map((x) => String(x));
      if (!ids.length) return [];

      const FK_COLUMNS = ["sub_module_id", "submodule_id", "subModuleId", "chapter_id", "chapterId"];
      const byId = new Map();

      for (const col of FK_COLUMNS) {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .in(col, ids);

        if (error) continue;

        (data || []).forEach((q) => {
          if (q?.id == null) return;
          byId.set(String(q.id), q);
        });

        if (byId.size > 0) {
          return Array.from(byId.values());
        }
      }

      return [];
    };

    try {
      if (!accessToken) {
        const fallbackNoAuth = await directDbFallback();
        return fallbackNoAuth;
      }

      const result = await callEdgeFunction("auto_quiz", {
        method: "POST",
        body: { subModuleIds: submoduleIds },
      }, accessToken);

      console.debug("[getAutoQuiz] Result:", result);

      let allQuestions = [];

      // 1. ✅ NEW: { submodule: { questions: [] } } (singular - matches your BE response)
      if (result?.submodule?.questions && Array.isArray(result.submodule.questions)) {
        allQuestions = result.submodule.questions;
      }
      // 2. { submodules: [ { questions: [] }, ... ] } (plural nested)
      else if (result && Array.isArray(result.submodules)) {
        allQuestions = result.submodules.flatMap(sm => Array.isArray(sm.questions) ? sm.questions : []);
      }
      // 3. { questions: [] } (flat)
      else if (result && Array.isArray(result.questions)) {
        allQuestions = result.questions;
      }
      // 4. result is array itself
      else if (Array.isArray(result)) {
        allQuestions = result;
      }

      if (allQuestions.length === 0) {
        console.warn("[getAutoQuiz] No questions found in response. Raw result:", result);
        return [];
      }

      return allQuestions;
    } catch (err) {
      console.error("[getAutoQuiz] Error:", err);
      const fallback = await directDbFallback();
      return fallback;
    }
  },



  // ==========================================
  // ANALYTICS
  // ==========================================
  async submitAnalytics(analyticsData) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const persistDirectlyToUserQas = async () => {
      const answers = Array.isArray(analyticsData?.questionAnswers)
        ? analyticsData.questionAnswers
        : [];

      const serializeUserAnswer = (value) => {
        if (value === undefined || value === null) return null;
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean") return String(value);
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const rows = answers
        .filter((a) => a?.questionId != null)
        .map((a) => ({
          google_id: analyticsData?.googleId ?? null,
          question_id: a.questionId,
          user_answer: serializeUserAnswer(a.userAnswer),
          is_correct: !!a.isCorrect,
          time_spent: Number(a.timeSpent ?? 0),
        }));

      if (!rows.length) {
        return { data: [], fallback: true, reason: "no_rows" };
      }

      const { data, error } = await supabase.from("user_qas").insert(rows).select();
      if (error) {
        console.warn("[submitAnalytics] direct user_qas insert failed:", error?.message || error);
        return {
          data: [],
          fallback: true,
          reason: "direct_insert_failed",
          error: error?.message || "direct_insert_failed",
        };
      }

      return { data: data || [], fallback: true, reason: "direct_insert" };
    };

    if (!accessToken) {
      return persistDirectlyToUserQas();
    }

    try {
      const result = await callEdgeFunction("user_qas", { body: analyticsData }, accessToken);
      return result.data?.[0] ?? result;
    } catch (err) {
      if (
        isAuthJwtCompatibilityError(err?.payload || err?.message || "") ||
        isMissingAuthorizationHeaderError(err?.payload || err?.message || "")
      ) {
        return persistDirectlyToUserQas();
      }
      throw err;
    }
  },

  // Legacy small helper left as-is (kept for compatibility)
  async getAnalytics_prev(googleId, subModuleId = null) {
    if (!googleId) throw new Error("Google ID is required");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const result = await callEdgeFunction("get_analytics", { body: { googleId, subModuleId } }, accessToken);

    if (result.responseData) {
      console.group("Analytics ResponseData");
      console.log("Stats:", result.responseData.stats);
      console.log("By Date:", result.responseData.byDate);
      console.log("By Submodule:", result.responseData.bySubmodule);
      console.log("By Module:", result.responseData.byModule);
      console.log("By Subject:", result.responseData.bySubject);
      console.log("By Grade:", result.responseData.byGrade);
      console.log("Classification:", result.responseData.classification);
      console.groupEnd();
    } else {
      console.warn("No analytics data found in response.");
    }

    return (
      result.responseData || {
        stats: {
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          totalTimeSpent: 0,
          totalUserUniqueAttemptedQs: 0,
          totalQuizzes: 0,
        },
        byDate: {},
        bySubmodule: {},
        byModule: {},
        bySubject: {},
        byGrade: {},
        classification: {
          ok: [], bad: [], important: [], common: [],
        },
      }
    );
  },

  // ---------------- Real getAnalytics (edge function) --------------
  async get_analytics_subModule(googleId, subModuleId = null) {
    if (!googleId) {
      throw new Error("googleId is required");
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    try {
      return await callEdgeFunction(
        "get_analytics_subModule",
        { body: { googleId, subModuleId } },
        accessToken,
      );
    } catch (err) {
      const direct = await fetchAnalyticsDirectFromDb(googleId, subModuleId);
      if ((direct?.overall?.stats?.attendedTotal ?? 0) > 0) {
        return direct;
      }

      const local = fetchAnalyticsFromLocalStorage(subModuleId);
      if ((local?.overall?.stats?.attendedTotal ?? 0) > 0) {
        return local;
      }

      return createEmptyCanonicalAnalytics({ error: err?.payload || err?.message || "edge_error", source: "edge+direct-fallback" });
    }
  },

  async getAnalytics(googleId, subModuleId = null, { forceRefresh = false } = {}) {
    if (!googleId) throw new Error("Google ID is required");

    // auth token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    // Cache logic removed

    let result;
    try {
      result = await callEdgeFunction("get_analytics", { body: { googleId, subModuleId } }, accessToken);
    } catch (err) {
      if (
        isAuthJwtCompatibilityError(err?.payload || err?.message || "") ||
        isMissingAuthorizationHeaderError(err?.payload || err?.message || "")
      ) {
        const direct = await fetchAnalyticsDirectFromDb(googleId, subModuleId);
        if ((direct?.overall?.stats?.attendedTotal ?? 0) > 0) {
          return direct;
        }
        const local = fetchAnalyticsFromLocalStorage(subModuleId);
        if ((local?.overall?.stats?.attendedTotal ?? 0) > 0) {
          return local;
        }
        return createEmptyCanonicalAnalytics({ error: err.payload || err.message || "edge_error", source: "edge-auth+direct-fallback" });
      }

      console.error("getAnalytics edge function error:", err.message || err);
      const direct = await fetchAnalyticsDirectFromDb(googleId, subModuleId);
      if ((direct?.overall?.stats?.attendedTotal ?? 0) > 0) {
        return direct;
      }

      const local = fetchAnalyticsFromLocalStorage(subModuleId);
      if ((local?.overall?.stats?.attendedTotal ?? 0) > 0) {
        return local;
      }

      const fallback = createEmptyCanonicalAnalytics({ error: err.payload || err.message || "edge_error", source: "edge+direct-fallback" });
      return fallback;
    }

    const analytics = result || {};

    try {
      console.group("Analytics ResponseData");
      console.log("Full payload:", analytics);
      console.log("Stats:", analytics.stats || analytics.overall?.stats || {});
      console.log("Subjects:", analytics.subjects || analytics.overall?.subjects || {});
      console.log("Modules:", analytics.modules || {});
      console.groupEnd();
    } catch (e) { }

    const resolve = (keyVariants = []) => {
      const overallStats = analytics.overall?.stats ?? analytics.stats ?? analytics;
      for (const k of keyVariants) if (overallStats && overallStats[k] != null) return overallStats[k];
      for (const k of keyVariants) if (analytics[k] != null) return analytics[k];
      if (analytics.stats && typeof analytics.stats === "object") {
        for (const k of keyVariants) if (analytics.stats[k] != null) return analytics.stats[k];
      }
      if (analytics.overall && typeof analytics.overall === "object") {
        for (const k of keyVariants) if (analytics.overall[k] != null) return analytics.overall[k];
        if (analytics.overall.stats && typeof analytics.overall.stats === "object") {
          for (const k of keyVariants) if (analytics.overall.stats[k] != null) return analytics.overall.stats[k];
        }
      }
      return undefined;
    };

    const mappedStats = {
      grade: resolve(["grade", "gradeId", "schoolGrade"]) ?? analytics.grade ?? analytics.overall?.grade ?? null,
      avgTime: resolve(["avgTime", "avgTimeSpent"]) ?? 0,
      totalTime: resolve(["totalTime", "totalTimeSpent"]) ?? 0,
      totalCorrect: resolve(["totalCorrect", "correct", "correctAnswers"]) ?? 0,
      attendedTotal: resolve(["attendedTotal", "attended", "totalUniqueAttended"]) ?? 0,
      avgTimeUnique: resolve(["avgTimeUnique"]) ?? 0,
      totalIncorrect: resolve(["totalIncorrect", "incorrect", "incorrectAnswers"]) ?? 0,
      totalTimeUnique: resolve(["totalTimeUnique"]) ?? 0,
      totalCorrectUnique: resolve(["totalCorrectUnique", "total_correct_unique"]) ?? 0,
      totalUniqueAttended: resolve(["totalUniqueAttended", "totalUserUniqueAttemptedQs", "totalUniqueAttempts"]) ?? 0,
      totalIncorrectUnique: resolve(["totalIncorrectUnique", "total_incorrect_unique"]) ?? 0,
      totalUniqueQuestions: resolve(["totalUniqueQuestions", "totalQuestions"]) ?? 0,
      coverage: resolve(["coverage", "coveragePercent", "coverage_pct", "coverage_percentage"]) ?? null,
      mastery: resolve(["mastery", "masteryPercent", "mastery_pct", "mastery_percentage"]) ?? null,
      accuracy: resolve(["accuracy", "finalAccuracy", "final_accuracy", "accuracyPercent", "accuracy_pct", "avgScore"]) ?? null,
      finalAccuracy: resolve(["finalAccuracy", "final_accuracy", "accuracy", "accuracyPercent"]) ?? null,
      avgScore: resolve(["avgScore", "averageScore", "avg_score"]) ?? null,
    };

    const normalizeSubject = (r = {}) => ({
      avgTime: r.avgTime ?? r.avgTimeSpent ?? 0,
      subjectId: r.subjectId ?? r.subject_id ?? r.id ?? r.key ?? null,
      totalTime: r.totalTime ?? r.total_time_spent ?? r.totalTimeSpent ?? 0,
      subjectName: (r.subjectName ?? r.subject_name ?? r.name ?? r.title ?? "").toString(),
      totalCorrect: r.totalCorrect ?? r.total_correct ?? r.correct ?? r.correctAnswers ?? 0,
      attendedTotal: r.attendedTotal ?? r.attended ?? r.totalUniqueAttended ?? 0,
      avgTimeUnique: r.avgTimeUnique ?? 0,
      totalIncorrect: r.totalIncorrect ?? r.total_incorrect ?? r.incorrect ?? 0,
      totalQuestions: r.totalQuestions ?? r.total_questions ?? r.total ?? r.totalUniqueQuestions ?? 0,
      totalTimeUnique: r.totalTimeUnique ?? 0,
      totalCorrectUnique: r.totalCorrectUnique ?? r.total_correct_unique ?? 0,
      totalUniqueAttended: r.totalUniqueAttended ?? r.total_unique_attended ?? r.totalUserUniqueAttemptedQs ?? 0,
      totalIncorrectUnique: r.totalIncorrectUnique ?? 0,
      coverage: r.coverage ?? r.coveragePercent ?? r.coverage_pct ?? r.coverage_percentage ?? null,
      mastery: r.mastery ?? r.masteryPercent ?? r.mastery_pct ?? r.mastery_percentage ?? null,
      accuracy: r.accuracy ?? r.finalAccuracy ?? r.avgScore ?? null,
      avgScore: r.avgScore ?? r.averageScore ?? null,
      raw: r,
    });

    const normalizeModule = (m = {}) => ({
      avgTime: m.avgTime ?? m.avgTimeSpent ?? 0,
      moduleId: m.moduleId ?? m.module_id ?? m.id ?? null,
      totalTime: m.totalTime ?? m.total_time_spent ?? m.totalTimeSpent ?? 0,
      moduleName: (m.moduleName ?? m.module_name ?? m.name ?? m.title ?? "").toString(),
      totalCorrect: m.totalCorrect ?? m.total_correct ?? m.correct ?? m.correctAnswers ?? 0,
      attendedTotal: m.attendedTotal ?? m.attended ?? 0,
      avgTimeUnique: m.avgTimeUnique ?? 0,
      totalIncorrect: m.totalIncorrect ?? m.total_incorrect ?? m.incorrect ?? 0,
      totalQuestions: m.totalQuestions ?? m.total_questions ?? m.total ?? 0,
      totalTimeUnique: m.totalTimeUnique ?? 0,
      totalCorrectUnique: m.totalCorrectUnique ?? 0,
      totalUniqueAttended: m.totalUniqueAttended ?? 0,
      totalIncorrectUnique: m.totalIncorrectUnique ?? 0,
      raw: m,
    });

    let subjectsRaw = [];
    if (analytics.subjects && Array.isArray(analytics.subjects.stats)) {
      subjectsRaw = analytics.subjects.stats;
    } else if (Array.isArray(analytics.subjects)) {
      subjectsRaw = analytics.subjects;
    } else if (analytics.bySubject && typeof analytics.bySubject === "object" && !Array.isArray(analytics.bySubject)) {
      subjectsRaw = Object.entries(analytics.bySubject).map(([id, entry]) => Object.assign({ subjectId: id }, entry));
    } else if (analytics.stats?.subjects && Array.isArray(analytics.stats.subjects)) {
      subjectsRaw = analytics.stats.subjects;
    } else {
      subjectsRaw = [];
    }
    const subjectsStats = Array.isArray(subjectsRaw) ? subjectsRaw.map((r) => normalizeSubject(r)) : [];
    const subjectsGrade = analytics.subjects?.grade ?? analytics.grade ?? mappedStats.grade ?? analytics.overall?.grade ?? null;

    let modulesRaw = [];
    if (analytics.modules && Array.isArray(analytics.modules.stats)) {
      modulesRaw = analytics.modules.stats;
    } else if (Array.isArray(analytics.modules)) {
      modulesRaw = analytics.modules;
    } else if (analytics.byModule && typeof analytics.byModule === "object") {
      const grouped = {};
      Object.values(analytics.byModule).forEach((mod) => {
        const sid = mod.subjectId ?? mod.subject_id ?? mod.subject ?? "unknown";
        if (!grouped[sid]) grouped[sid] = { subjectId: sid, subjectName: mod.subjectName ?? mod.subject_name ?? "", modules: [] };
        grouped[sid].modules.push(mod);
      });
      modulesRaw = Object.values(grouped);
    } else if (analytics.stats?.modules && Array.isArray(analytics.stats.modules)) {
      modulesRaw = analytics.stats.modules;
    } else {
      modulesRaw = [];
    }

    const modulesStats = modulesRaw.map((group) => {
      const subjectId = group.subjectId ?? group.subject_id ?? group.id ?? group.key ?? null;
      const subjectName = (group.subjectName ?? group.subject_name ?? group.name ?? group.title ?? "").toString();
      const moduleEntries = Array.isArray(group.modules)
        ? group.modules.map((m) => normalizeModule(m))
        : Array.isArray(group) && group.every((x) => x.moduleId || x.module_id)
          ? group.map((m) => normalizeModule(m))
          : [];
      return { subjectId, subjectName, modules: moduleEntries };
    });
    const modulesGrade = analytics.modules?.grade ?? analytics.grade ?? mappedStats.grade ?? analytics.overall?.grade ?? null;

    let subModulesFlatCanonical = null;
    if (analytics.subModulesFlat) {
      const sf = analytics.subModulesFlat;
      const arr =
        (sf && Array.isArray(sf.subModules)) ? sf.subModules
          : Array.isArray(sf) ? sf
            : Array.isArray(analytics.raw?.subModules) ? analytics.raw.subModules
              : Array.isArray(analytics.subModules) ? analytics.subModules
                : [];
      subModulesFlatCanonical = { grade: sf?.grade ?? sf?.gradeId ?? null, subModules: arr };
    }

    const canonical = {
      overall: { stats: mappedStats },
      subjects: subjectsStats,
      subjectsMeta: { grade: subjectsGrade, stats: subjectsStats },
      modules: modulesStats,
      modulesMeta: { grade: modulesGrade, stats: modulesStats },
      subModulesFlat: subModulesFlatCanonical ?? { grade: analytics.subModulesFlat?.grade ?? null, subModules: [] },
      raw: analytics,
    };

    if ((canonical?.overall?.stats?.attendedTotal ?? 0) === 0) {
      const direct = await fetchAnalyticsDirectFromDb(googleId, subModuleId);
      if ((direct?.overall?.stats?.attendedTotal ?? 0) > 0) {
        return direct;
      }

      const local = fetchAnalyticsFromLocalStorage(subModuleId);
      if ((local?.overall?.stats?.attendedTotal ?? 0) > 0) {
        return local;
      }
    }

    // Cache set removed


    return canonical;
  },

  // ---------------- Dummy analytics (unchanged) ----------------
  async getAnalytics_dummy(googleId, scopeId = null) {
    if (!googleId) throw new Error("Google ID is required (dummy)");
    return await (async () => {
      return {
        stats: { totalUniqueQuestions: 0, totalCorrect: 0, totalIncorrect: 0, attendedTotal: 0 },
        subjects: [],
        byDate: {},
        bySubmodule: {},
        byModule: {},
        bySubject: {},
        byGrade: {},
        classification: { ok: [], bad: [], important: [], common: [] },
        raw: { dummy: true },
      };
    })();
  },

  // ==========================================
  // OTHER ANALYTICS / ADMIN ROUTINES
  // ==========================================
  async getAttemptedSubModules(googleId, data = null /*, subjectId - ignored here */) {
    try {
      if (!googleId) throw new Error("googleId is required");

      let canonical;
      if (data) {
        canonical = data;
      }
      else {
        try {
          canonical = await this.getAnalytics(googleId, null);
        } catch (e) {
          console.warn("[getAttemptedSubModules] getAnalytics failed:", e?.message ?? e);
          canonical = null;
        }
      }

      const attemptedSet = new Set();
      const raw = canonical?.raw ?? canonical ?? {};

      const bySubmodule = raw?.bySubmodule ?? raw?.by_submodule ?? canonical?.bySubmodule ?? canonical?.by_submodule ?? {};
      if (bySubmodule && typeof bySubmodule === "object") {
        Object.entries(bySubmodule).forEach(([k, v]) => {
          try {
            const correct = Number(v?.totalCorrectUnique ?? v?.correct ?? v?.correctAnswers ?? v?.total_correct ?? 0);
            const incorrect = Number(v?.totalIncorrectUnique ?? v?.incorrect ?? v?.total_incorrect ?? 0);
            const total = Number(v?.total ?? v?.attended ?? v?.attendedTotal ?? v?.totalQuestions ?? 0);
            if (correct + incorrect + total > 0) attemptedSet.add(String(k));
          } catch (e) { }
        });
      }

      const flatCandidates = raw?.subModulesFlat?.subModules
        ?? raw?.overallSubmodules
        ?? raw?.subModules
        ?? canonical?.subModulesFlat?.subModules
        ?? canonical?.overallSubmodules
        ?? [];
      if (Array.isArray(flatCandidates)) {
        flatCandidates.forEach((s) => {
          const id = s?.subModuleId ?? s?.sub_module_id ?? s?.id ?? s?.moduleId ?? s?.module_id;
          const correct = Number(s?.totalCorrectUnique ?? s?.total_correct_unique ?? s?.totalCorrect ?? 0);
          const incorrect = Number(s?.totalIncorrectUnique ?? s?.total_incorrect_unique ?? s?.totalIncorrect ?? 0);
          const attended = Number(s?.totalUniqueAttended ?? s?.attended ?? s?.attendedTotal ?? s?.total_unique_attended ?? 0);
          if (id != null && (correct + incorrect + attended > 0)) attemptedSet.add(String(id));
        });
      }

      if (Array.isArray(raw?.modules)) {
        raw.modules.flatMap((g) => (Array.isArray(g.modules) ? g.modules : [g])).forEach((m) => {
          const id = m?.subModuleId ?? m?.sub_module_id ?? m?.id ?? m?.moduleId ?? m?.module_id;
          const correct = Number(m?.totalCorrectUnique ?? m?.total_correct_unique ?? m?.totalCorrect ?? 0);
          const incorrect = Number(m?.totalIncorrectUnique ?? m?.total_incorrect_unique ?? m?.totalIncorrect ?? 0);
          const attended = Number(m?.totalUniqueAttended ?? m?.attended ?? m?.attendedTotal ?? 0);
          if (id != null && (correct + incorrect + attended > 0)) attemptedSet.add(String(id));

          if (Array.isArray(m?.subModules)) {
            m.subModules.forEach((s) => {
              const sid = s?.subModuleId ?? s?.sub_module_id ?? s?.id;
              const sc = Number(s?.totalCorrectUnique ?? s?.totalCorrect ?? 0);
              const si = Number(s?.totalIncorrectUnique ?? s?.totalIncorrect ?? 0);
              const sa = Number(s?.totalUniqueAttended ?? s?.attended ?? 0);
              if (sid != null && (sc + si + sa > 0)) attemptedSet.add(String(sid));
            });
          }
        });
      }

      const attempted = Array.from(attemptedSet).map((x) => (String(Number(x)) === String(x) ? Number(x) : x));
      return { attemptedSubmodules: attempted, canonical };
    } catch (error) {
      console.error("[getAttemptedSubModules] fatal:", error?.message ?? error);
      return { attemptedSubmodules: [] };
    }
  },
  // ---------------- Real getAnalyticsAll (edge function) ----------------
  async get_analytics_all({ forceRefresh = false } = {}) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      throw new Error("User not logged in");
    }

    // Cache logic removed

    let result;
    try {
      // ✅ CORRECT: call edge function using POST
      result = await callEdgeFunction(
        "get_analytics_all",
        { method: "POST", body: {} },
        accessToken
      );
    } catch (err) {
      console.error("get_analytics_all edge function error:", err);

      // ❌ NO MOCK DATA
      const fallback = {
        perStudent: {},
        raw: { error: err.message || "edge_error" },
      };

      // Cache set removed
      return fallback;
    }

    // Cache set removed
    return result;
  },


  // ==========================================
  // ADMIN - SUBJECTS / MODULES / SUBMODULES
  // ==========================================
  async createSubject(name, description, grade = null) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const insertRow = { name, description };
    if (grade !== null && grade !== undefined && grade !== "") {
      insertRow.grade = grade;
    }

    const { data: directData, error: directError } = await supabase
      .from("subjects")
      .insert([insertRow])
      .select()
      .single();

    if (!directError && directData) {
      return directData;
    }

    const result = await callEdgeFunction("createSubject", { body: { name, description, grade } }, accessToken);
    return result.data?.[0];
  },



  async toggleSubject(subjectId, isActive) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const result = await callEdgeFunction("toggle_subject", { body: { subjectId, isActive } }, accessToken);
    return result.data?.[0];
  },

  async createModule(subjectId, name, description) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const { data: directData, error: directError } = await supabase
      .from("modules")
      .insert([
        {
          subject_id: subjectId,
          name,
          description,
        },
      ])
      .select()
      .single();

    if (!directError && directData) {
      return directData;
    }

    const result = await callEdgeFunction("create_module", { body: { subjectId, name, description } }, accessToken);
    return result.data?.[0];
  },

  async toggleModule(moduleId, isActive) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const result = await callEdgeFunction("toggle_module", { body: { moduleId, isActive } }, accessToken);
    return result.data?.[0];
  },

  async createSubModule(moduleId, name, difficulty, isPro) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const { data: directData, error: directError } = await supabase
      .from("sub_modules")
      .insert([
        {
          module_id: moduleId,
          name,
          difficulty,
          is_pro: isPro,
        },
      ])
      .select()
      .single();

    if (!directError && directData) {
      return directData;
    }

    const result = await callEdgeFunction("create_submodule", { body: { moduleId, name, difficulty, isPro } }, accessToken);
    return result.data?.[0];
  },

  async toggleSubModule(subModuleId, isActive) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    const result = await callEdgeFunction("toggle_submodule", { body: { subModuleId, isActive } }, accessToken);
    return result.data?.[0];
  },

  async updateSubModule(subModuleId, updates) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");

    // We can reuse create_submodule or likely need a new endpoint. 
    // Usually 'update_submodule' or we can do a direct DB update if allowed, 
    // but better to stick to patterns. 
    // Since I don't have 'update_submodule' edge function, I will try direct DB update 
    // or assume there is an Update RPC. 
    // Actually, looking at the pattern, we should probably stick to Edge Functions if possible, 
    // but without one, I'll use direct DB for now as a fallback or creating a simple wrapper.
    // Wait, the plan said "Update createSubModule (or add updateSubModule)".
    // Let's use direct DB update for 'concept' column since it's a simple text field.

    const { data, error } = await supabase
      .from("sub_modules")
      .update(updates)
      .eq("id", subModuleId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    // Cache clear removed


    return data;
  },

  async deleteSubmoduleSafe(subModuleId) {
    if (!subModuleId) {
      throw new Error("SubModule ID is required");
    }

    // Loop to handle pagination limits (Supabase defaults to 1000 rows max per select)
    // We process in batches until no questions remain for this submodule.
    while (true) {
      // 1️⃣ Fetch a batch of questions
      const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("id")
        .eq("sub_module_id", subModuleId)
        .limit(500); // Process 500 at a time

      if (qErr) throw qErr;

      // If no more questions, we are done cleaning up children
      if (!questions || questions.length === 0) {
        break;
      }

      const questionIds = questions.map((q) => q.id);

      // 2️⃣ Delete analytics for this batch
      // Chunking the IN clause just to be safe, though 500 should fit.
      const CHUNK_SIZE = 100;
      for (let i = 0; i < questionIds.length; i += CHUNK_SIZE) {
        const chunk = questionIds.slice(i, i + CHUNK_SIZE);
        const { error: qaErr } = await supabase
          .from("user_qas")
          .delete()
          .in("question_id", chunk);

        if (qaErr) {
          console.error("Error deleting user_qas:", qaErr);
          throw new Error(`Failed to delete associated analytics: ${qaErr.message}`);
        }
      }

      // 3️⃣ Delete the questions themselves (BY ID, not generic eq)
      // This ensures we only delete the ones we just cleaned up.
      const { error: delQErr } = await supabase
        .from("questions")
        .delete()
        .in("id", questionIds);

      if (delQErr) throw delQErr;
    }

    // 4️⃣ Delete submodule
    const { error: subErr } = await supabase
      .from("sub_modules")
      .delete()
      .eq("id", subModuleId);

    if (subErr) throw subErr;

    return true;
  },

  async deleteModuleSafe(moduleId) {
    if (!moduleId) throw new Error("Module ID is required");

    // 1️⃣ Get all submodules (including disabled ones)
    const { subModules } = await this.getSubModules(moduleId, true);

    // 2️⃣ Delete each submodule safely (cascades questions, analytics etc.)
    // We can do this in parallel or serial. Serial is safer against rate limits.
    for (const sub of subModules) {
      await this.deleteSubmoduleSafe(sub.id);
    }

    // 3️⃣ Delete the module itself
    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId);

    if (error) throw error;
    return true;
  },

  // ==========================================
  // ADMIN - BULK QUESTIONS UPLOAD
  // ==========================================
  async createQuestionsFromFile(subModuleId, questions) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("User not logged in");
    if (!subModuleId || !questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error("subModuleId and non-empty questions array are required");
    }

    // const result = await callEdgeFunction("create_questions_from_file", { body: { subModuleId, questions } }, accessToken);
    const result = await callEdgeFunction("create_questions_from_file_260129", { body: { subModuleId, questions } }, accessToken);
    return result.data;
  },
};

export default supabaseService;
