import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "../slices/authSlice";
import viewSubjectReducer from "../slices/subjectsSlice";
import viewCourseReducer from "../slices/viewCoursesSlice";
import viewAnalyticsReducer from "../slices/analyticsSlice";
import viewcourseDetailReducer from "../slices/courseDetailSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  viewSubject: viewSubjectReducer,
  viewCourse: viewCourseReducer,
  viewAnalytics: viewAnalyticsReducer, 
  //viewcourseDetail: viewcourseDetailReducer,
});

export default rootReducer;
