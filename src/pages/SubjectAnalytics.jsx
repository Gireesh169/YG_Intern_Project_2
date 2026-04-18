// src/pages/SubjectAnalytics.jsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import AnalyticsDashboard from "../components/AnalyticsDashboard"; // adjust path if needed

/**
 * Minimal wrapper around AnalyticsDashboard for subject routes.
 * It keeps the route separate so you can add subject-specific prefetching later.
 */
export default function SubjectAnalytics() {
  const { subjectId } = useParams();

  useEffect(() => {
    // Optional: you can prefetch modules here if you want.
    // e.g. supabaseService.getCourseDetails(subjectId) or dispatch to redux.
    // Leaving empty so this file doesn't depend on extra actions.
    document.title = `Analytics — Subject ${subjectId || ""}`;
  }, [subjectId]);

  // AnalyticsDashboard already reads the subjectId from the URL via useParams inside it.
  // So we simply render the same component — no props required.
  return <AnalyticsDashboard />;
}
