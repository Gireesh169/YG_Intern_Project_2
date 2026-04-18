import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  home: 0,
  quizz: 0,
  dashboard: 0,
  authAdminApi: 0,
};

const viewCounterSlice = createSlice({
  name: "viewCounter",
  initialState,
  reducers: {
    incrementHome: (state) => {
      state.home += 1;
    },
    incrementQuizz: (state) => {
      state.quizz += 1;
    },
    incrementDashboard: (state) => {
      state.dashboard += 1;
    },
    incrementAuthAdminApi: (state) => {
      state.authAdminApi += 1;
    },
    resetCounters: () => initialState,
  },
});

// ✅ correct slice name here
export const {
  incrementHome,
  incrementQuizz,
  incrementDashboard,
  incrementAuthAdminApi,
  resetCounters,
} = viewCounterSlice.actions;

export default viewCounterSlice.reducer;
