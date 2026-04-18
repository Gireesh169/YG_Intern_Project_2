import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  signupData: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")) 
    : null,
  token: localStorage.getItem("token") || null,  

  session: null,
};


const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setSignupData(state, value) {
      state.signupData = value.payload || null;
    },
    setToken(state, value) {
      state.token = value.payload;
    },
    setSession(state, value) {
      state.session = value.payload;
    },
    logout(state) {
      state.signupData = null;
      state.token = null;
      state.session = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

export const { setSignupData, setToken, setSession, logout } = authSlice.actions;

export default authSlice.reducer;
