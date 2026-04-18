import { createSlice } from "@reduxjs/toolkit";

// Initial state structure
const initialState = {
  subject: null, // Store the subject data
  modules: [], // Store the modules data (array of modules)
  totalModules: 0, // Track the total number of modules
  submoduleAnalytics: [],
  analytics: [],
  courseInfoAdmin: [],
  adminsubmodule:[]

};

const viewCourseSlice = createSlice({
  name: "viewCourse",
  initialState,
  reducers: {
    // Set subject data (single object)
    setSubjectData: (state, action) => {
      state.subject = action.payload;
    },

    // Set modules data (array of modules)
    setModulesData: (state, action) => {
      state.modules = action.payload;
    },

    // Set total modules count
    setTotalModules: (state, action) => {
      state.totalModules = action.payload;
    },
    setSubmodule: (state, action) => {
      state.submoduleAnalytics = action.payload;
    },
    setAnalytics: (state, action) => {
      state.analytics = action.payload;
    },
    setCourseInfoAdmin: (state, action) => {
      state.courseInfoAdmin = action.payload;
    },
    setadminSubmodule: (state, action) => {
      state.adminsubmodule = action.payload;
    },
    // Set complete course data (subject, modules, totalModules)
    // setEntireCourseData: (state, action) => {
    //   const { subject, modules, totalModules } = action.payload;
    //   state.subject = subject;
    //   state.modules = modules;
    //   state.totalModules = totalModules;
    // },
  },
});

// Export the actions
export const {
  setSubjectData,
  setModulesData,
  setTotalModules,
  setEntireCourseData,
  setSubmodule, setAnalytics,setCourseInfoAdmin,setadminSubmodule
} = viewCourseSlice.actions;

// Export the reducer to be used in the store
export default viewCourseSlice.reducer;
