import { useMemo, useState } from "react";
import { generateDummyStudents } from "../../../mock/generateStudents";

/* ================= CONFIG ================= */

const STUDENT_COUNT = 1000;
const ROWS_OPTIONS = [10, 25, 50, 100];

/* ================= UI HELPERS ================= */

const masteryColor = (value) => {
  if (value >= 75) return "#16a34a"; // green
  if (value >= 50) return "#f59e0b"; // yellow
  return "#dc2626"; // red
};

const ProgressBar = ({ value, color = "#2563eb" }) => (
  <div style={{ background: "#e5e7eb", height: 8, borderRadius: 4 }}>
    <div
      style={{
        width: `${value}%`,
        height: "100%",
        background: color,
        borderRadius: 4,
      }}
    />
  </div>
);

/* ================= PHASE 2 HELPERS ================= */

const getMasteryBuckets = (students) => {
  let strong = 0;
  let shallow = 0;
  let weak = 0;

  students.forEach((s) => {
    if (s.mastery >= 75) strong++;
    else if (s.mastery >= 50) shallow++;
    else weak++;
  });

  const total = students.length || 1;

  return {
    strongPct: Math.round((strong / total) * 100),
    shallowPct: Math.round((shallow / total) * 100),
    weakPct: Math.round((weak / total) * 100),
    strong,
    shallow,
    weak,
  };
};

const getCoverageBuckets = (students) => {
  const buckets = {
    "0-25": 0,
    "25-50": 0,
    "50-75": 0,
    "75-100": 0,
  };

  students.forEach((s) => {
    if (s.coverage < 25) buckets["0-25"]++;
    else if (s.coverage < 50) buckets["25-50"]++;
    else if (s.coverage < 75) buckets["50-75"]++;
    else buckets["75-100"]++;
  });

  return buckets;
};

const getPreviousValue = (current, range) => {
  const variance =
    range === "today" ? 2 :
      range === "7d" ? 4 :
        6;

  const drop = Math.floor(Math.random() * variance);
  return Math.max(0, current - drop);
};

const Card = ({ title, value, color }) => (
  <div
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      padding: 16,
      background: "#fff",
    }}
  >
    <div style={{ fontSize: 12, color: "#6b7280" }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 600, color: color || "#111" }}>
      {value}
    </div>
  </div>
);


/* ================= COMPONENT ================= */

const AdminStudentPerformance = () => {
  const students = useMemo(() => generateDummyStudents(STUDENT_COUNT), []);

  /* ================= FILTER STATE ================= */

  const [grade, setGrade] = useState("All");
  const [subject, setSubject] = useState("All");
  const [module, setModule] = useState("All");
  const [subModule, setSubModule] = useState("All");
  const [sortBy, setSortBy] = useState("mastery");
  const [timeRange, setTimeRange] = useState("7d");



  /* ================= PAGINATION ================= */

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /* ================= NORMALIZE DATA ================= */

  const rows = useMemo(() => {
    return students.map((s) => {
      const o = s.overall.stats;
      return {
        userId: s.userId,
        name: s.name,
        grade: o.grade,
        accuracy: o.accuracy,
        coverage: o.coverage,
        mastery: o.mastery,
        avgScore: o.avgScore,
        attendedTotal: o.attendedTotal,
        avgTime: o.avgTime,
        subjects: s.subjects.stats,
        modules: s.modules.stats,
        subModulesFlat: s.subModulesFlat.subModules,
      };
    });
  }, [students]);

  /* ================= FILTER OPTIONS ================= */

  const gradeOptions = useMemo(
    () => ["All", ...new Set(rows.map((r) => r.grade))],
    [rows]
  );

  const subjectOptions = useMemo(() => {
    const filtered =
      grade === "All" ? rows : rows.filter((r) => r.grade === Number(grade));
    const set = new Set();
    filtered.forEach((r) =>
      r.subjects.forEach((s) => set.add(s.subjectName))
    );
    return ["All", ...set];
  }, [rows, grade]);

  const moduleOptions = useMemo(() => {
    if (subject === "All") return ["All"];
    const set = new Set();
    rows.forEach((r) => {
      r.modules
        .filter((g) => g.groupName === subject)
        .forEach((g) =>
          g.modules.forEach((m) => set.add(m.moduleName))
        );
    });
    return ["All", ...set];
  }, [rows, subject]);

  const subModuleOptions = useMemo(() => {
    if (module === "All") return ["All"];
    const set = new Set();
    rows.forEach((r) => {
      r.subModulesFlat.forEach((sm) => {
        if (sm.subModuleName.startsWith(module)) set.add(sm.subModuleName);
      });
    });
    return ["All", ...set];
  }, [rows, module]);

  /* ================= APPLY FILTERS ================= */

  const filteredRows = useMemo(() => {
    let data = [...rows];
    if (grade !== "All") data = data.filter((r) => r.grade === Number(grade));
    if (subject !== "All")
      data = data.filter((r) =>
        r.subjects.some((s) => s.subjectName === subject)
      );
    if (module !== "All")
      data = data.filter((r) =>
        r.modules.some((g) =>
          g.modules.some((m) => m.moduleName === module)
        )
      );
    if (subModule !== "All")
      data = data.filter((r) =>
        r.subModulesFlat.some((sm) => sm.subModuleName === subModule)
      );



    data.sort((a, b) => b[sortBy] - a[sortBy]);
    return data;
  }, [rows, grade, subject, module, subModule, sortBy]);


  /* ================= KPIs ================= */

  const avgCoverage = Math.round(
    filteredRows.reduce((a, b) => a + b.coverage, 0) /
    (filteredRows.length || 1)
  );
  const avgMastery = Math.round(
    filteredRows.reduce((a, b) => a + b.mastery, 0) /
    (filteredRows.length || 1)
  );
  const atRiskCount = filteredRows.filter((s) => s.mastery < 50).length;

  /* ================= PHASE 3: KPI DELTAS ================= */

  const prevAvgCoverage = getPreviousValue(avgCoverage, timeRange);
  const prevAvgMastery = getPreviousValue(avgMastery, timeRange);

  const coverageDelta = avgCoverage - prevAvgCoverage;
  const masteryDelta = avgMastery - prevAvgMastery;


  /* ================= PHASE 2 DERIVED DATA ================= */

  const masteryBuckets = useMemo(
    () => getMasteryBuckets(filteredRows),
    [filteredRows]
  );

  const coverageBuckets = useMemo(
    () => getCoverageBuckets(filteredRows),
    [filteredRows]
  );

  const maxCoverageBucket = Math.max(
    ...Object.values(coverageBuckets),
    1
  );

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  /* ================= DOWNLOAD ================= */

  const downloadJson = () => {
    const blob = new Blob(
      [JSON.stringify(filteredRows, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-performance.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: 24, paddingTop: 88, background: "#f9fafb" }}>
      <h2 style={{ fontSize: 22, fontWeight: 600 }}>
        Student Coverage & Performance
      </h2>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>
        High-level overview of student learning breadth and depth
      </p>

      {/* ================= KPI STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card title="Total Students" value={filteredRows.length} />
        <Card
          title="Avg Coverage"
          value={
            <>
              {avgCoverage}%
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  color: coverageDelta >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {coverageDelta >= 0 ? "▲" : "▼"} {Math.abs(coverageDelta)}%
              </span>
            </>
          }
        />

        <Card
          title="Avg Mastery"
          value={
            <>
              {avgMastery}%
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  color: masteryDelta >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {masteryDelta >= 0 ? "▲" : "▼"} {Math.abs(masteryDelta)}%
              </span>
            </>
          }
        />
        <Card title="Needs Attention" value={atRiskCount} color="#dc2626" />
      </div>

      {/* ================= PHASE 2: CLASS-LEVEL DISTRIBUTIONS ================= */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h3 style={{ marginBottom: 16 }}>
          Class Learning Distribution
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {/* ===== Mastery Distribution ===== */}
          <div>
            <h4 style={{ marginBottom: 8 }}>Mastery Levels</h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Donut */}
              <div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  background: `conic-gradient(
                    #16a34a 0% ${masteryBuckets.strongPct}%,
                    #f59e0b ${masteryBuckets.strongPct}% ${masteryBuckets.strongPct + masteryBuckets.shallowPct
                    }%,
                    #dc2626 ${masteryBuckets.strongPct + masteryBuckets.shallowPct
                    }% 100%
                  )`,
                  position: "relative",
                  marginBottom: 8, // 👈 IMPORTANT: tight spacing
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 22,
                    background: "#fff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {filteredRows.length}
                </div>
              </div>

              {/* Legend (tight, centered, no waste) */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#16a34a" }}>
                  ● Confident ({masteryBuckets.strong})
                </span>
                <span style={{ color: "#f59e0b" }}>
                  ● Developing ({masteryBuckets.shallow})
                </span>
                <span style={{ color: "#dc2626" }}>
                  ● Needs Support ({masteryBuckets.weak})
                </span>
              </div>
            </div>
          </div>



          {/* ===== Coverage Distribution ===== */}
          <div>
            <h4 style={{ marginBottom: 12 }}>Coverage Overview</h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
              }}
            >
              {[
                { label: "0–25%", key: "0-25", color: "#fee2e2", text: "#b91c1c" },
                { label: "25–50%", key: "25-50", color: "#ffedd5", text: "#c2410c" },
                { label: "50–75%", key: "50-75", color: "#fef9c3", text: "#a16207" },
                { label: "75–100%", key: "75-100", color: "#dcfce7", text: "#166534" },
              ].map((b) => (
                <div
                  key={b.key}
                  style={{
                    background: b.color,
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#374151" }}>{b.label}</div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color: b.text,
                    }}
                  >
                    {coverageBuckets[b.key]}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>students</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* ================= FILTER BAR ================= */}
      <div style={{ display: "flex", gap: 6 }}>
        {["today", "7d", "30d"].map((t) => (
          <button
            key={t}
            onClick={() => setTimeRange(t)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              background: timeRange === t ? "#2563eb" : "#e5e7eb",
              color: timeRange === t ? "#fff" : "#000",
            }}
          >
            {t === "today" ? "Today" : t === "7d" ? "7 Days" : "30 Days"}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <button onClick={downloadJson}>Download JSON</button>

        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          {gradeOptions.map((g) => (
            <option key={g} value={g}>
              Grade: {g}
            </option>
          ))}

        </select>

        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjectOptions.map((s) => (
            <option key={s} value={s}>
              Subject: {s}
            </option>
          ))}
        </select>

        <select value={module} onChange={(e) => setModule(e.target.value)}>
          {moduleOptions.map((m) => (
            <option key={m} value={m}>
              Module: {m}
            </option>
          ))}
        </select>

        <select value={subModule} onChange={(e) => setSubModule(e.target.value)}>
          {subModuleOptions.map((sm) => (
            <option key={sm} value={sm}>
              Sub-Module: {sm}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="mastery">Sort by Mastery</option>
          <option value="coverage">Sort by Coverage</option>
          <option value="accuracy">Sort by Accuracy</option>
        </select>

        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
        >
          {ROWS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r} rows
            </option>
          ))}
        </select>
      </div>

      {/* ================= TABLE ================= */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <table width="100%" cellPadding="10">
          <thead style={{ background: "#f3f4f6" }}>
            <tr>
              <th>No.</th>
              <th>Student</th>
              <th>Class</th>
              <th>Coverage</th>
              <th>Mastery</th>
              <th>Accuracy</th>
              <th>Attempts</th>
              <th>Avg Time</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((s, i) => (
              <tr key={s.userId}>
                <td>{(currentPage - 1) * rowsPerPage + i + 1}</td>
                <td>{s.name}</td>
                <td>{s.grade}</td>

                <td>
                  <ProgressBar value={s.coverage} />
                  <small>{s.coverage}%</small>
                </td>

                <td>
                  <ProgressBar
                    value={s.mastery}
                    color={masteryColor(s.mastery)}
                  />
                  <small style={{ color: masteryColor(s.mastery) }}>
                    {s.mastery}%
                  </small>
                </td>

                <td>{s.accuracy}%</td>
                <td>{s.attendedTotal}</td>
                <td>{s.avgTime}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION ================= */}
      <div style={{ marginTop: 16, display: "flex", gap: 6 }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            style={{
              padding: "6px 10px",
              background: p === currentPage ? "#2563eb" : "#e5e7eb",
              color: p === currentPage ? "#fff" : "#000",
              borderRadius: 6,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <p style={{ marginTop: 8, color: "#6b7280" }}>
        Showing {paginatedRows.length} of {filteredRows.length} students
      </p>
    </div>
  );
};

export default AdminStudentPerformance;
