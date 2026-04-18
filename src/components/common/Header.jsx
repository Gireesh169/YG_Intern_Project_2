

// Header.jsx
import React, { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { logout, setSignupData } from "../../slices/authSlice.jsx";
import { TiStar } from "react-icons/ti";
import GoogleSignInButton from "../GoogleSignInButton.jsx";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOutIcon, UserCircleIcon } from "lucide-react";
import { supabase } from "../../config/supabase.js";
import { supabaseService } from "../../services/supabaseService.js";
import {
  setCourseData,
  setTotalNoOfSubjects,
} from "../../slices/subjectsSlice.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";
import { useTheme } from "../../utils/useTheme";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const { signupData } = useSelector((state) => state.auth);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { courseData } = useSelector((state) => state.viewSubject);
  const [scrolled, setScrolled] = useState(false); // ✅ Fix 1: was missing
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ── Auto-fetch grade if missing ──
  useEffect(() => {
    if (!signupData) return;
    if (
      signupData.grade !== null &&
      signupData.grade !== undefined &&
      signupData.grade !== ""
    )
      return;
    let cancelled = false;
    fetchGrade();
    return () => { cancelled = true; };
  }, [signupData?.id, dispatch, signupData?.grade]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ Fix 2: check session before calling edge functions

 const fetchGrade = async () => {
    if (courseData && courseData.length > 0) {
      return;
    }
    try {
      const result = await supabaseService.getSubjects();
      dispatch(setCourseData(result.subjects));
      dispatch(setTotalNoOfSubjects(result.totalSubjects));

      if (result?.grade != null) {
        const updatedUser = { ...signupData, grade: result.grade };

        try {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (e) {
          console.warn("Header: failed to write grade to localStorage:", e);
        }

        dispatch(setSignupData(updatedUser));
      }
    } catch (err) {

      console.log("Header: grade fetch failed:", err?.message || err);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest("header")) setIsOpen(false);
      if (showUserDropdown && !event.target.closest(".user-dropdown-container"))
        setShowUserDropdown(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, showUserDropdown]);

  const toggleMenu = () => setIsOpen((s) => !s);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    dispatch(logout());
    setIsOpen(false);
    setShowUserDropdown(false);
    navigate("/");
  };

  // ✅ Fix 2: check session before calling edge functions
  const updateGradeEverywhere = async (newGradeRaw) => {
    if (!signupData) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const newGrade =
      newGradeRaw === "" || newGradeRaw === null
        ? null
        : Number(newGradeRaw);

    const prevGrade = signupData.grade ?? null;
    if (newGrade === prevGrade) return;

    console.log("Sending grade:", newGrade, "Type:", typeof newGrade);

    try {
      await supabaseService.updateUserGrade(newGrade);

      const updatedUser = { ...signupData, grade: newGrade };
      try {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (e) {
        console.warn("Failed to store user after grade update:", e);
      }
      dispatch(setSignupData(updatedUser));
      fetchGrade();
    } catch (err) {
      console.error("Header: update grade failed:", err?.message || err);
      const revertedUser = { ...signupData, grade: prevGrade };
      try {
        localStorage.setItem("user", JSON.stringify(revertedUser));
      } catch (e) {
        console.warn("Failed to restore previous user grade in localStorage:", e);
      }
      dispatch(setSignupData(revertedUser));
    }
  };

  const gradeOrdinal = (n) => {
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    if (n % 10 === 1) return "st";
    if (n % 10 === 2) return "nd";
    if (n % 10 === 3) return "rd";
    return "th";
  };

  return createPortal(
    <header
      className="w-full py-4 fixed top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? isDark
            ? "rgba(13, 13, 26, 0.95)"
            : "rgba(248, 250, 252, 0.95)"
          : isDark
            ? "rgba(11, 15, 25, 0.5)"
            : "rgba(248, 250, 252, 0.5)",
        backdropFilter: "blur(12px)",
        borderBottom: scrolled
          ? isDark
            ? "1px solid #1F2937"
            : "1px solid #E2E8F0"
          : "1px solid transparent",
        color: isDark ? "#f1f5f9" : "#0F172A",
      }}
    >
      <div className="flex w-full items-center justify-between px-4 md:px-0">
        {/* ── Logo ── */}
        <div className="flex z-10 items-center w-auto md:w-[30%] md:pl-20">
          <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <img
              src="/images/HomePageLogo.jpg"
              alt="SmaranAI.in"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-2 flex flex-col">
            <span
              className="text-3xl font-bold tracking-tight transition-colors duration-300"
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            >
              Smaran
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                AI.in
              </span>
            </span>
            <span className="text-[10px] text-[#6B7280] tracking-widest uppercase">
              AI Powered Adaptive Study Guide
            </span>
          </div>
        </div>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex text-xl items-center space-x-8 font-medium justify-end w-[50%] pr-14">
          <Link
            to="/"
            className={`relative transition-colors group ${location.pathname === "/" ? (isDark ? "text-white" : "text-indigo-600") : isDark ? "text-[#9CA3AF] hover:text-white" : "text-[#475569] hover:text-indigo-600"}`}
          >
            Home
            <span className={`absolute left-0 bottom-0 h-0.5 bg-indigo-500 transition-all duration-300 ${location.pathname === "/" ? "w-full" : "w-0 group-hover:w-full"}`} />
          </Link>

          {signupData ? (
            <Link
              to="/quizzes"
              className={`relative transition-colors group ${location.pathname === "/quizzes" ? (isDark ? "text-white" : "text-indigo-600") : isDark ? "text-[#9CA3AF] hover:text-white" : "text-[#475569] hover:text-indigo-600"}`}
            >
              Quizzes
              <span className={`absolute left-0 bottom-0 h-0.5 bg-indigo-500 transition-all duration-300 ${location.pathname === "/quizzes" ? "w-full" : "w-0 group-hover:w-full"}`} />
            </Link>
          ) : (
            <button
              onClick={() => setShowLoginPrompt(true)}
              className={`relative transition-colors cursor-pointer group ${isDark ? "text-[#9CA3AF] hover:text-white" : "text-[#475569] hover:text-indigo-600"}`}
            >
              Quizzes
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
            </button>
          )}

          {signupData ? (
            <Link
              to="/analytics"
              className={`relative transition-colors group ${location.pathname === "/analytics" ? (isDark ? "text-white" : "text-indigo-600") : isDark ? "text-[#9CA3AF] hover:text-white" : "text-[#475569] hover:text-indigo-600"}`}
            >
              Dashboard
              <span className={`absolute left-0 bottom-0 h-0.5 bg-indigo-500 transition-all duration-300 ${location.pathname === "/analytics" ? "w-full" : "w-0 group-hover:w-full"}`} />
            </Link>
          ) : (
            <button
              onClick={() => setShowLoginPrompt(true)}
              className={`relative transition-colors cursor-pointer group ${isDark ? "text-[#9CA3AF] hover:text-white" : "text-[#475569] hover:text-indigo-600"}`}
            >
              Dashboard
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
            </button>
          )}

          {signupData?.isAdmin === true && (
            <button
              onClick={() => navigate("/admin/dashboard", { state: { fromAdminNav: true } })}
              className={`relative transition-colors group ${isDark ? "text-[#9CA3AF] hover:text-white" : "text-[#475569] hover:text-indigo-600"}`}
            >
              Admin
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
            </button>
          )}

          <Link
            to="/contact"
            className={`relative transition-colors group ${location.pathname === "/contact" ? (isDark ? "text-white" : "text-indigo-600") : isDark ? "text-[#9CA3AF] hover:text-white" : "text-[#475569] hover:text-indigo-600"}`}
          >
            Contact
            <span className={`absolute left-0 bottom-0 h-0.5 bg-indigo-500 transition-all duration-300 ${location.pathname === "/contact" ? "w-full" : "w-0 group-hover:w-full"}`} />
          </Link>

          {/* ── User Area ── */}
          <div className="flex items-center gap-3 user-dropdown-container">
            <button
              onClick={(e) => { e.stopPropagation(); setShowUserDropdown((s) => !s); }}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200"
              style={{
                background: isDark ? "#111827" : "#FFFFFF",
                border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
              }}
              aria-expanded={showUserDropdown}
              aria-haspopup="true"
            >
              {signupData ? (
                <img
                  src={signupData.picture}
                  alt={signupData.name || "User profile"}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
              ) : (
                <UserCircleIcon size={15} style={{ color: isDark ? "#9CA3AF" : "#475569" }} />
              )}
            </button>

            <ThemeToggle />

            {signupData && (
              <div className="flex items-center">
                <label
                  htmlFor="header-grade"
                  className="text-sm mr-2 hidden sm:inline transition-colors"
                  style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                >
                  Grade
                </label>
                <select
                  id="header-grade"
                  name="header-grade"
                  value={signupData?.grade ?? ""}
                  onChange={(e) => updateGradeEverywhere(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer transition-colors"
                  style={{
                    background: isDark ? "#111827" : "#F1F5F9",
                    border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                    color: isDark ? "#9CA3AF" : "#475569",
                  }}
                >
                  <option value="">Grade</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}{gradeOrdinal(n)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showUserDropdown && (
              <div
                className="absolute right-4 top-16 w-64 rounded-2xl shadow-2xl border overflow-hidden z-50 transition-colors"
                style={{
                  background: isDark ? "#111827" : "#FFFFFF",
                  borderColor: isDark ? "#1F2937" : "#E2E8F0",
                  boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.12)",
                }}
              >
                {signupData ? (
                  <div>
                    <div
                      className="px-4 py-4 border-b transition-colors flex items-center gap-3"
                      style={{ borderColor: isDark ? "#1F2937" : "#E2E8F0" }}
                    >
                      {signupData.picture ? (
                        <img
                          src={signupData.picture}
                          alt="profile"
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                          {signupData?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                          {signupData?.name ?? "User"}
                        </div>
                        <div className="text-xs truncate transition-colors" style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>
                          {signupData?.email ?? ""}
                        </div>
                      </div>
                    </div>

                    <div
                      className="px-4 py-3 border-b transition-colors"
                      style={{ borderColor: isDark ? "#1F2937" : "#E2E8F0" }}
                    >
                      <label className="text-xs block mb-1.5 transition-colors" style={{ color: isDark ? "#6B7280" : "#94A3B8" }}>
                        Grade
                      </label>
                      <select
                        id="dropdown-grade"
                        name="dropdown-grade"
                        value={signupData?.grade ?? ""}
                        onChange={(e) => updateGradeEverywhere(e.target.value)}
                        className="w-full text-sm px-2 py-1.5 rounded-lg focus:outline-none transition-colors"
                        style={{
                          background: isDark ? "#0B0F19" : "#F8FAFC",
                          border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                          color: isDark ? "#E5E7EB" : "#0F172A",
                        }}
                      >
                        <option value="">Not set</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}{gradeOrdinal(n)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {signupData.isSubscribed ? (
                      <div
                        className="px-4 py-3 flex items-center gap-2 bg-amber-500/10 border-b"
                        style={{ borderColor: isDark ? "#1F2937" : "#E2E8F0" }}
                      >
                        <TiStar size={16} className="text-amber-400" />
                        <span className="text-sm font-medium text-amber-400">Pro Member</span>
                      </div>
                    ) : (
                      <Link
                        to="/payment"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2 px-4 py-3 border-b transition-colors"
                        style={{ borderColor: isDark ? "#1F2937" : "#E2E8F0", color: isDark ? "#E5E7EB" : "#0F172A" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1F2937" : "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <TiStar size={16} className="text-amber-400" />
                        <span className="text-sm">Upgrade to Pro</span>
                      </Link>
                    )}

                    <button
                      onClick={() => { handleLogout(); setShowUserDropdown(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 transition-colors"
                      style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDark ? "#1F2937" : "#F8FAFC";
                        e.currentTarget.style.color = isDark ? "#E5E7EB" : "#0F172A";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = isDark ? "#9CA3AF" : "#475569";
                      }}
                    >
                      <LogOutIcon size={16} />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4">
                    <GoogleSignInButton />
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-2xl p-2"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
          style={{ color: isDark ? "#9CA3AF" : "#475569" }}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* ── Mobile Nav ── */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <nav
          className="flex flex-col items-center space-y-1 pt-4 pb-4 px-4"
          style={{
            background: isDark ? "rgba(11,15,25,0.98)" : "rgba(248,250,252,0.98)",
            color: isDark ? "#E5E7EB" : "#0F172A",
          }}
        >
          {[
            { to: "/", label: "Home" },
            { to: "/quizzes", label: "Quizzes", auth: true },
            { to: "/analytics", label: "Dashboard", auth: true },
            { to: "/contact", label: "Contact" },
          ].map(({ to, label, auth }) =>
            auth && !signupData ? (
              <button
                key={label}
                onClick={() => { setIsOpen(false); setShowLoginPrompt(true); }}
                className="w-full text-center px-4 py-3 rounded-xl transition-all text-sm font-medium"
                style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1F2937" : "#F1F5F9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {label}
              </button>
            ) : (
              <Link
                key={label}
                to={to}
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-3 rounded-xl transition-all text-sm font-medium"
                style={{
                  color: location.pathname === to ? "#6366F1" : isDark ? "#9CA3AF" : "#475569",
                  background: location.pathname === to ? (isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.08)") : "transparent",
                }}
              >
                {label}
              </Link>
            ),
          )}

          <div className="w-full border-t mt-2 pt-3" style={{ borderColor: isDark ? "#1F2937" : "#E2E8F0" }}>
            {signupData && (
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <img
                  src={signupData.picture}
                  alt={signupData.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <span className="text-sm font-medium transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
                  {signupData.name}
                </span>
              </div>
            )}

            {!signupData && (
              <div className="px-2 mb-2">
                <GoogleSignInButton />
              </div>
            )}

            <div className="flex justify-center py-2">
              <ThemeToggle />
            </div>

            {signupData && !signupData.isSubscribed && (
              <Link
                to="/payment"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 mx-2 mb-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
              >
                Upgrade to Pro
              </Link>
            )}

            {signupData && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all text-sm"
                style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1F2937" : "#F1F5F9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOutIcon size={16} />
                Logout
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* ── Login Modal ── */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl transition-colors"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
              boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.6)" : "0 8px 40px rgba(0,0,0,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-1 transition-colors" style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}>
              Login required
            </h3>
            <p className="text-sm mb-5 transition-colors" style={{ color: isDark ? "#9CA3AF" : "#475569" }}>
              Please login to access this feature
            </p>
            <div className="space-y-3">
              <GoogleSignInButton />
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full text-sm py-2 transition-colors"
                style={{ color: isDark ? "#6B7280" : "#94A3B8" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>,
    document.getElementById("header"),
  );
}

export default Header;