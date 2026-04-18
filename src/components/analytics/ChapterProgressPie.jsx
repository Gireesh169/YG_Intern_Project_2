import React from "react";

const ChapterProgressPie = ({ stats, questionCount }) => {
    const uniqueCorrect = Number(stats?.totalCorrectUnique ?? 0);
    const uniqueIncorrect = Number(stats?.totalIncorrectUnique ?? 0);
    const totalUniqueAttended = Number(stats?.totalUniqueAttended ?? 0);

    const hasActivity = uniqueCorrect > 0 || uniqueIncorrect > 0;
    const attendedCount = totalUniqueAttended > 0 ? totalUniqueAttended : uniqueCorrect + uniqueIncorrect;
    const totalQ = Number(questionCount) || 0;
    const notAttempted = Math.max(totalQ - attendedCount, 0);

    const accuracy = uniqueCorrect + uniqueIncorrect > 0
        ? Math.round((uniqueCorrect / (uniqueCorrect + uniqueIncorrect)) * 100)
        : 0;

    const size = 64;
    const cx = 32;
    const cy = 32;
    const r = 24;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * r;

    // No data
    if (!hasActivity && totalQ === 0) {
        return (
            <div className="relative w-16 h-16 flex items-center justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Outer glow ring */}
                    <circle cx={cx} cy={cy} r={r + 4} fill="none"
                        stroke="#6366F1" strokeWidth="0.5" strokeOpacity="0.2"
                        strokeDasharray="3 3" />
                    {/* Main ring */}
                    <circle cx={cx} cy={cy} r={r} fill="none"
                        stroke="#1F2937" strokeWidth={strokeWidth} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] text-[#6B7280]">—</span>
                </div>
            </div>
        );
    }

    // All unattempted
    if (!hasActivity && totalQ > 0) {
        return (
            <div className="relative w-16 h-16 flex items-center justify-center group">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Dashed outer orbit */}
                    <circle cx={cx} cy={cy} r={r + 4} fill="none"
                        stroke="#6366F1" strokeWidth="0.5" strokeOpacity="0.3"
                        strokeDasharray="2 4" />
                    {/* Track */}
                    <circle cx={cx} cy={cy} r={r} fill="none"
                        stroke="#1F2937" strokeWidth={strokeWidth} />
                    {/* Subtle glow dot at top */}
                    <circle cx={cx} cy={cy - r} r="2.5" fill="#6366F1" opacity="0.6" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-bold text-[#6B7280]">{totalQ}</span>
                    <span className="text-[8px] text-[#6B7280]">qs</span>
                </div>
            </div>
        );
    }

    // Has activity
    const total = uniqueCorrect + uniqueIncorrect + notAttempted;
    const gap = 0.03;

    const segments = [
        { value: uniqueCorrect, color: "#22C55E", glow: "#22C55E" },
        { value: uniqueIncorrect, color: "#EF4444", glow: "#EF4444" },
        { value: notAttempted, color: "#1F2937", glow: null },
    ].filter(s => s.value > 0);

    let cumulativeOffset = 0;
    const arcs = segments.map((seg) => {
        const fraction = (seg.value / total) * (1 - gap * segments.length);
        const dashArray = `${fraction * circumference} ${circumference}`;
        const dashOffset = -(cumulativeOffset * circumference);
        cumulativeOffset += fraction + gap;
        return { ...seg, dashArray, dashOffset };
    });

    const glowColor = accuracy >= 70 ? "#22C55E" : accuracy >= 40 ? "#F59E0B" : "#EF4444";
    const textColor = accuracy >= 70 ? "text-emerald-400" : accuracy >= 40 ? "text-amber-400" : "text-red-400";

    return (
        <div className="relative w-16 h-16 flex items-center justify-center group">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
                style={{ transform: "rotate(-90deg)" }}>

                {/* Outer dashed orbit ring */}
                <circle cx={cx} cy={cy} r={r + 5} fill="none"
                    stroke="#6366F1" strokeWidth="0.5" strokeOpacity="0.25"
                    strokeDasharray="2 4" />

                {/* Glow filter */}
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Track */}
                <circle cx={cx} cy={cy} r={r} fill="none"
                    stroke="#0F172A" strokeWidth={strokeWidth + 1} />

                {/* Segments */}
                {arcs.map((arc, i) => (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={arc.dashArray}
                        strokeDashoffset={arc.dashOffset}
                        strokeLinecap="round"
                        filter={arc.glow ? "url(#glow)" : undefined}
                    />
                ))}

                {/* Outer accent dot — shows progress position */}
                <circle
                    cx={cx + (r + 2) * Math.cos(0)}
                    cy={cy + (r + 2) * Math.sin(0)}
                    r="2"
                    fill={glowColor}
                    opacity="0.8"
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[12px] font-extrabold leading-none ${textColor}`}>
                    {accuracy}%
                </span>
                <span className="text-[7px] text-[#6B7280] mt-0.5 font-medium tracking-wide">
                    {attendedCount}/{totalQ}
                </span>
            </div>

            {/* AI-style hover tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3
                hidden group-hover:flex flex-col gap-1.5
                w-36 z-50 pointer-events-none">

                {/* Glass card */}
                <div className="rounded-xl p-3 border border-indigo-500/20"
                    style={{
                        background: "rgba(17,24,39,0.95)",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 0 24px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.5)"
                    }}>

                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-[#1F2937]">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                            AI Analysis
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"
                                    style={{ boxShadow: "0 0 4px #22C55E" }} />
                                <span className="text-[10px] text-[#9CA3AF]">Correct</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400">{uniqueCorrect}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-400"
                                    style={{ boxShadow: "0 0 4px #EF4444" }} />
                                <span className="text-[10px] text-[#9CA3AF]">Wrong</span>
                            </div>
                            <span className="text-[10px] font-bold text-red-400">{uniqueIncorrect}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#374151]" />
                                <span className="text-[10px] text-[#9CA3AF]">Remaining</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#6B7280]">{notAttempted}</span>
                        </div>

                        {/* Accuracy bar */}
                        <div className="pt-1.5 border-t border-[#1F2937]">
                            <div className="flex justify-between mb-1">
                                <span className="text-[9px] text-[#6B7280]">Accuracy</span>
                                <span className={`text-[9px] font-bold ${textColor}`}>{accuracy}%</span>
                            </div>
                            <div className="w-full h-1 bg-[#1F2937] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${accuracy}%`,
                                        background: `linear-gradient(90deg, ${glowColor}, ${glowColor}88)`,
                                        boxShadow: `0 0 6px ${glowColor}`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Arrow */}
                <div className="self-center w-0 h-0
                    border-l-[5px] border-r-[5px] border-t-[5px]
                    border-l-transparent border-r-transparent border-t-indigo-500/20" />
            </div>
        </div>
    );
};

export default ChapterProgressPie;