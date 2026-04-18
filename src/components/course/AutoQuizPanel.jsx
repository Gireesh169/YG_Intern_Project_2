import { BookOpen, CheckCircle2 ,XCircle,} from 'lucide-react';
import React from 'react'

const AutoQuizPanel = ({
    setShowAutoQuizPanel,
    subject,
    completedChaptersCount,
    totalChapters,
    autoQuizModules,
    IconComponent,
    setChapterSelection,
    chapterSelection,
    attemptedList,
    handleGenerateAutoQuiz

}) => {
    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAutoQuizPanel(false)}
        >
            <div
                className="bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl shadow-black/60 max-w-xl w-full mx-4 p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={() => setShowAutoQuizPanel(false)}
                    className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1F2937] hover:bg-[#374151] transition"
                >
                    <XCircle size={18} className="text-[#9CA3AF]" />
                </button>

                {/* Header */}
                <div className="mb-4">
                   <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">
    Auto Quiz Setup
</p>
<h2 className="text-xl font-bold text-[#E5E7EB]">
    Choose chapters for Auto Quiz
</h2>
<p className="text-sm text-[#6B7280]">
    Completed chapters are pre-selected. You can adjust as needed.
</p>
                </div>

                {/* Subject Info */}
                <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    {subject.grade && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">
    <BookOpen size={14} /> Grade {subject.grade}
</span>
                    )}
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
    <IconComponent size={14} /> {subject.name}
</span>

<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
    <CheckCircle2 size={14} />
    {completedChaptersCount}/{totalChapters} chapters completed
</span>
                </div>
<p className="text-sm font-medium text-[#9CA3AF] mb-2">
    Select all chapters taken in the school till now
</p>

                {/* Chapters List */}
                <div className="border border-[#1F2937] rounded-xl bg-[#0F172A] p-3 max-h-64 overflow-y-auto">
                    {autoQuizModules.length === 0 && (
                        <p className="text-xs  text-[#6B7280]">
                            No quizzes available for this subject.
                        </p>
                    )}

                    {autoQuizModules.map((module) => (
                        <div key={module.id} className="mb-4">
                            {/* Show module name only if multiple modules */}
                            {autoQuizModules.length > 1 && (
                                <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2">
                                    {module.name}
                                </h3>
                            )}

                            {module.subModules?.map((sub) => (
                                <label
                                    key={sub.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#1F2937] cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        className="accent-purple-600"
                                        checked={!!chapterSelection[sub.id]}
                                        onChange={() =>
                                            setChapterSelection((prev) => ({
                                                ...prev,
                                                [sub.id]: !prev[sub.id],
                                            }))
                                        }
                                    />

                                   <span className="flex-1 text-xs md:text-sm text-[#E5E7EB]">
                                        {sub.name}
                                        {autoQuizModules.length > 1 && (
                                            <span className="text-[#6B7280] ml-1">
                                                ({module.name})
                                            </span>
                                        )}
                                    </span>

                                    {attemptedList.includes(sub.id) && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
    Completed ✓
</span>
                                    )}
                                </label>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-[#9CA3AF]">
    Selected:
    <span className="text-indigo-400">
                                {" "}
                                {Object.values(chapterSelection).filter(Boolean).length}
                            </span>{" "}
                            chapters
                        </span>

                        <button
                            onClick={() => {
                                const cleared = {};
                                autoQuizModules.forEach((m) =>
                                    m.subModules?.forEach((s) => {
                                        cleared[s.id] = false;
                                    })
                                );
                                setChapterSelection(cleared);
                            }}
                         className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition"
                        >
                            Unselect All
                        </button>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowAutoQuizPanel(false)}
                           className="px-4 py-2 rounded-lg text-sm font-medium text-[#9CA3AF] bg-[#1F2937] hover:bg-[#374151] transition"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleGenerateAutoQuiz}
                            disabled={
                                Object.values(chapterSelection).filter(Boolean).length === 0
                            }
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
                        >
                            Generate Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AutoQuizPanel
