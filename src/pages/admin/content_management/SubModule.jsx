import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabaseService } from "../../../services/supabaseService";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiPlus, FiUpload, FiDownload, FiBookOpen, FiTrash2, FiAlertCircle, FiEdit2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { ArrowLeft, Layers, FileText, Award, Zap } from "lucide-react";
import LatexRenderer from "../../../components/common/LatexRenderer";
import JSZip from "jszip";
import Papa from "papaparse";
import { imageSupabase } from "../../../config/imageSupabase";
import DeleteConfirmModal from "../../../components/DeleteConfirmModal";
import { verifyDeletePassword } from "../../../utils/verifyDeletePassword";
import MarkdownRenderer from "../../../components/common/MarkdownRenderer";
import { useNavigate } from "react-router-dom";
import { validateQuizData } from "../../../utils/validateQuizData";
import ValidationAlertModal from "../../../components/ValidationAlertModal";
import { useDispatch, useSelector } from "react-redux";
import { setadminSubmodule } from "../../../slices/viewCoursesSlice";
import { useTheme } from "../../../utils/useTheme";

console.log("imageSupabase client:", imageSupabase);

const downloadRules = () => {
  const a = document.createElement("a");
  a.href = "/Quiz_Upload_Rules.txt";
  a.download = "Quiz_Upload_Rules.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const downloadZipTemplate = async () => {
  const zip = new JSZip();
  zip.file("questions.json", JSON.stringify(QUESTIONS_JSON_TEMPLATE, null, 2));
  const imgNames = ["concave_mirror_focus.png", "plane_mirror_image.png"];
  try {
    const imgFolder = zip.folder("images");
    imgFolder.file("README.txt", "Place your image files here");
    for (const name of imgNames) {
      try {
        const response = await fetch(`/template/${name}`);
        if (response.ok) imgFolder.file(name, await response.blob());
      } catch (err) { console.warn(`Error loading template image ${name}:`, err); }
    }
  } catch (e) { console.error("Error adding images to zip:", e); }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "questions-with-images-template.zip";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const QUESTIONS_JSON_TEMPLATE = {
  "subject": "TESTING-Subjects", "grade": 9, "chapterName": "20260119 MKM Test Image",
  "chapterNumber": 1, "textbookRef": "MKM Testbook",
  "questions": [
    { "id": "Q1", "questionType": "mcq", "category": null, "difficulty": "easy", "questionText": "What type of image is formed by a plane mirror?", "options": [{ "optionText": "Real and inverted", "isCorrect": false }, { "optionText": "Virtual and erect", "isCorrect": true }, { "optionText": "Real and diminished", "isCorrect": false }, { "optionText": "Virtual and inverted", "isCorrect": false }], "multi": null, "blanks": null, "passageId": null, "passageTitle": null, "passageText": null, "imageName": "plane_mirror_image.png", "imageUrl": null, "imageCaption": "Image formation by a plane mirror", "sourceTextbookUrl": null, "pageNumber": null, "explanationAnswer": "explanationAnswer 1", "explanationQuestion": "explanationQuestion 1" },
  ]
};

function convertPlainTextToMarkdown(text) {
  const lines = text.split("\n");
  let output = [], tableBuffer = [];
  const isBullet = (line) => line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*");
  const isTableRow = (line) => !isBullet(line) && line.includes("\t") && line.split("\t").length >= 2;
  for (let line of lines) {
    if (isTableRow(line)) { tableBuffer.push(line.split("\t").map(c => c.trim())); }
    else { if (tableBuffer.length > 0) { output.push(buildMarkdownTable(tableBuffer)); tableBuffer = []; } output.push(line); }
  }
  if (tableBuffer.length > 0) output.push(buildMarkdownTable(tableBuffer));
  return output.join("\n\n");
}

function buildMarkdownTable(rows) {
  if (rows.length < 2) return "";
  return `${rows[0].join(" | ")}\n${rows[0].map(() => "---").join(" | ")}\n${rows.slice(1).map(r => r.join(" | ")).join("\n")}`;
}

function parseQuizJsonText(text) {
  if (typeof text !== "string") {
    throw new Error("Invalid JSON format: File content is not text");
  }

  // Handle UTF-8 BOM and accidental leading/trailing whitespace.
  const base = text.replace(/^\uFEFF/, "").trim();

  // Normalize smart quotes that often appear when JSON is copied from docs/editors.
  const normalizedQuotes = base
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  // Allow code-fenced pasted JSON (```json ... ```).
  const withoutCodeFence = normalizedQuotes
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // If extra text exists before/after JSON, extract the first JSON-looking payload.
  const firstBrace = withoutCodeFence.search(/[\[{]/);
  const lastCurly = withoutCodeFence.lastIndexOf("}");
  const lastSquare = withoutCodeFence.lastIndexOf("]");
  const lastBrace = Math.max(lastCurly, lastSquare);

  const candidates = [];
  candidates.push(withoutCodeFence);
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(withoutCodeFence.slice(firstBrace, lastBrace + 1).trim());
  }

  let lastError = null;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Invalid JSON format: ${lastError?.message || "JSON parse failed"}`);
}

function SubModuleList() {
  const createFileInputRef = useRef(null);
  const { moduleName } = useParams();
  const [submodules, setSubmodules] = useState([]);
  const dispatch = useDispatch();
  const { adminsubmodule } = useSelector((state) => state.viewCourse);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubmodule, setNewSubmodule] = useState({ name: "", difficulty: "medium", isPro: false });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingSubmoduleId, setUploadingSubmoduleId] = useState(null);
  const [hasImages, setHasImages] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConceptModal, setShowConceptModal] = useState(false);
  const [currentConceptSubmodule, setCurrentConceptSubmodule] = useState(null);
  const [conceptText, setConceptText] = useState("");
  const [savingConcept, setSavingConcept] = useState(false);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const key = searchParams.get("key");
  const subjectId = searchParams.get("subjectId");
  const grade = searchParams.get("grade");
  const subjectNameParam = searchParams.get("subjectName");
  const subjectName = subjectNameParam ? decodeURIComponent(subjectNameParam) : "";
  const navigate = useNavigate();

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleBackToSubjects = () => navigate(`/admin/subjects?grade=${grade}`);

  const handleBack = () => {
    const path = location.pathname;
    const params = new URLSearchParams(location.search);
    const grade = params.get("grade");
    const subjectName = params.get("subjectName");
    const subjectId = params.get("subjectId");
    if (path.includes("/admin/courses/modules")) { navigate(`/admin/courses/${encodeURIComponent(subjectName)}?key=${subjectId}&grade=${grade}`); return; }
    if (path.includes("/admin/courses/")) { navigate(`/admin/subjects?grade=${grade}`); return; }
    navigate("/admin/grades");
  };

  useEffect(() => { if (key) fetchSubModules(); }, [key]);
  useEffect(() => { setSelectedFile(null); }, [hasImages]);
  useEffect(() => { console.log("Image Supabase ready:", !!imageSupabase); }, []);

  const fetchSubModules = async () => {
    try {
      const response = await supabaseService.getSubModules(key, true);
      setSubmodules(response.subModules);
      dispatch(setadminSubmodule(response));
    } catch (error) {
      console.error("Error fetching submodules:", error);
      toast.error("Failed to fetch submodules");
    }
  };

  const toggleSubmodule = async (submoduleId, currentIsActive) => {
    const enable = !currentIsActive;
    if (!window.confirm(enable ? "Enable this submodule?" : "Disable this submodule?")) return;
    try {
      await supabaseService.toggleSubModule(submoduleId, enable);
      toast.success(`Submodule ${enable ? "enabled" : "disabled"} successfully`);
      fetchSubModules();
    } catch (error) { toast.error(error.message || "Failed to toggle submodule"); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const ext = file.name.split(".").pop().toLowerCase();
    if (hasImages && ext !== "zip") { toast.error("For image-based chapters, please upload a ZIP file"); e.target.value = ""; return; }
    if (!hasImages && !["json", "csv"].includes(ext)) { toast.error("Please upload a JSON or CSV file"); e.target.value = ""; return; }
    setSelectedFile(file);
  };

  const handleDeleteSubmodule = async (password) => {
    try {
      setDeleting(true);
      verifyDeletePassword(password);
      await supabaseService.deleteSubmoduleSafe(selectedSubmoduleId);
      toast.success("Chapter deleted successfully");
      setShowDeleteModal(false); setSelectedSubmoduleId(null); fetchSubModules();
    } catch (err) { toast.error(err.message || "Failed to delete chapter"); }
    finally { setDeleting(false); }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSubmodule((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const openConceptModal = (submodule) => {
    setCurrentConceptSubmodule(submodule);
    setConceptText(submodule.description || "");
    setShowConceptModal(true);
  };

  const handleSaveConcept = async () => {
    if (!currentConceptSubmodule) return;
    setSavingConcept(true);
    try {
      await supabaseService.updateSubModule(currentConceptSubmodule.id, { description: conceptText });
      toast.success("Concept updated successfully");
      setShowConceptModal(false); fetchSubModules();
    } catch (err) { toast.error("Failed to save concept"); }
    finally { setSavingConcept(false); }
  };

  const parseJSONFile = async (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = parseQuizJsonText(e.target.result);
        resolve({ questions: Array.isArray(json) ? json : json.questions || [], raw: json });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });

  const parseCSVFile = async (file) => new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        try {
          resolve(results.data.map((row) => {
            const qt = (row.questionType || row.question_type || "mcq").toLowerCase();
            if (qt === "mcq") return { questionText: row.questionText || row.question, questionType: "mcq", options: [{ optionText: row.option1, isCorrect: row.correctAnswer === row.option1 }, { optionText: row.option2, isCorrect: row.correctAnswer === row.option2 }, { optionText: row.option3, isCorrect: row.correctAnswer === row.option3 }, { optionText: row.option4, isCorrect: row.correctAnswer === row.option4 }].filter(o => o.optionText), difficulty: row.difficulty || "medium" };
            if (qt === "truefalse") return { questionText: row.questionText || row.question, questionType: "truefalse", correctAnswer: row.correctAnswer === "true" || row.correctAnswer === "True", difficulty: row.difficulty || "medium" };
            if (qt === "fillblanks") return { questionText: row.questionText || row.question, questionType: "fillblanks", blanks: (row.blanks || row.correctAnswer || "").split(",").map(b => b.trim()), difficulty: row.difficulty || "medium" };
            return null;
          }).filter(Boolean));
        } catch (err) { reject(new Error("Invalid CSV: " + err.message)); }
      },
      error: (err) => reject(new Error("Failed to parse CSV: " + err.message)),
    });
  });

  const parseZipFile = async (file) => {
    const zip = await JSZip.loadAsync(file);
    let questionsFilePath = null;
    zip.forEach((path, entry) => { if (!entry.dir && path.toLowerCase().endsWith("questions.json")) questionsFilePath = path; });
    if (!questionsFilePath) throw new Error("questions.json not found in ZIP");
    const parsed = parseQuizJsonText(await zip.file(questionsFilePath).async("text"));
    const imageFiles = {};
    zip.forEach((path, entry) => { if (!entry.dir && path.toLowerCase().includes("/images/")) imageFiles[path.split("/").pop()] = entry; });
    return { questions: parsed.questions || [], raw: parsed, imageFiles };
  };

  const validateZipStructure = (questions, imageFiles) => {
    const refs = new Set(questions.filter(q => q.imageName).map(q => q.imageName));
    if (refs.size > 0 && Object.keys(imageFiles).length === 0) return ["The 'images' folder is missing or empty in the ZIP."];
    return questions.filter((q, i) => q.imageName && !imageFiles[q.imageName]).map((q, i) => `Question ${i + 1}: Missing image: ${q.imageName}`);
  };

  const uploadImagesToSupabase = async (imageFiles, grade, subjectName, moduleName, chapterName, uploadId) => {
    const imagePathMap = {};
    for (const [localPath, zipFile] of Object.entries(imageFiles)) {
      const blob = await zipFile.async("blob");
      const orig = localPath.split("/").pop();
      const dot = orig.lastIndexOf(".");
      const unique = dot !== -1 ? `${orig.slice(0, dot)}__${uploadId}${orig.slice(dot)}` : `${orig}__${uploadId}`;
      const path = `grade/${grade}/subject/${subjectName}/module/${moduleName}/submodule/${chapterName}/${unique}`;
      const { data: exists } = await imageSupabase.storage.from("question-assets").list(`grade/${grade}/subject/${subjectName}/module/${moduleName}/submodule/${chapterName}`, { search: unique });
      if (!exists?.length) { const { error } = await imageSupabase.storage.from("question-assets").upload(path, blob, { upsert: false }); if (error) throw error; }
      imagePathMap[orig] = path;
    }
    return imagePathMap;
  };

  const downloadJSONTemplate = () => {
    const blob = new Blob([JSON.stringify(QUESTIONS_JSON_TEMPLATE, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "questions-template.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const createSubmodule = async (e) => {
    e.preventDefault();
    if (!newSubmodule.name.trim()) { toast.error("Chapter name is required"); return; }
    if (!selectedFile) { toast.error("Please upload a questions file"); return; }
    if (!key) { toast.error("Module ID is missing"); return; }
    setIsCreating(true);
    try {
      let questions = [];
      const ext = selectedFile.name.split(".").pop().toLowerCase();
      if (hasImages) {
        const uploadId = Date.now().toString();
        if (ext !== "zip") throw new Error("Image-based chapters must be uploaded as a ZIP file");
        const { questions: zq, raw: zr, imageFiles } = await parseZipFile(selectedFile);
        const zipErrors = validateZipStructure(zq, imageFiles);
        if (!zq || zq.length === 0) throw new Error("No questions found in questions.json");
        const vr = validateQuizData(zr, { grade, subject: subjectName, chapterName: newSubmodule.name });
        const allErrors = [...zipErrors, ...vr.errors];
        if (allErrors.length > 0) { setValidationErrors(allErrors); setShowValidationModal(true); return; }
        const imagePathMap = await uploadImagesToSupabase(imageFiles, grade, subjectName, moduleName, newSubmodule.name, uploadId);
        questions = zq.map(q => q.imageName ? { ...q, imageName: imagePathMap[q.imageName], imageCaption: q.imageCaption || null } : q);
      } else {
        let rawData = {};
        if (ext === "json") { const r = await parseJSONFile(selectedFile); questions = r.questions; rawData = r.raw; }
        else if (ext === "csv") { questions = await parseCSVFile(selectedFile); rawData = { questions }; }
        else throw new Error("Unsupported file format");
        if (!questions || questions.length === 0) throw new Error("No questions found in file");
        const vr = validateQuizData(rawData, { grade, subject: subjectName, chapterName: newSubmodule.name });
        if (!vr.isValid) { setValidationErrors(vr.errors); setShowValidationModal(true); return; }
      }
      const submodule = await supabaseService.createSubModule(key, newSubmodule.name, newSubmodule.difficulty, newSubmodule.isPro);
      await supabaseService.createQuestionsFromFile(submodule.id, questions);
      toast.success(`Chapter created (${questions.length} questions)`);
      fetchSubModules(); resetForm();
    } catch (error) { toast.error(error.message || "Failed to create submodule"); }
    finally { setIsCreating(false); }
  };

  const resetForm = () => { setNewSubmodule({ name: "", difficulty: "medium", isPro: false }); setSelectedFile(null); setShowCreateForm(false); };

  const handleQuestionsFileChange = (e, submodule) => {
    const file = e.target.files[0]; if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["json", "zip"].includes(ext)) { toast.error("Please upload a JSON or ZIP file"); e.target.value = ""; return; }
    setUploadingSubmoduleId(submodule.id);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let raw = null, questions = [];
        if (ext === "zip") {
          const uploadId = Date.now().toString();
          const { questions: zq, raw: zr, imageFiles } = await parseZipFile(file);
          if (!zq || !zq.length) throw new Error("No questions found in questions.json");
          const zipErrors = validateZipStructure(zq, imageFiles);
          const vr = validateQuizData(zr, { grade, subject: subjectName, chapterName: submodule.name });
          const allErrors = [...zipErrors, ...vr.errors];
          if (allErrors.length > 0) { setValidationErrors(allErrors); setShowValidationModal(true); return; }
          const imagePathMap = await uploadImagesToSupabase(imageFiles, grade, subjectName, moduleName, submodule.name, uploadId);
          questions = zq.map(q => q.imageName ? { ...q, imageName: imagePathMap[q.imageName], imageCaption: q.imageCaption || null } : q);
          raw = zr;
        } else {
          raw = parseQuizJsonText(event.target.result);
          questions = Array.isArray(raw) ? raw : raw.questions || [];
          if (!questions.length) throw new Error("No questions found in file");
          const vr = validateQuizData(raw, { grade, subject: subjectName, chapterName: submodule.name });
          if (!vr.isValid) { setValidationErrors(vr.errors); setShowValidationModal(true); return; }
        }
        await supabaseService.createQuestionsFromFile(submodule.id, questions);
        toast.success(`Added ${questions.length} questions to "${submodule.name}"`);
        fetchSubModules();
      } catch (err) { toast.error(err.message || "Failed to add questions"); }
      finally { setUploadingSubmoduleId(null); e.target.value = ""; }
    };
    reader.onerror = () => { toast.error("Failed to read file"); setUploadingSubmoduleId(null); e.target.value = ""; };
    reader.readAsText(file);
  };

  const getDifficultyConfig = (difficulty, isDark) => {
    const configs = {
      hard: {
        bg: isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.08)",
        text: isDark ? "#F87171" : "#DC2626",
        border: isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.20)",
        label: "Hard"
      },
      easy: {
        bg: isDark ? "rgba(34,197,94,0.10)" : "rgba(34,197,94,0.08)",
        text: isDark ? "#4ADE80" : "#16A34A",
        border: isDark ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.20)",
        label: "Easy"
      },
      medium: {
        bg: isDark ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.08)",
        text: isDark ? "#FBBF24" : "#D97706",
        border: isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.20)",
        label: "Medium"
      },
    };
    return configs[difficulty?.toLowerCase()] || configs.medium;
  };

  return (
    <div
      className="min-h-screen py-8 relative overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
        backgroundSize: "28px 28px",
      }}
    >

       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <div className="absolute inset-0" />

        {/* Glow blobs */}
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.12)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[120px]"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.10)",
          }}
        />
        <div
          className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(59,130,246,0.08)"
              : "rgba(59,130,246,0.08)",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(6,182,212,0.08)"
              : "rgba(6,182,212,0.08)",
            animationDelay: "4s",
          }}
        />

        {/* Top center beam */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(99,102,241,0.15), transparent)"
              : "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)",
          }}
        />
      </div>

      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none"
        style={{ background: isDark ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)" : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)" }} />
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)" }} />

      <div className="max-w-5xl mx-auto px-6 mt-20 relative z-10">

        {/* Back Button */}
        <button
          onClick={handleBackToSubjects}
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
          style={{ color: isDark ? "#9CA3AF" : "#475569" }}
          onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A"}
          onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569"}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subjects
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1
              className="text-4xl font-bold mb-2 transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              Textbooks & References :{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)" }}
              >
                {moduleName}
              </span>
            </h1>
            <p
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: isDark ? "#9CA3AF" : "#475569" }}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              Manage chapters and quizzes
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="group flex items-center gap-2 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
            style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
          >
            {showCreateForm ? (
              <><span className="transform group-hover:rotate-90 transition-transform">✕</span> Cancel</>
            ) : (
              <><FiPlus className="text-xl group-hover:rotate-90 transition-transform" /> Add Chapters</>
            )}
          </button>
        </div>

         <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <div className="absolute inset-0" />

        {/* Glow blobs */}
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.12)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[120px]"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.10)",
          }}
        />
        <div
          className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(59,130,246,0.08)"
              : "rgba(59,130,246,0.08)",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(6,182,212,0.08)"
              : "rgba(6,182,212,0.08)",
            animationDelay: "4s",
          }}
        />

        {/* Top center beam */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(99,102,241,0.15), transparent)"
              : "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)",
          }}
        />
      </div>


        {/* Info Box */}
        <div
          className="rounded-xl p-4 mb-6 flex flex-wrap gap-6 transition-colors"
         style={{
    border: isDark ? "2px solid rgba(24,94,151,0.55)" : "1px solid rgba(99,102,241,0.5)",
    boxShadow: isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(99,102,241,0.15)",
    transition: "border 0.3s ease, box-shadow 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.border = isDark
      ? "2px solid rgba(99,102,241,0.9)"
      : "1px solid rgba(99,102,241,0.8)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 0 2px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
      : "0 4px 24px rgba(99,102,241,0.15), 0 0 12px 3px rgba(99,102,241,0.2)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.border = isDark
      ? "2px solid rgba(24,94,151,0.55)"
      : "1px solid rgba(99,102,241,0.5)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(99,102,241,0.15)";
  }}
        >
          {[
            { label: "Grade", value: grade || "—" },
            { label: "Subject", value: subjectName || "—" },
            { label: "Textbooks & References", value: moduleName || "—" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col">
              <span
                className="text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ color: isDark ? "#c5c8ccff" : "#585454ff" }}
              >
                {item.label}
              </span>
              <span
                className="text-base font-semibold mt-1 transition-colors"
                style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>


        

        {/* Create Form */}
        {showCreateForm && (
          <div
            className="rounded-2xl p-8 mb-8 animate-slideDown transition-colors"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
              boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              className="text-2xl font-bold mb-6 transition-colors"
              style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
            >
              Create New Chapter
            </h3>

            <form onSubmit={createSubmodule} className="space-y-5">

              {/* Chapter Name */}
              <div >
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                  style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
                >
                  Chapter Name *
                </label>
                <input
                  type="text" name="name" value={newSubmodule.name} onChange={handleInputChange}
                  placeholder="e.g., Exercise 1.1"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                  style={{
                    background: isDark ? "#0B0F19" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                    color: isDark ? "#E5E7EB" : "#0F172A",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#6366F1"}
                  onBlur={(e) => e.target.style.borderColor = isDark ? "#1F2937" : "#E2E8F0"}
                  required
                />
              </div>

              {/* Difficulty */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                  style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
                >
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["easy", "medium", "hard"].map((level) => {
                    const dc = getDifficultyConfig(level, isDark);
                    return (
                      <label
                        key={level}
                        className="relative flex items-center justify-center px-4 py-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: newSubmodule.difficulty === level ? dc.bg : isDark ? "#0B0F19" : "#F8FAFC",
                          border: `2px solid ${newSubmodule.difficulty === level ? dc.border : isDark ? "#1F2937" : "#E2E8F0"}`,
                        }}
                      >
                        <input type="radio" name="difficulty" value={level} checked={newSubmodule.difficulty === level} onChange={handleInputChange} className="sr-only" />
                        <span
                          className="text-sm font-medium transition-colors"
                          style={{ color: newSubmodule.difficulty === level ? dc.text : isDark ? "#9CA3AF" : "#6B7280" }}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pro Toggle */}
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
                  border: `1px solid ${isDark ? "rgba(245,158,11,0.20)" : "rgba(245,158,11,0.25)"}`,
                }}
              >
                <input type="checkbox" name="isPro" checked={newSubmodule.isPro} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded" />
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <label
                    className="text-sm font-semibold transition-colors"
                    style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                  >
                    Mark as Pro Content
                  </label>
                </div>
              </div>

              {/* Image Toggle */}
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  background: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)",
                  border: `1px solid ${isDark ? "rgba(59,130,246,0.20)" : "rgba(59,130,246,0.25)"}`,
                }}
              >
                <input type="checkbox" checked={hasImages} onChange={(e) => setHasImages(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
                <label
                  className="text-sm font-semibold transition-colors"
                  style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                >
                  This chapter contains image-based questions
                </label>
              </div>

              {/* ZIP Warning */}
              {hasImages && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    background: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
                    border: `1px solid ${isDark ? "rgba(239,68,68,0.20)" : "rgba(239,68,68,0.25)"}`,
                  }}
                >
                  <span style={{ color: isDark ? "#F87171" : "#DC2626" }} className="font-bold text-lg">⚠</span>
                  <div className="text-sm" style={{ color: isDark ? "#FCA5A5" : "#DC2626" }}>
                    <p className="font-semibold mb-1">ZIP upload required</p>
                    <p>Upload a ZIP file containing:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li><code>questions.json</code></li>
                      <li><code>images/</code> folder</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-xs font-bold uppercase tracking-widest transition-colors"
                    style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
                  >
                    Questions File ({hasImages ? "ZIP" : "JSON / CSV"}) *
                  </label>
                  <div className="flex items-center gap-3">
                    {hasImages ? (
                      <button type="button" onClick={downloadZipTemplate}
                        className="text-xs flex items-center gap-1 transition-colors"
                        style={{ color: isDark ? "#F87171" : "#DC2626" }}>
                        <FiDownload className="w-3 h-3" /> ZIP Template
                      </button>
                    ) : (
                      <button type="button" onClick={downloadJSONTemplate}
                        className="text-xs flex items-center gap-1 transition-colors"
                        style={{ color: isDark ? "#A5B4FC" : "#4F46E5" }}>
                        <FiDownload className="w-3 h-3" /> JSON Template
                      </button>
                    )}
                    <button type="button" onClick={downloadRules}
                      className="text-xs flex items-center gap-1 transition-colors"
                      style={{ color: isDark ? "#93C5FD" : "#2563EB" }}>
                      <FiAlertCircle className="w-3 h-3" /> Rules
                    </button>
                  </div>
                </div>
                <input
                  ref={createFileInputRef}
                  type="file"
                  accept={hasImages ? ".zip" : ".json,.csv"}
                  onChange={handleFileChange}
                  className="sr-only"
                  id="file-upload"
                />
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all"
                  style={{
                    borderColor: isDark ? "#1F2937" : "#E2E8F0",
                    background: isDark ? "#0B0F19" : "#F8FAFC",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                  onClick={() => {
                    if (createFileInputRef.current) createFileInputRef.current.value = "";
                    createFileInputRef.current?.click();
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#6366F1"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = isDark ? "#1F2937" : "#E2E8F0"}
                >
                  <FiUpload className="w-5 h-5" />
                  <span className="text-sm">
                    {selectedFile ? selectedFile.name : hasImages ? "Click to upload ZIP file" : "Click to upload JSON or CSV file"}
                  </span>
                </button>
              </div>

              <button
                type="submit" disabled={isCreating}
                className="w-full text-white px-6 py-3 rounded-xl transition-all font-semibold disabled:opacity-50 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
                style={{ background: "linear-gradient(135deg, #22C55E, #10B981)" }}
              >
                {isCreating ? "Creating..." : "Create Chapter with Questions"}
              </button>
            </form>
          </div>
        )}

        {/* Stats Card */}
        <div
          className="rounded-xl p-6 mb-8 transition-colors"
         style={{
    border: isDark ? "2px solid rgba(24,94,151,0.55)" : "1px solid rgba(99,102,241,0.5)",
    boxShadow: isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(99,102,241,0.15)",
    transition: "border 0.3s ease, box-shadow 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.border = isDark
      ? "2px solid rgba(99,102,241,0.9)"
      : "1px solid rgba(99,102,241,0.8)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 0 2px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
      : "0 4px 24px rgba(99,102,241,0.15), 0 0 12px 3px rgba(99,102,241,0.2)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.border = isDark
      ? "2px solid rgba(24,94,151,0.55)"
      : "1px solid rgba(99,102,241,0.5)";
    e.currentTarget.style.boxShadow = isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(99,102,241,0.15)";
  }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: <FileText className="text-indigo-400 w-6 h-6" />, iconBg: "bg-indigo-500/10 border-indigo-500/20", label: "Total", value: submodules.length },
              { icon: <FiEye className="text-emerald-400 w-6 h-6" />, iconBg: "bg-emerald-500/10 border-emerald-500/20", label: "Active", value: submodules.filter(s => s.is_active).length },
              { icon: <Award className="text-amber-400 w-6 h-6" />, iconBg: "bg-amber-500/10 border-amber-500/20", label: "Pro", value: submodules.filter(s => s.is_pro).length },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${stat.iconBg}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm transition-colors" style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{stat.label}</p>
                  <p className="text-2xl font-bold transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submodules List */}
        <div className="space-y-4">
          {submodules.map((submodule, index) => {
            const dc = getDifficultyConfig(submodule.difficulty, isDark);
            return (
<div
  key={submodule.id}
  className="group rounded-[1rem] overflow-hidden transition-all duration-500 relative"
  style={{
    background: isDark ? "#111827" : "#FFFFFF",
    // ── PERMANENT BLUE BORDER ──
    border: isDark 
      ? "2px solid rgba(16, 107, 211, 0.47)" 
      : "1px solid #E2E8F0",
    boxShadow: isDark 
      ? "0 20px 40px -15px rgba(0, 0, 0, 0.7)" 
      : "0 20px 25px -5px rgba(99, 102, 241, 0.08)",
    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-5px)";
    // Glow effect on hover: Brighter indigo-blue
    e.currentTarget.style.borderColor = isDark ? "rgba(99, 102, 241, 1)" : "rgba(99, 102, 241, 0.4)";
    e.currentTarget.style.boxShadow = isDark 
      ? "0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(99, 102, 241, 0.3)" 
      : "0 25px 30px -5px rgba(99, 102, 241, 0.15)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    // ── FIXED: Resets to Permanent Blue, NOT faint grey ──
    e.currentTarget.style.borderColor = isDark ? "rgba(16, 107, 211, 0.47)" : "#E2E8F0";
    e.currentTarget.style.boxShadow = isDark 
      ? "0 20px 40px -15px rgba(0, 0, 0, 0.7)" 
      : "0 20px 25px -5px rgba(99, 102, 241, 0.08)";
  }}
>
  {/* Inner Highlight for Dark Mode (Radius matched to 1rem) */}
  {isDark && (
    <div className="absolute inset-0 rounded-[1rem] pointer-events-none border border-white/5 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
  )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Number Badge */}
                      <div
                        className="w-10 h-10 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-semibold mb-2 flex items-center gap-2 flex-wrap transition-colors"
                          style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                        >
                          <span className="truncate">{submodule.name}</span>
                          {!submodule.is_active && (
                            <span
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium"
                              style={{
                                background: isDark ? "rgba(107,114,128,0.15)" : "rgba(107,114,128,0.10)",
                                color: isDark ? "#9CA3AF" : "#6B7280",
                                border: `1px solid ${isDark ? "rgba(107,114,128,0.25)" : "rgba(107,114,128,0.20)"}`,
                              }}
                            >
                              <FiEyeOff className="w-3 h-3" /> Disabled
                            </span>
                          )}
                        </h3>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Difficulty */}
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg"
                            style={{ background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}
                          >
                            {dc.label}
                          </span>

                          {/* Questions count */}
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                            style={{
                              background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)",
                              color: isDark ? "#A5B4FC" : "#4F46E5",
                              border: `1px solid ${isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.20)"}`,
                            }}
                          >
                            <FileText className="w-3 h-3" />
                            {submodule.questionCount || 0} Questions
                          </span>

                          {/* Pro badge */}
                          {submodule.is_pro && (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg"
                              style={{
                                background: isDark ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.08)",
                                color: isDark ? "#FBBF24" : "#D97706",
                                border: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.20)"}`,
                              }}
                            >
                              <Award className="w-3 h-3" /> Pro
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {subjectId && (
                        <Link
                          to={`/admin/review/${submodule.id}`}
                          className="text-white px-4 py-2 rounded-lg transition-all text-sm font-medium hover:scale-105"
                          style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
                        >
                          Verify
                        </Link>
                      )}
                      {subjectId && (
                        <Link
                          to={`/course/${subjectId}/${submodule.id}`}
                          state={{ from: `/admin/courses/${encodeURIComponent(moduleName)}?key=${key}&grade=${grade}&subjectName=${encodeURIComponent(subjectName)}` }}
                          className="text-white px-4 py-2 rounded-lg transition-all text-sm font-medium hover:scale-105"
                          style={{ background: "linear-gradient(135deg, #3B82F6, #06B6D4)" }}
                        >
                          Attempt
                        </Link>
                      )}

                      <input type="file" accept=".json,.zip" id={`questions-upload-${submodule.id}`} className="hidden" onChange={(e) => handleQuestionsFileChange(e, submodule)} />

                      {/* Add Questions */}
                     {/* Add Questions */}
<button
  type="button"
  onClick={() => document.getElementById(`questions-upload-${submodule.id}`)?.click()}
  disabled={uploadingSubmoduleId === submodule.id}
  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 hover:scale-105 hover:shadow-lg"
  style={{
    background: "linear-gradient(135deg, #6366F1, #3B82F6)",
    color: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(99,102,241,0.30)",
    border: "none",
  }}
>
  {uploadingSubmoduleId === submodule.id ? "Uploading..." : "＋ Add Questions"}
</button>

{/* Concept */}
<button
  onClick={() => openConceptModal(submodule)}
  className="px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 hover:scale-105 hover:shadow-lg"
  style={{
    background: "linear-gradient(135deg, #F59E0B, #D97706)",
    color: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(245,158,11,0.30)",
    border: "none",
  }}
>
  <FiBookOpen className="w-4 h-4" /> Concept
</button>

{/* Toggle */}
<button
  onClick={() => toggleSubmodule(submodule.id, submodule.is_active)}
  className="px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 hover:scale-105 hover:shadow-lg"
  style={{
    background: submodule.is_active
      ? "linear-gradient(135deg, #6B7280, #4B5563)"
      : "linear-gradient(135deg, #22C55E, #10B981)",
    color: "#FFFFFF",
    boxShadow: submodule.is_active
      ? "0 4px 12px rgba(107,114,128,0.30)"
      : "0 4px 12px rgba(34,197,94,0.30)",
    border: "none",
  }}
>
  {submodule.is_active
    ? <><FiEyeOff className="w-4 h-4" /><span className="hidden sm:inline">Disable</span></>
    : <><FiEye className="w-4 h-4" /><span className="hidden sm:inline">Enable</span></>
  }
</button>

{/* Delete */}
<button
  onClick={(e) => { e.stopPropagation(); setSelectedSubmoduleId(submodule.id); setShowDeleteModal(true); }}
  className="px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 hover:shadow-lg"
  style={{
    background: "linear-gradient(135deg, #EF4444, #DC2626)",
    color: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(239,68,68,0.30)",
    border: "none",
  }}
>
  <FiTrash2 className="w-4 h-4" />
</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {submodules.length === 0 && (
          <div
            className="text-center py-16 rounded-xl transition-colors"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
            }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.08)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.25)"}`,
              }}
            >
              <FileText className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
              No Chapters yet
            </h3>
            <p className="mb-6 transition-colors" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
              Create your first Chapter to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl transition-all font-semibold hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
            >
              <FiPlus className="text-xl" /> Add Chapter
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          title="Delete Chapter" itemName="Chapter"
          matchName={`${grade || "0"}/${subjectName || "Subject"}/${moduleName || "Module"}/${submodules.find(s => s.id === selectedSubmoduleId)?.name || ""}`}
          loading={deleting}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteSubmodule}
        />
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${isDark ? "#1F2937" : "#F1F5F9"}; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? "#374151" : "#C4B5FD"}; border-radius: 4px; }
      `}</style>

      <ValidationAlertModal isOpen={showValidationModal} onClose={() => setShowValidationModal(false)} errors={validationErrors} />

      {/* Concept Modal */}
      {showConceptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideDown max-h-[90vh] flex flex-col transition-colors"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
            }}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b flex justify-between items-center flex-shrink-0 transition-colors"
              style={{
                borderColor: isDark ? "#1F2937" : "#E2E8F0",
                background: isDark ? "#0B0F19" : "#F8FAFC",
              }}
            >
              <h3
                className="text-xl font-bold flex items-center gap-2 transition-colors"
                style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
              >
                <FiBookOpen className="text-amber-400" />
                Edit Concept
              </h3>
              <button
                onClick={() => setShowConceptModal(false)}
                className="transition-colors"
                style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
                onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#E5E7EB" : "#0F172A"}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#6B7280" : "#94A3B8"}
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="mb-4">
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                  style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
                >
                  Concept Content (Markdown / LaTeX supported)
                </label>
                <p className="text-xs mb-2 transition-colors" style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>
                  Use <code>$$formula$$</code> for LaTeX blocks and <code>$inline$</code> for inline math.
                </p>
                <textarea
                  className="w-full h-64 p-4 rounded-xl focus:outline-none font-mono text-sm resize-none transition-all"
                  style={{
                    background: isDark ? "#0B0F19" : "#F8FAFC",
                    border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                    color: isDark ? "#E5E7EB" : "#0F172A",
                  }}
                  value={conceptText}
                  onChange={(e) => setConceptText(e.target.value)}
                  placeholder="# Concept Title&#10;&#10;Explain the concept here...&#10;&#10;$$E = mc^2$$"
                  onFocus={(e) => e.target.style.borderColor = "#6366F1"}
                  onBlur={(e) => e.target.style.borderColor = isDark ? "#1F2937" : "#E2E8F0"}
                />

                {conceptText && (
                  <div className="mt-4 w-full">
                    <h4
                      className="text-sm font-semibold mb-2 transition-colors"
                      style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                    >
                      Preview:
                    </h4>
                    <div
                      className="p-4 rounded-xl overflow-y-auto overflow-x-auto transition-colors"
                      style={{
                        maxHeight: "70vh",
                        background: isDark ? "#0B0F19" : "#F8FAFC",
                        border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                      }}
                    >
                      <MarkdownRenderer>
                        {convertPlainTextToMarkdown(conceptText)}
                      </MarkdownRenderer>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
               <button
  onClick={() => setShowConceptModal(false)}
  className="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
  style={{

    background: isDark ? "#1F2937" : "#F1F5F9",
    

    color: isDark ? "#E5E7EB" : "#475569",
    
    border: isDark 
      ? "1px solid rgba(255, 255, 255, 0.15)" 
      : "1px solid #E2E8F0",
      

    boxShadow: isDark 
      ? "0 4px 12px rgba(0, 0, 0, 0.5)" 
      : "0 2px 4px rgba(0, 0, 0, 0.05)"
  }}
>
  Cancel
</button>
                <button
                  onClick={handleSaveConcept} disabled={savingConcept}
                  className="px-6 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-70 hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
                >
                  {savingConcept ? "Saving..." : "Save Concept"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubModuleList;