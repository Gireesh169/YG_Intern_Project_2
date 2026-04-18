// src/utils/useTheme.js
import { useState, useEffect } from "react";

// ← Key fix: single event to sync all components
const THEME_EVENT = "themeChange";

export const useTheme = () => {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem("theme") || "dark";
    });

    useEffect(() => {
        // Apply to HTML element
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        // Dispatch custom event so ALL components re-render
        window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
    }, [theme]);

    // Listen for theme changes from OTHER components
    useEffect(() => {
        const handler = (e) => {
            if (e.detail !== theme) {
                setThemeState(e.detail);
            }
        };
        window.addEventListener(THEME_EVENT, handler);
        return () => window.removeEventListener(THEME_EVENT, handler);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState((prev) => prev === "dark" ? "light" : "dark");
    };

    return { theme, toggleTheme };
};