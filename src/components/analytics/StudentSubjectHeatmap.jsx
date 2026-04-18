import React from "react";
import { buildHeatmapData } from "../../utils/buildHeatmapData";
import { useTheme } from "../../utils/useTheme"; 

const getColor = (value) => {
  if (value == null) return "bg-[#1F2937] text-[#4B5563]"; 
  if (value >= 85) return "bg-[#059669] text-white shadow-[0_0_15px_rgba(5,150,105,0.3)]";
  if (value >= 70) return "bg-[#10B981] text-white";
  if (value >= 55) return "bg-[#F59E0B] text-gray-900";
  if (value >= 40) return "bg-[#F97316] text-white";
 // return "bg-[#DC2626] text-white";
};

const StudentSubjectHeatmap = ({ subjects }) => {
  const { xLabels, yLabels, data } = buildHeatmapData(subjects);
    const { theme } = useTheme();                  
  const isDark = theme === "dark";

  if (!data.length) return null;

  return (
  <div
  className="w-full rounded-2xl p-6 shadow-xl overflow-x-auto"
  onMouseEnter={e => {
    e.currentTarget.style.border = isDark
      ? '1px solid rgba(220,226,233,1)'
      : '1px solid rgba(99,102,241,0.5)';
    e.currentTarget.style.boxShadow = isDark
      ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 16px 3px rgba(220,226,233,0.2)'
      : '0 4px 16px rgba(99,102,241,0.08), 0 0 12px 3px rgba(99,102,241,0.15)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.border = isDark
      ? '1px solid rgba(220,226,233,0.8)'
      : '1px solid #E2E8F0';
    e.currentTarget.style.boxShadow = isDark
      ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)'
      : '0 4px 16px rgba(99,102,241,0.08)';
  }}
  style={{
    border: isDark ? "1px solid rgba(220,226,233,0.8)" : "1px solid #E2E8F0",
    backgroundColor: isDark ? "#111827" : "#FFFFFF",
    boxShadow: isDark
      ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 20px rgba(99,102,241,0.05)"
      : "0 4px 16px rgba(99,102,241,0.08)",
    transition: "border 0.3s ease, box-shadow 0.3s ease",
  }}
>
      <h2 className="text-xl font-semibold mb-1 text-[#E5E7EB]">📊 Subject Performance Heatmap</h2>
      <p className="text-sm text-[#6B7280] mb-4">Metrics across subjects</p>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `140px repeat(${xLabels.length}, 90px)`,
        }}
      >
        {/* empty corner */}
        <div></div>

        {/* SUBJECT LABELS */}
        {xLabels.map((label, i) => (
          <div key={i} className="text-center text-xs font-bold uppercase tracking-wider text-[#9CA3AF] break-words px-1">
            {label}
          </div>
        ))}

        {/* ROWS */}
        {yLabels.map((rowLabel, rowIndex) => (
          <React.Fragment key={rowLabel}>
            <div className="text-right pr-4 font-bold text-sm text-[#E5E7EB]">
              {rowLabel}
            </div>

            {data[rowIndex].map((value, colIndex) => {
              const displayValue = value == null ? 0 : Math.round(value);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`h-12 flex items-center justify-center rounded-md text-sm font-semibold ${getColor(
                    value
                  )}`}
                >
                  {displayValue}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap gap-4 mt-5 text-xs">
       <Legend color="bg-[#059669]" label="85–100 Excellent" />
  <Legend color="bg-[#10B981]" label="70–84 Good" />
  <Legend color="bg-[#F59E0B]" label="55–69 Average" />
  <Legend color="bg-[#F97316]" label="40–54 Low" />
  <Legend color="bg-[#DC2626]" label="0–39 Needs Help" />
  <Legend color="bg-[#1F2937]" label="No Attempt (Shown as 0)" />
      </div>
    </div>
  );
};

const Legend = ({ color, label }) => (
  <div className="flex items-center gap-2 bg-[#1F2937]/50 px-3 py-1.5 rounded-lg border border-[#374151]">
    <span className={`h-3 w-3 rounded-full ${color}`} />
    <span className="text-[#9CA3AF] text-[11px] font-medium">{label}</span>
  </div>
);

export default StudentSubjectHeatmap;


