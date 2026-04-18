// src/services/mockSupabaseService.js
import { getDummyAnalyticsForSubject } from "./mockAnalytics";

// Simple mock that simulates what your real supabaseService returns.
// You can tweak the fake submodule count below.

export const mockSupabaseService = {
  // Simulate attempted submodules for a subject
  getAttemptedSubModules: async (googleId, subjectId) => {
    // Return a small array of fake submodule objects (ids)
    // Change length to simulate subjects with more/less submodules.
    const subCount = 4;
    const attemptedSubmodules = Array.from({ length: subCount }, (_, i) => {
      return { id: `${subjectId}_sub${i + 1}`, name: `Submodule ${i + 1}` };
    });

    return { attemptedSubmodules };
  },

  // Return dummy analytics for a submodule id
  getAnalytics: async (googleId, subId) => {
    // mimic latency a little (optional)
    // await new Promise(res => setTimeout(res, 100));
    return getDummyAnalyticsForSubject(subId);
  },
};
