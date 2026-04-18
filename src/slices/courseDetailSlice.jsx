import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    courseinfo: [],
    submodule: [],
    analytics: [],
    courseInfoAdmin: [],
};

const  viewcourseDetailSlice = createSlice({
    name: "viewcourseDetail",
    initialState,
    reducers: {
        setCourseInfo: (state, action) => {
            state.courseinfo = action.payload;
        },
        setSubmodule: (state, action) => {
            state.submodule = action.payload;
        },
        setAnalytics: (state, action) => {
            state.analytics = action.payload;
        },
        
    },
});

export const { setCourseInfo, setSubmodule, setAnalytics,  } = viewcourseDetailSlice.actions;

export default viewcourseDetailSlice.reducer;   