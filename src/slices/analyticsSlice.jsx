import { createSlice } from "@reduxjs/toolkit";
import { setAnalytics } from "./viewCoursesSlice";

const initialState = {
    canonical: [],
    activeSubjects: [],
    subCanonical: [],
    analyticsofall: [],
};

const viewAnalyticsSlice = createSlice({
    name: "viewAnalytics",
    initialState,
    reducers: {
        setCanonical: (state, action) => {
            state.canonical = action.payload;
        },
        setActiveSubjects: (state, action) => {
            state.activeSubjects = action.payload;
        },
        setSubCanonical: (state, action) => {
            state.subCanonical = action.payload;
        },
        setAnalyticsOfAll: (state, action) => {
            state.analyticsofall = action.payload;
        },
    },
});

export const { setCanonical, setActiveSubjects, setSubCanonical, setAnalyticsOfAll } = viewAnalyticsSlice.actions;

export default viewAnalyticsSlice.reducer;
