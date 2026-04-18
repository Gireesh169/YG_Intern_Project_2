import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider, useDispatch } from "react-redux";
import rootReducer from "./reducer";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { supabase } from "./config/supabase";
import DevUserProvider from './dev/DevUserProvider';
import { setSignupData, setToken, setSession, logout } from "./slices/authSlice.jsx";

const store = configureStore({
  reducer: rootReducer,
});

// Auth listener component
function AuthListener({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user = {
          googleId: session.user.user_metadata.sub || session.user.user_metadata.provider_id || session.user.id,
          name: session.user.user_metadata.full_name || session.user.user_metadata.name,
          email: session.user.email,
          picture: session.user.user_metadata.avatar_url || session.user.user_metadata.picture,
          isSubscribed: session.user.user_metadata.isSubscribed || false,
          isAdmin: session.user.user_metadata.isAdmin || false,
        };

        localStorage.setItem("token", JSON.stringify(session.access_token));
        localStorage.setItem("user", JSON.stringify(user));

        dispatch(setToken(session.access_token));
        dispatch(setSignupData(user));
        dispatch(setSession(session));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user = {
          googleId: session.user.user_metadata.sub || session.user.user_metadata.provider_id || session.user.id,
          name: session.user.user_metadata.full_name || session.user.user_metadata.name,
          email: session.user.email,
          picture: session.user.user_metadata.avatar_url || session.user.user_metadata.picture,
          isSubscribed: session.user.user_metadata.isSubscribed || false,
          isAdmin: session.user.user_metadata.isAdmin || false,
        };

        localStorage.setItem("token", JSON.stringify(session.access_token));
        localStorage.setItem("user", JSON.stringify(user));

        dispatch(setToken(session.access_token));
        dispatch(setSignupData(user));
        dispatch(setSession(session));
      } else {
        dispatch(logout());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return children;
}

createRoot(document.getElementById("root")).render(
    <Provider store={store}>
      <BrowserRouter>
        <AuthListener>
          <DevUserProvider>      
            <App />
            <Toaster />
          </DevUserProvider>
        </AuthListener>
      </BrowserRouter>
    </Provider>
);