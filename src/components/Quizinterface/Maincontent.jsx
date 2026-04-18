import { GripVertical, Lightbulb, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import LatexRenderer from "../common/LatexRenderer";
import VoiceExplanationPlayer from "../common/VoiceExplanationPlayer";
import FillBlanksQuestion from "../quiz/FillBlanksQuestion";
import TrueFalseQuestion from "../quiz/TrueFalseQuestion";
import MatchFollowingQuestion from "../quiz/MatchFollowingQuestion";
import MultiSelectQuestion from "../quiz/MultiSelectQuestion";
import MarkdownRenderer from "../common/MarkdownRenderer";
import { imageSupabase } from "../../config/imageSupabase";
import { useTheme } from "../../utils/useTheme";






const buildPublicImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // Ensure the path is raw (decode any accidental encoding)
  const rawPath = decodeURIComponent(imagePath);

  // Get public URL from Supabase Storage SDK
  const { data } = imageSupabase.storage
    .from("question-assets")
    .getPublicUrl(rawPath);

  const url = data?.publicUrl || null;

  // Debug logging to verify raw path and generated URL
  console.log("IMAGE DEBUG | rawPath:", rawPath, "| publicUrl:", url);

  return url;
};
function convertPlainTextToMarkdown(text) {
  if (!text) return "";

  const lines = text.split("\n");

  let output = [];
  let tableBuffer = [];

  const isBullet = (line) =>
    line.trim().startsWith("•") ||
    line.trim().startsWith("-") ||
    line.trim().startsWith("*");

  const isTableRow = (line) =>
    !isBullet(line) && line.includes("\t") && line.split("\t").length >= 2;

  for (let line of lines) {
    if (isTableRow(line)) {
      const cols = line.split("\t").map((c) => c.trim());
      tableBuffer.push(cols);
    } else {
      if (tableBuffer.length > 0) {
        output.push(buildMarkdownTable(tableBuffer));
        tableBuffer = [];
      }
      output.push(line);
    }
  }

  if (tableBuffer.length > 0) {
    output.push(buildMarkdownTable(tableBuffer));
  }

  return output.join("\n\n");
}
function buildMarkdownTable(rows) {
  if (rows.length < 2) return "";

  const header = rows[0].join(" | ");
  const separator = rows[0].map(() => "---").join(" | ");
  const body = rows
    .slice(1)
    .map((r) => r.join(" | "))
    .join("\n");

  return `${header}\n${separator}\n${body}`;
}

const MainContent = ({
  mainContentRef,
  showConceptPanel,
  moduleData,
  isShaking,
  savedAnswer,
  currentQuestion,
  currentQuestionIndex,
  data,
  setEnlargedImageSrc,
  containerRef,
  imageWrapperRef,
  showQuestionExplanationPanel,
  answersRef,
  selectedOption,
  isCorrect,
  handleOptionSelect,
  currentQid,
  setAnswers,
  handlePrevious,
  handleNext,
  showAttemptWarning,
  attemptedCount,
  revisionRef,
  showAnswerExplanationPanel,
  revisionData,
  embeddedPdfSrc,
  currentSubmodule,
  setShowConceptPanel,
  handleQuestionAnswer,
  handleQuizSubmit,
  isQuizCompleted,
  isSubmitting,
  setShowAnswerExplanationPanel,
  setShowQuestionExplanationPanel,
  setEmbeddedPdfSrc,
  setRevisionData,
  setShowanswer,
  markAttemptTypeIfNotSet,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // Resizable Passage State
  const [passageWidth, setPassageWidth] = useState(38); // percentage
  const [isResizing, setIsResizing] = useState(false);
  // Resizable Concept Panel State
  const [conceptWidth, setConceptWidth] = useState(50); // percentage
  const [isResizingConcept, setIsResizingConcept] = useState(false);
  // Resizable Image State
  const [imageWidth, setImageWidth] = useState(60); // Default 60%
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const isReported = answersRef.current[currentQid]?.report || false;
  const isImportant = answersRef.current[currentQid]?.importance || false;
  
  

  const startResizingImage = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingImage(true);
  }, []);

  const stopResizingImage = useCallback(() => {
    setIsResizingImage(false);
  }, []);

  const resizeImage = useCallback(
    (e) => {
      if (isResizingImage && imageWrapperRef.current) {
        const wrapper = imageWrapperRef.current;
        const parent = wrapper.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          // Calculate new width based on mouse distance from the center of the container
          // Since the image is centered, the width is roughly 2 * (mouseX - centerX)
          const centerX = parentRect.left + parentRect.width / 2;
          const mouseDistFromCenter = e.clientX - centerX;

          // We only care about positive distance (right side drag)
          // If dragging to left of center, this logic flips, but handle is on right so it's fine.

          const newWidthPx = mouseDistFromCenter * 2;
          const newWidthPercent = (newWidthPx / parentRect.width) * 100;

          if (newWidthPercent > 10 && newWidthPercent <= 100) {
            setImageWidth(newWidthPercent);
          }
        }
      }
    },
    [isResizingImage],
  );

  useEffect(() => {
    if (isResizingImage) {
      window.addEventListener("mousemove", resizeImage);
      window.addEventListener("mouseup", stopResizingImage);
    } else {
      window.removeEventListener("mousemove", resizeImage);
      window.removeEventListener("mouseup", stopResizingImage);
    }
    return () => {
      window.removeEventListener("mousemove", resizeImage);
      window.removeEventListener("mouseup", stopResizingImage);
    };
  }, [isResizingImage, resizeImage, stopResizingImage]);

  const toggleReport = () => {
    const qid = currentQid;
    if (!qid) return;

    const prev = answersRef.current[qid] || {};

    const next = {
      ...prev,
      report: !prev.report,
    };

    answersRef.current = {
      ...answersRef.current,
      [qid]: next,
    };

    setAnswers({ ...answersRef.current });
  };
  const toggleImportance = () => {
    const qid = currentQid;
    if (!qid) return;

    const prev = answersRef.current[qid] || {};

    const next = {
      ...prev,
      importance: !prev.importance, // ✅ boolean toggle
    };

    answersRef.current = {
      ...answersRef.current,
      [qid]: next,
    };

    setAnswers({ ...answersRef.current });
  };
  const buildPdfUrlAtPage = (url, page) => {
    if (!url) return null;
    const safePage = page && Number(page) > 0 ? Number(page) : 1;

    if (url.includes("#page=")) {
      return url.replace(/#page=\d+/, `#page=${safePage}`);
    }

    return `${url}#page=${safePage}`;
  };
  const handleOpenPdfFromRevision = () => {
    const q = data[currentQuestionIndex];
    if (!q) return;

    const pdfUrl =
      q.sourceTextbookUrl ?? q.pdf_url ?? q.reference_pdf_url ?? null;

    const pageNumber = q.pageNumber ?? q.page ?? q.page_no ?? q.pg ?? null;

    if (!pdfUrl) {
      alert("No PDF source available for this question.");
      return;
    }

    const finalUrl = buildPdfUrlAtPage(pdfUrl, pageNumber);
    window.open(finalUrl, "_blank");
  };



// ✅ REPLACE WITH THIS
const handleshowAnswerExplanationPanel = () => {
    setActivePanel(prev => prev === 'answer' ? null : 'answer');

    const q = data[currentQuestionIndex];
    if (!q) return;

    const qid = q._id;

    markAttemptTypeIfNotSet(qid, "revision");

    const updatedPrev = answersRef.current[qid] || {};

    answersRef.current = {
      ...answersRef.current,
      [qid]: {
        ...updatedPrev,
        is_showAnswer: true,
        is_revision: true,
      },
    };

    setAnswers({ ...answersRef.current });
    setShowAnswerExplanationPanel(prev => !prev); // ✅ toggle instead of always true
  };
  const handleconcept = () => {
    setShowQuestionExplanationPanel(false);
    const q = data[currentQuestionIndex];
    if (!q) return;
    const qid = q._id;
    markAttemptTypeIfNotSet(qid, "revision");

    const prev = answersRef.current[qid] || {};

    console.log("concept CLICKED:");
    answersRef.current = {
      ...answersRef.current,
      [qid]: {
        ...prev,
        is_concept: true,
        is_revision: true,
      },
    };
    setShowConceptPanel((prev) => !prev);
  };


  // ✅ REPLACE WITH THIS
const handleShowQuestionExplaination = () => {
    setActivePanel(prev => prev === 'question' ? null : 'question');
    setShowConceptPanel(false);

    const q = data[currentQuestionIndex];
    if (!q) return;

    const qid = q._id;
    markAttemptTypeIfNotSet(qid, "revision");

    const prev = answersRef.current[qid] || {};

    answersRef.current = {
      ...answersRef.current,
      [qid]: {
        ...prev,
        is_revision: true,
        is_questionExplanation: true,
      },
    };

    setRevisionData({
      explanation_question: q.explanation_question ?? null,
      explanation_answer: q.explanation_answer ?? q.explanation ?? null,
    });

    setAnswers({ ...answersRef.current });
    setShowQuestionExplanationPanel(prev => !prev); // ✅ toggle instead of always true
  };
  const normalizedPdfInfoFromQuestion = (q) => {
    if (!q) return { url: null, page: null, explanation: null };

    return {
      url: q.sourceTextbookUrl ?? null,
      page: q.pageNumber ?? null,
      explanation: q.explanation ?? null,
    };
  };

  const {
    url: currentPdfUrl,
    page: currentPdfPage,
    explanation: currentExplanation,
  } = normalizedPdfInfoFromQuestion(currentQuestion);

  const questionImageUrl = currentQuestion?.imageName
    ? buildPublicImageUrl(currentQuestion.imageName)
    : null;

  const allAttempted = data.length > 0 && attemptedCount === data.length;

  // -------------------------
  // Resizing Logic
  // -------------------------
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth =
          ((mouseMoveEvent.clientX - containerRect.left) /
            containerRect.width) *
          100;
        // Limit width between 20% and 70%
        if (newWidth > 20 && newWidth < 70) {
          setPassageWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // -------------------------
  // Concept Resizing Logic
  // -------------------------
  const startResizingConcept = useCallback(() => {
    setIsResizingConcept(true);
  }, []);

  const stopResizingConcept = useCallback(() => {
    setIsResizingConcept(false);
  }, []);

  const resizeConcept = useCallback(
    (mouseMoveEvent) => {
      if (isResizingConcept && mainContentRef.current) {
        const containerRect = mainContentRef.current.getBoundingClientRect();
        // Calculate width from the RIGHT edge since concept panel is on the right
        const newWidth =
          ((containerRect.right - mouseMoveEvent.clientX) /
            containerRect.width) *
          100;

        // Limit width between 20% and 80%
        if (newWidth > 20 && newWidth < 80) {
          setConceptWidth(newWidth);
        }
      }
    },
    [isResizingConcept],
  );

  useEffect(() => {
    if (isResizingConcept) {
      window.addEventListener("mousemove", resizeConcept);
      window.addEventListener("mouseup", stopResizingConcept);
    } else {
      window.removeEventListener("mousemove", resizeConcept);
      window.removeEventListener("mouseup", stopResizingConcept);
    }
    return () => {
      window.removeEventListener("mousemove", resizeConcept);
      window.removeEventListener("mouseup", stopResizingConcept);
    };
  }, [isResizingConcept, resizeConcept, stopResizingConcept]);



  const btnClass = (panel) => {
    const isActive = activePanel === panel;
    return `px-3 py-1.5 text-xs rounded-lg transition-all border ${
      isActive
        ? isDark
          ? "bg-indigo-500/30 text-indigo-300 border-indigo-400 font-bold"
          : "bg-indigo-100 text-indigo-800 border-indigo-500 font-bold"
        : isDark
          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-normal"
          : "bg-indigo-50 text-indigo-700 border-transparent font-normal"
    }`;
  };


  return (
    <div
      ref={mainContentRef}
      className="flex-1 flex gap-0 items-stretch relative" // Changed from gap-6 items-start to gap-0 items-stretch
    >
      {/* Main Question Area (Left) */}
      <div
        className="flex flex-col min-w-0 transition-all duration-75 ease-out"
        style={{
          width: showConceptPanel ? `${100 - conceptWidth}%` : "100%",
          flex: showConceptPanel ? "none" : "1",
        }}
      >
        <div
          className={`flex-1 overflow-visible space-y-6 ${showConceptPanel ? "pr-4" : "pr-0"}`}
        >
          <button
            onClick={() => handleconcept()}
            className={`px-3 py-1 text-sm rounded-lg font-semibold transition-all flex items-center gap-1 ${
              showConceptPanel
                ? isDark
                  ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                  : "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                : isDark
                  ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  : "bg-amber-50 text-amber-600 hover:bg-amber-100"
            }`}
          >
            <Lightbulb size={16} />
            Concept of Chapter: {moduleData?.subjectName} -{" "}
            {moduleData?.textbookName} - {moduleData?.chapterName}
          </button>
          {/* Question Card */}
<div
className={`backdrop-blur-sm rounded-2xl p-5 border-2 transition-all duration-300 
${isShaking ? "animate-shake" : ""}

${isDark 
? "bg-[#111827] border-[#374151] text-white shadow-lg shadow-black/30 "
: "bg-white border-indigo-200 text-gray-900 shadow-md shadow-indigo-200/50 "
}
`}
>

            
            <div className="md:hidden flex flex-col gap-3 mb-4">
              {/* LEFT */}
              <div className="flex flex-col">
                {(() => {
                  const smId =
                    currentQuestion.sub_module_id ||
                    currentQuestion.submoduleId ||
                    currentQuestion.submodule_id;

                  const smName = location.state?.subModuleMap?.[smId];

                  if (!smName) return null;

                  return (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md w-fit mb-1 border border-purple-200">
                      {smName}
                    </span>
                  );
                })()}

                <span className="text-gray-600 text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {data.length}
                </span>
              </div>

              {/* BUTTONS */}
              <div
                className={`flex flex-col gap-2 px-3 py-2 rounded-xl border  ${isDark ? "bg-[#1F2937] border-[#374151]" : "bg-white/80 border-indigo-200"}`}
              >
                <div className="flex flex-wrap gap-1">
                  <button onClick={handleShowQuestionExplaination} className={btnClass('question')}>
  <span>📘</span> Explain Question
</button>
<button onClick={handleshowAnswerExplanationPanel} className={btnClass('answer')}>
  <span>📗</span> Explain Answer
</button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={toggleReport}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${isDark ? "bg-[#1F2937] text-[#9CA3AF] border border-[#374151]" : "bg-gray-100 text-gray-600"}`}
                  >
                    👎 Report
                  </button>

                  <button
                    onClick={toggleImportance}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${isDark ? "bg-[#1F2937] text-[#9CA3AF] border border-[#374151]" : "bg-gray-100 text-gray-600"}`}
                  >
                    ⭐ Important
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-between mb-4">
              {/* LEFT */}
              <div className="flex flex-col">
                {(() => {
                  const smId =
                    currentQuestion.sub_module_id ||
                    currentQuestion.submoduleId ||
                    currentQuestion.submodule_id;

                  const smName = location.state?.subModuleMap?.[smId];

                  if (!smName) return null;

                  return (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md w-fit mb-1 border border-purple-200">
                      {smName}
                    </span>
                  );
                })()}

                <span
                  className={`text-sm font-medium transition-colors ${isDark ? "text-[#9CA3AF]" : "text-gray-600"}`}
                >
                  Question {currentQuestionIndex + 1} of {data.length}
                </span>
              </div>

              {/* BUTTONS */}
             <div
 className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
shadow-md hover:shadow-lg
${isDark
 ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 shadow-indigo-900/40"
 : "bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 shadow-indigo-200"}
hover:scale-[1.03] active:scale-[0.97]
`}
>

<button
  onClick={handleShowQuestionExplaination}
  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
  ${activePanel === 'question'
    ? isDark
      ? "bg-indigo-500 text-white border border-indigo-400 font-bold shadow-lg shadow-indigo-500/40 scale-110 z-10"
      : "bg-indigo-600 text-white border border-indigo-700 font-bold shadow-lg shadow-indigo-400/40 scale-110 z-10"
    : isDark
      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 scale-100"
      : "bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 scale-100"
  }
  hover:scale-[1.03] active:scale-[0.98]
  `}
>
  <span>📘</span>
  Explain Question
</button>


<button
  onClick={handleshowAnswerExplanationPanel}
  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
  ${activePanel === 'answer'
    ? isDark
      ? "bg-emerald-500 text-white border border-emerald-400 font-bold shadow-lg shadow-emerald-500/40 scale-105 z-10"
      : "bg-emerald-600 text-white border border-emerald-700 font-bold shadow-lg shadow-emerald-400/40 scale-110 z-10"
    : isDark
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 scale-100"
      : "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 scale-100"
  }
  hover:scale-[1.01] active:scale-[0.98]
  `}
>
  <span>📗</span>
  Explain Answer
</button>

<div className="flex gap-3">
  {/* Report Button */}
  <button
    onClick={toggleReport}
    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all duration-200
      /* Toggle Bold & Scale based on the isReported variable */
      ${isReported ? "font-bold scale-[1.05]" : "font-medium scale-100"}
      
      ${isDark
        ? isReported 
          ? "bg-rose-500/30 text-rose-200 border border-rose-500 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]" 
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
        : isReported 
          ? "bg-rose-200 text-rose-900 border border-rose-400 shadow-sm" 
          : "bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100"}
    `}
  >
    👎 Report
  </button>

  {/* Important Button */}
  <button
    onClick={toggleImportance}
    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all duration-200
      /* Toggle Bold & Scale based on the isImportant variable */
      ${isImportant ? "font-bold scale-[1.05]" : "font-medium scale-100"}
      
      ${isDark
        ? isImportant 
          ? "bg-amber-500/30 text-amber-200 border border-amber-500 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]" 
          : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
        : isImportant 
          ? "bg-amber-200 text-amber-900 border border-amber-400 shadow-sm" 
          : "bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100"}
    `}
  >
    ⭐ Important
  </button>
</div>

</div>
            </div>

            <div
              ref={containerRef}
              className={`mt-2 flex gap-2 ${currentQuestion.passageText ? "items-stretch" : "items-stretch"}`}
            >
              {currentQuestion.passageText && (
                <>
                  <div
                    style={{ width: `${passageWidth}%` }}
                    className={`relative rounded-xl overflow-hidden flex-shrink-0 transition-colors ${isDark ? "bg-[#0F172A] border border-[#1F2937]" : "bg-white/70 border border-indigo-200"}`}
                  >
                    <div className="absolute inset-0 overflow-y-auto p-3 no-scrollbar">
                      {currentQuestion.passageTitle && (
                        <div
                          className={`font-semibold text-lg mb-2 transition-colors ${isDark ? "text-[#E5E7EB]" : "text-indigo-900"}`}
                        >
                          {currentQuestion.passageTitle}
                        </div>
                      )}
                      <div
                        className={`text-lg whitespace-pre-line transition-colors ${isDark ? "text-[#D1D5DB]" : "text-gray-800"}`}
                      >
                        <LatexRenderer>
                          {currentQuestion.passageText}
                        </LatexRenderer>
                      </div>
                    </div>
                  </div>

                  {/* Resizer Handle */}
                  <div
                    className={`w-5 cursor-col-resize flex flex-col justify-center items-center group rounded-lg transition-colors mx-1 ${isDark ? "hover:bg-indigo-500/10" : "hover:bg-indigo-50"}`}
                    onMouseDown={startResizing}
                    title="Drag to resize passage"
                  >
                    <div
                      className={`w-1.5 h-12 rounded-full shadow-sm transition-colors ${isDark ? "bg-indigo-500/30 group-hover:bg-indigo-500 group-active:bg-cyan-400" : "bg-indigo-300 group-hover:bg-indigo-500 group-active:bg-indigo-700"}`}
                    ></div>
                  </div>
                </>
              )}

              <div className="flex-1">
                {currentQuestion.questionText &&
                  !["fillblanks"].includes(
                    currentQuestion.questionType,
                  ) && (
                    <div
                      className={`mb-3 text-base font-semibold leading-relaxed transition-colors ${isDark ? "text-[#E5E7EB]" : "text-indigo-900"}`}
                    >
                      <LatexRenderer>
                        {currentQuestion.questionText}
                      </LatexRenderer>
                    </div>
                  )}

                {questionImageUrl && (
                  <div className="mb-4 flex flex-col items-center w-full relative">
                    <div
                      ref={imageWrapperRef}
                      style={{ width: `${imageWidth}%`, position: "relative" }}
                      className="flex justify-center transition-[width] duration-75 ease-linear group/image"
                    >
                      <img
                        src={questionImageUrl}
                        alt={currentQuestion.imageCaption || "Question image"}
                        className={`w-full h-auto rounded-xl shadow-sm cursor-zoom-in hover:opacity-95 transition-opacity border ${isDark ? "border-indigo-500/30" : "border-indigo-300"}`}
                        onClick={() => setEnlargedImageSrc(questionImageUrl)}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />

                      <div
                        className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-8 h-20 cursor-col-resize flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity z-10"
                        onMouseDown={startResizingImage}
                        title="Drag to resize image"
                      >
                        <div
                          className={`w-4 h-10 rounded-full shadow-md flex items-center justify-center transition-colors border ${isDark ? "bg-[#111827] border-indigo-500/30 hover:bg-indigo-500/10" : "bg-white border-indigo-200 hover:bg-indigo-50"}`}
                        >
                          <GripVertical
                            size={14}
                            className={
                              isDark ? "text-indigo-400" : "text-indigo-400"
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {currentQuestion.imageCaption && (
                      <p className="mt-1 text-xs text-gray-600 text-center">
                        {currentQuestion.imageCaption}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {(() => {
                    switch (currentQuestion.questionType) {
                      case "mcq":
                        return currentQuestion.options.map((option) => {
                          const isSel =
                            selectedOption === option._id ||
                            savedAnswer.userAnswer === option._id;
                          const showCorrectness =
                            isSel &&
                            (isCorrect !== null ||
                              savedAnswer.isCorrect != null);
                          const isCorr = isCorrect ?? savedAnswer.isCorrect;
                          const wrongHighlight =
                            savedAnswer.attempted &&
                            savedAnswer.isCorrect === false &&
                            isSel &&
                            !isCorr
                              ? "border-red-500 bg-red-500/10"
                              : "";

                          return (
                            <button
                              key={option._id}
                              className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center gap-3 ${
                                isSel
                                  ? showCorrectness && isCorr
                                    ? isDark
                                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                                      : "bg-emerald-50 border-emerald-500 text-emerald-800"
                                    : showCorrectness
                                      ? isDark
                                        ? "bg-red-500/20 border-red-500/60 text-red-300"
                                        : "bg-red-100 border-red-400 text-red-800"
                                      : isDark
                                        ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-300"
                                        : "bg-indigo-100 border-indigo-400 text-indigo-900"
                                  : isDark
                                    ? "bg-[#0F172A] border-[#1F2937] text-[#E5E7EB] hover:border-indigo-500/40 hover:bg-indigo-500/10"
                                    : "bg-white border-gray-200 text-gray-800 hover:border-indigo-300 hover:bg-indigo-50"
                              } ${wrongHighlight}`}
                              onClick={() => handleOptionSelect(option._id)}
                              disabled={savedAnswer.attempted}
                            >
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "border-indigo-500 bg-indigo-500" : isDark ? "border-[#374151]" : "border-gray-400"}`}
                              >
                                {isSel && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                )}
                              </div>
                              <span className="flex-1">
                                <LatexRenderer>
                                  {option.optionText}
                                </LatexRenderer>
                              </span>
                            </button>
                          );
                        });

                      case "truefalse":
                        return (
                          <TrueFalseQuestion
                            question={currentQuestion}
                            onAnswer={handleQuestionAnswer}
                            savedAnswer={savedAnswer?.userAnswer}
                            isAnswered={savedAnswer?.attempted}
                          />
                        );

                      case "fillblanks":
                        return (
                          <FillBlanksQuestion
                            question={currentQuestion}
                            onAnswer={handleQuestionAnswer}
                            savedAnswer={savedAnswer} // ✅ FIXED
                            isAnswered={savedAnswer?.attempted}
                          />
                        );

                      case "matchfollowing":
                        return (
                          <MatchFollowingQuestion
                            key={currentQuestion._id} // ✅ FORCE RESET BETWEEN QUESTIONS
                            question={currentQuestion}
                            onAnswer={handleQuestionAnswer}
                            savedAnswer={savedAnswer?.userAnswer ?? null}
                            isAnswered={!!savedAnswer?.attempted}
                          />
                        );

                      case "multi":
                        return (
                          <MultiSelectQuestion
                            question={currentQuestion}
                            onAnswer={handleQuestionAnswer}
                            savedAnswer={savedAnswer?.userAnswer ?? []}
                            isAnswered={savedAnswer?.attempted}
                          />
                        );

                      case "math":
                        return (
                          <MathInput
                            question={currentQuestion}
                            savedAnswer={savedAnswer}
                            isAnswered={savedAnswer?.attempted}
                            onAnswer={(valObj, isValid) => {
                              // Calculate correctness
                              // 1. Get correct answer from question
                              const correctRaw =
                                currentQuestion.correctAnswer ||
                                currentQuestion.correct_answer ||
                                currentQuestion.correct_answer_text;

                              // 2. Parse both to latex
                              const userLatex = valObj.latex;
                              const { latex: correctLatex } = parseMathToLatex(
                                String(correctRaw),
                              );

                              // 3. Compare
                              const normalize = (s) =>
                                (s || "").replace(/\s/g, "");
                              const isCorrect =
                                isValid &&
                                normalize(userLatex) ===
                                  normalize(correctLatex);

                              // 4. Submit
                              handleQuestionAnswer(valObj, isCorrect);
                            }}
                          />
                        );

                      default:
                        return (
                          <div className="text-center text-red-500 p-3 bg-red-50 rounded-xl text-sm">
                            Unsupported question type:{" "}
                            {currentQuestion.questionType}
                          </div>
                        );
                    }
                  })()}
                </div>
              </div>
            </div>

            {savedAnswer.importance && (
              <div
                className={`flex items-center gap-2 text-xs p-2 rounded-lg transition-colors ${isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-yellow-50 text-yellow-700"}`}
              >
                <span className="text-lg">⭐</span>
                <span>This question is marked as important.</span>
              </div>
            )}

            {savedAnswer.report && (
              <div
                className={`flex items-center gap-2 text-xs p-2 rounded-lg transition-colors ${isDark ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-red-50 text-red-700"}`}
              >
                <span className="text-lg">👎</span>
                <span>This question is marked as reported.</span>
              </div>
            )}
          </div>

          {/* Notes */}
         <div
className={`backdrop-blur-sm rounded-2xl p-2 px-3 border transition-all duration-300

${isDark 
? "bg-[#111827]/95 border-[#374151] shadow-lg shadow-black/40 hover:border-indigo-500 hover:shadow-indigo-500/20"
: "bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-200/50 hover:shadow-indigo-300/60"
}
`}
>

<div
className={`flex items-center gap-2 mb-2 transition-colors 
${isDark ? "text-indigo-400" : "text-indigo-700"}
`}
>
<span className="text-lg">📝</span>

<span className="font-semibold text-sm tracking-wide">
Add Notes for this Question
</span>

</div>

<textarea

placeholder="Write your notes here..."

value={savedAnswer.notes ?? ""}

onChange={(e)=>{
const qid=currentQid;
const value=e.target.value;
const prev=answersRef.current[qid]||{};
answersRef.current={
...answersRef.current,
[qid]:{...prev,notes:value},
};
setAnswers({...answersRef.current});
}}

className={`w-full p-2 border rounded-xl transition-all duration-300 focus:outline-none

${isDark 
? "bg-[#0B0F19] border-[#374151] text-[#E5E7EB] placeholder-[#6B7280] focus:border-indigo-500 focus:shadow-md focus:shadow-indigo-500/20"
: "bg-white border-indigo-200 text-gray-800 focus:border-indigo-400 focus:shadow-md focus:shadow-indigo-200"
}
`}

rows={2}

/>

</div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-3 mt-3 pt-4 pb-4">
          <div className="flex justify-center gap-8 w-full">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-8 py-2.5 rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-3 transform hover:scale-105 ${
                currentQuestionIndex === 0
                  ? isDark
                    ? "bg-[#1F2937] text-[#6B7280] cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "text-white"
              }`}
              style={
                currentQuestionIndex !== 0
                  ? { background: "linear-gradient(135deg, #6366F1, #3B82F6)" }
                  : {}
              }
            >
              ← Previous
            </button>

            {currentQuestionIndex === data.length - 1 ? (
              <button
                onClick={handleQuizSubmit}
                disabled={!allAttempted || isQuizCompleted || isSubmitting}
                className={`px-8 py-2.5 rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                  isQuizCompleted
                    ? "bg-gray-400 text-white"
                    : !allAttempted
                      ? "bg-green-300 text-white cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isQuizCompleted
                  ? "Submitted!"
                  : isSubmitting
                    ? "Submitting..."
                    : "Submit Quiz"}{" "}
                {isQuizCompleted ? "" : "✓"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-10 py-2.5 rounded-lg font-bold text-white text-lg transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                }}
              >
                Next →
              </button>
            )}
          </div>

          <div className="h-6">
            {!allAttempted && showAttemptWarning ? (
              <div className="text-sm text-red-600 font-semibold mt-2">
                Please attempt all questions before submitting the quiz.
              </div>
            ) : !allAttempted ? (
              <div className="text-sm text-gray-600 mt-2">
                You have attempted {attemptedCount} of {data.length} questions.
                Answer all to enable Submit.
              </div>
            ) : null}
          </div>
        </div>

        {/* Revision horizontal panel — appears BELOW question area and stretches across content */}
        <div ref={revisionRef} className="mt-6">
          {showAnswerExplanationPanel && (
            <div
              className={`w-full rounded-2xl p-5 border shadow-md transition-all animate-fadeIn ${isDark ? "bg-[#111827] border-[#1F2937]" : "bg-white border-indigo-200"}`}
            >
              <div className="flex gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3
                        className={`text-lg font-semibold transition-colors ${isDark ? "text-[#E5E7EB]" : "text-indigo-900"}`}
                      >
                        Answer Explanation
                      </h3>

                      <VoiceExplanationPlayer
                        text={revisionData?.explanation_answer ?? ""}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Close revision panel"
                        onClick={() => setShowAnswerExplanationPanel(false)}
                        className="px-3 py-1.5 rounded-md text-sm text-gray-500 hover:text-gray-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`text-lg leading-relaxed whitespace-pre-line transition-colors ${isDark ? "text-[#D1D5DB]" : "text-gray-800"}`}
                  >
                    {revisionData?.explanation_answer ? (
                      <LatexRenderer>
                        {revisionData?.explanation_answer}
                      </LatexRenderer>
                    ) : (
                      <div className="text-gray-400">
                        No answer explanation available.
                      </div>
                    )}
                  </div>
                </div>
                {/* ================= RIGHT PANEL ================= */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resizer Handle for Concept */}
      {showConceptPanel && (
        <div
          className={`w-6 cursor-col-resize flex flex-col justify-center items-center group transition-colors mx-0 z-20 ${isDark ? "hover:bg-indigo-500/10" : "hover:bg-indigo-50"}`}
          onMouseDown={startResizingConcept}
          title="Drag to resize concept panel"
        >
          <div
            className={`w-2.5 h-16 rounded-full shadow-md transition-colors ring-1 ring-white/10 ${isDark ? "bg-[#1F2937] group-hover:bg-indigo-500 group-active:bg-cyan-400" : "bg-gray-300 group-hover:bg-indigo-500 group-active:bg-indigo-700"}`}
          ></div>
        </div>
      )}
      {/* Right Column: Concept Side Panel */}
      {showConceptPanel && (
        <div
          className={`flex-shrink-0 backdrop-blur-xl rounded-2xl p-5 shadow-lg relative overflow-y-auto border-2 transition-colors ${isDark ? "bg-[#111827] border-[#1F2937]" : "bg-white/60 border-indigo-200"}`}
          style={{ width: `${conceptWidth}%`, height: "calc(100vh - 120px)" }}
        >
          <div
            className={`flex justify-between items-center mb-4 pb-2 border-b transition-colors ${isDark ? "border-[#1F2937]" : "border-indigo-100"}`}
          >
            <h3
              className={`font-bold text-lg flex items-center gap-2 transition-colors ${isDark ? "text-[#E5E7EB]" : "text-indigo-900"}`}
            >
              <Lightbulb size={20} className="text-amber-500 fill-amber-500" />
              {currentSubmodule?.title || currentSubmodule?.name
                ? `Concepts (Chapter: ${currentSubmodule.title || currentSubmodule.name})`
                : "Concepts"}
            </h3>
            <button
              onClick={() => setShowConceptPanel(false)}
              className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-indigo-500/10" : "hover:bg-indigo-100"}`}
            >
              <X size={20} className="text-gray-500 hover:text-red-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Real Concept Content */}
            {currentSubmodule?.description ? (
              <div
                className={`p-4 rounded-xl border shadow-sm overflow-x-auto transition-colors ${isDark ? "bg-[#0F172A] border-[#1F2937]" : "bg-indigo-50 border-indigo-100"}`}
              >
                <div
                  className={`concept-content text-sm leading-relaxed transition-colors ${isDark ? "text-[#D1D5DB]" : "text-gray-800"}`}
                >
                  <MarkdownRenderer>
                    {convertPlainTextToMarkdown(currentSubmodule.description)}
                  </MarkdownRenderer>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p>No concept available</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Resizer Handle for Question Explanation */}
      {showQuestionExplanationPanel && (
        <div
          className="w-6 cursor-col-resize flex flex-col justify-center items-center group hover:bg-purple-50 transition-colors mx-0 z-20"
          onMouseDown={startResizingConcept}
          title="Drag to resize question explanation panel"
        >
          <div className="w-2.5 h-16 bg-gray-300 group-hover:bg-purple-500 group-active:bg-purple-700 rounded-full shadow-md transition-colors ring-1 ring-white/50"></div>
        </div>
      )}
      {showQuestionExplanationPanel && (
        <div
          className={`flex-shrink-0 backdrop-blur-xl rounded-3xl shadow-xl relative overflow-hidden border transition-colors ${isDark ? "bg-[#111827] border-[#1F2937]" : "bg-gradient-to-br from-white/80 to-indigo-50/60 border-indigo-200"}`}
          style={{ width: `${conceptWidth}%`, height: "calc(100vh - 120px)" }}
        >
          <div className="h-full flex flex-col p-6 gap-6">
            {/* ================= HEADER ================= */}
            <div
              className={`flex items-center justify-between pb-4 border-b transition-colors ${isDark ? "border-[#1F2937]" : "border-indigo-100"}`}
            >
              <div className="flex items-center gap-3">
                <h3
                  className={`text-xl font-bold transition-colors ${isDark ? "text-[#E5E7EB]" : "text-indigo-900"}`}
                >
                  Question Explained — Step by Step
                </h3>

                <VoiceExplanationPlayer
                  text={revisionData?.explanation_question ?? ""}
                />
              </div>

              <button
                aria-label="Close revision panel"
                onClick={() => setShowQuestionExplanationPanel(false)}
                className="w-8 h-8 flex items-center justify-center
                   rounded-full text-gray-400 hover:text-gray-700
                   hover:bg-purple-100 transition"
              >
                ✕
              </button>
            </div>

            {/* ================= EXPLANATION ================= */}
            <div
              className={`flex-1 overflow-y-auto pr-2 text-lg leading-relaxed scrollbar-thin transition-colors ${isDark ? "text-[#D1D5DB] scrollbar-thumb-indigo-500/30" : "text-gray-800 scrollbar-thumb-indigo-200"}`}
            >
              {(revisionData?.explanation_question ?? "") ? (
                <LatexRenderer>
                  {revisionData?.explanation_question ?? ""}
                </LatexRenderer>
              ) : (
                <div className="text-gray-400 italic">
                  No question explanation available.
                </div>
              )}
            </div>

            {/* ================= SOURCE TEXTBOOK ================= */}
            <div
              className={`rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-colors ${isDark ? "bg-[#0F172A] border-[#1F2937]" : "bg-white border-indigo-200"}`}
            >
              <div
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${isDark ? "text-[#9CA3AF]" : "text-gray-700"}`}
              >
                📘 Source Textbook
              </div>

              <div
                className={`text-xs rounded-lg p-3 border transition-colors ${isDark ? "bg-[#111827] border-[#1F2937]" : "bg-gray-50 border-gray-200"}`}
              >
                {currentPdfUrl ? (
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 underline break-all"
                  >
                    {currentPdfUrl}
                  </a>
                ) : (
                  <span className="text-gray-400">
                    No textbook URL provided
                  </span>
                )}

                <div
                  className={`mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-full text-[11px] transition-colors ${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-700"}`}
                >
                  Page {currentPdfPage ?? "N/A"}
                </div>
              </div>

              <button
                onClick={handleOpenPdfFromRevision}
                disabled={!currentPdfUrl}
                className={`w-full px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  currentPdfUrl
                    ? "text-white hover:opacity-90 shadow-sm"
                    : isDark
                      ? "bg-[#1F2937] text-[#6B7280] cursor-not-allowed"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                style={
                  currentPdfUrl
                    ? {
                        background: "linear-gradient(135deg, #6366F1, #3B82F6)",
                      }
                    : {}
                }
              >
                Open PDF at Page
              </button>

              {/* Inline PDF Viewer */}
              {embeddedPdfSrc && (
                <div className="rounded-xl overflow-hidden border">
                  <iframe
                    title="Source PDF"
                    src={embeddedPdfSrc}
                    className="w-full h-64 border-0"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />

                  <div className="flex justify-between p-2 bg-gray-50 border-t">
                    <button
                      onClick={() =>
                        window.open(
                          embeddedPdfSrc,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      className="text-xs px-3 py-1 rounded-md bg-white border hover:bg-gray-100"
                    >
                      Open in new tab
                    </button>

                    <button
                      onClick={() => setEmbeddedPdfSrc(null)}
                      className="text-xs px-3 py-1 rounded-md bg-white border hover:bg-gray-100"
                    >
                      Close viewer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
