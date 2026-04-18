export function buildFixedDateRangeData(data = [], range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // local midnight

  const rangeDaysMap = {
    "1w": 7,
    "1m": 30,
    "3m": 90,
    "6m": 180,
    "1y": 365,
  };

  const days = rangeDaysMap[range] || 30;

  // Index real data by YYYY-MM-DD (LOCAL)
  const byDay = {};
  data.forEach((d) => {
    if (!d?.day) return;
    const key = String(d.day).slice(0, 10);
    byDay[key] = {
      score: Number(d.score) || 0,
      questionsAttempted: Number(d.questionsAttempted) || 0,
    };
  });

  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // ✅ LOCAL YYYY-MM-DD (NOT UTC)
    const key = date.toLocaleDateString("en-CA");

    result.push({
      day: key,
      score: byDay[key]?.score ?? 0,
      questionsAttempted: byDay[key]?.questionsAttempted ?? 0,
    });
  }

  return result;
}