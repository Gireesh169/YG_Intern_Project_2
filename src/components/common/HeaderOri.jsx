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

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const { signupData } = useSelector((state) => state.auth);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Click-outside handler (closes mobile menu and dropdown)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest("header")) setIsOpen(false);
      if (showUserDropdown && !event.target.closest(".user-dropdown-container")) setShowUserDropdown(false);
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

  return createPortal(
    <header className="w-full bg-[#0f0f1a] text-purple-900 py-4 fixed top-0 z-50 shadow-md shadow-[#00000011]">
      <div className="flex w-full items-center justify-between px-4 md:px-0">
        {/* Logo */}
        <div className="flex items-center w-auto md:w-[30%] md:pl-20">
          <div className="w-8 h-8 bg-[#440067] rounded-full"></div>
          <div className="ml-2 flex flex-col">
            <span className="text-xl md:text-2xl text-purple-900 font-semibold leading-tight">
              Peer{" "}
              <span className="bg-gradient-to-r from-purple-900 to-purple-600 bg-clip-text text-transparent">
                Academy
              </span>
            </span>
            <span className="text-xs font-semibold bg-gradient-to-b from-blue-950 to-purple-400 bg-clip-text text-transparent">
              CBSE Edition
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex text-xl items-center space-x-12 font-medium justify-end w-[50%] pr-14">
          <Link
            to="/"
            className={`relative transition-colors group ${location.pathname === "/" ? "text-purple-300" : "hover:text-purple-300"}`}
          >
            Home
            <span
              className={`absolute left-0 bottom-0 h-0.5 bg-purple-950 transition-all duration-300 ${
                location.pathname === "/" ? "w-full" : "w-0 group-hover:w-full"
              }`}
            ></span>
          </Link>

          {signupData ? (
            <Link
              to="/quizzes"
              className={`relative transition-colors group ${location.pathname === "/quizzes" ? "text-purple-300" : "hover:text-purple-300"}`}
            >
              Quizzes
              <span
                className={`absolute left-0 bottom-0 h-0.5 bg-purple-950 transition-all duration-300 ${
                  location.pathname === "/quizzes" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
          ) : (
            <button onClick={() => setShowLoginPrompt(true)} className="relative hover:text-purple-300 transition-colors cursor-pointer group">
              Quizzes
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-950 transition-all duration-300 group-hover:w-full"></span>
            </button>
          )}

          {signupData ? (
            <Link
              to="/analytics"
              className={`relative transition-colors group ${location.pathname === "/analytics" ? "text-purple-300" : "hover:text-purple-300"}`}
            >
              Dashboard
              <span
                className={`absolute left-0 bottom-0 h-0.5 bg-purple-950 transition-all duration-300 ${
                  location.pathname === "/analytics" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
          ) : (
            <button onClick={() => setShowLoginPrompt(true)} className="relative hover:text-purple-300 transition-colors cursor-pointer group">
              Dashboard
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-950 transition-all duration-300 group-hover:w-full"></span>
            </button>
          )}

          <Link
            to="/contact"
            className={`relative transition-colors group ${location.pathname === "/contact" ? "text-purple-300" : "hover:text-purple-300"}`}
          >
            Contact
            <span
              className={`absolute left-0 bottom-0 h-0.5 bg-purple-950 transition-all duration-300 ${
                location.pathname === "/contact" ? "w-full" : "w-0 group-hover:w-full"
              }`}
            ></span>
          </Link>

          {/* User area: avatar button (opens dropdown) + single-click grade selector */}
          <div className="flex items-center gap-3 user-dropdown-container">
            {/* Avatar button (toggles dropdown on click) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserDropdown((s) => !s);
              }}
              className="flex items-center justify-center hover:text-purple-300 transition-colors rounded-lg"
              aria-expanded={showUserDropdown}
              aria-haspopup="true"
            >
              {signupData ? (
                <img
                  src={signupData.picture}
                  alt={signupData.name || "User profile"}
                  className="w-9 h-9 rounded-full border-2 border-purple-200 object-cover"
                />
              ) : (
                <UserCircleIcon size={28} />
              )}
            </button>

            {/* Grade selector (single-click) */}
            {signupData && (
              <div className="flex items-center ml-2">
                <label htmlFor="header-grade" className="text-sm mr-2 hidden sm:inline">
                  Grade
                </label>
                <select
                  id="header-grade"
                  value={signupData?.grade ?? ""}
                  onChange={(e) => {
                    const newGrade = e.target.value === "" ? null : Number(e.target.value);
                    const updatedUser = { ...(signupData || {}), grade: newGrade };
                    try {
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                    } catch (err) {
                      /* ignore */
                    }
                    dispatch(setSignupData(updatedUser));
                  }}
                  className="border border-gray-300 bg-white text-sm px-2 py-1 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-300"
                >
                  <option value="">Not set</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                      {n % 100 >= 11 && n % 100 <= 13
                        ? "th"
                        : n % 10 === 1
                        ? "st"
                        : n % 10 === 2
                        ? "nd"
                        : n % 10 === 3
                        ? "rd"
                        : "th"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dropdown contents (profile summary, grade editor, Go Pro/ Premium, Logout) */}
            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                {signupData ? (
                  <div className="w-56">
                    {/* profile header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {signupData.picture ? (
                          <img src={signupData.picture} alt={signupData.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                            {signupData?.name?.charAt(0)?.toUpperCase() ?? "U"}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-800">{signupData?.name ?? "User"}</div>
                          <div className="text-xs text-gray-500 truncate">{signupData?.email ?? ""}</div>
                        </div>
                      </div>
                    </div>

                    {/* grade editor inside dropdown (keeps in sync) */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <label className="text-xs text-gray-600 block mb-1">Grade</label>
                      <select
                        value={signupData?.grade ?? ""}
                        onChange={(e) => {
                          const newGrade = e.target.value === "" ? null : Number(e.target.value);
                          const updatedUser = { ...(signupData || {}), grade: newGrade };
                          try {
                            localStorage.setItem("user", JSON.stringify(updatedUser));
                          } catch (err) {}
                          dispatch(setSignupData(updatedUser));
                        }}
                        className="w-full text-sm px-2 py-1 rounded-lg border"
                      >
                        <option value="">Not set</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                            {n % 100 >= 11 && n % 100 <= 13
                              ? "th"
                              : n % 10 === 1
                              ? "st"
                              : n % 10 === 2
                              ? "nd"
                              : n % 10 === 3
                              ? "rd"
                              : "th"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Go Pro / Premium */}
                    {signupData.isSubscribed ? (
                      <div className="px-4 py-3 flex items-center gap-3 bg-orange-50 text-orange-700 border-b border-gray-100">
                        <TiStar size={18} />
                        <span className="text-sm font-medium">Premium</span>
                      </div>
                    ) : (
                      <Link
                        to="/payment"
                        onClick={() => setShowUserDropdown(false)}
                        className="block px-4 py-3 hover:bg-purple-50 transition-colors text-gray-700 border-b border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <TiStar size={18} className="text-orange-500" />
                          <span className="text-sm">Go Pro</span>
                        </div>
                      </Link>
                    )}

                    {/* Logout */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors text-gray-700 flex items-center gap-3"
                    >
                      <LogOutIcon size={18} />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <GoogleSignInButton />
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-2xl p-2" onClick={toggleMenu} aria-label="Toggle Menu">
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <nav className="flex flex-col items-center space-y-4 pt-4 pb-2">
          <Link to="/" className="w-full text-center py-2 hover:text-purple-300 transition-colors" onClick={() => setIsOpen(false)}>
            Home
          </Link>

          {signupData ? (
            <Link to="/quizzes" className="w-full text-center py-2 hover:text-purple-300 transition-colors" onClick={() => setIsOpen(false)}>
              Quizzes
            </Link>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowLoginPrompt(true);
              }}
              className="w-full text-center py-2 hover:text-purple-300 transition-colors"
            >
              Quizzes
            </button>
          )}

          {signupData ? (
            <Link to="/analytics" className="w-full text-center py-2 hover:text-purple-300 transition-colors" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowLoginPrompt(true);
              }}
              className="w-full text-center py-2 hover:text-purple-300 transition-colors"
            >
              Dashboard
            </button>
          )}

          <Link to="/contact" className="w-full text-center py-2 hover:text-purple-300 transition-colors" onClick={() => setIsOpen(false)}>
            Contact
          </Link>

          {/* Mobile User Section */}
          {signupData && (
            <div className="flex items-center gap-2 py-2">
              <img src={signupData.picture} alt={signupData.name} className="w-10 h-10 rounded-full" />
              <span className="text-sm font-medium">{signupData.name}</span>
            </div>
          )}

          {!signupData && (
            <div className="w-full px-4">
              <GoogleSignInButton />
            </div>
          )}

          {signupData && !signupData.isSubscribed && (
            <Link to="/payment" onClick={() => setIsOpen(false)} className="bg-purple-200 text-purple-900 font-semibold px-4 py-2 rounded-md hover:bg-purple-300 transition-colors">
              Go Pro
            </Link>
          )}

          {signupData && (
            <button onClick={handleLogout} className="bg-purple-200 text-purple-900 px-4 py-2 rounded-md hover:bg-purple-300 transition-colors">
              Logout
            </button>
          )}
        </nav>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLoginPrompt(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Login Required</h3>
            <p className="text-gray-600 text-sm mb-4">Please login to access this feature</p>
            <div className="flex flex-col gap-3">
              <GoogleSignInButton />
              <button onClick={() => setShowLoginPrompt(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>,
    document.getElementById("header")
  );
}

export default Header;
