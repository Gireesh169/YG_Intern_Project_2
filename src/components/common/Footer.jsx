import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";
import { useTheme } from "../../utils/useTheme";

function Footer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <footer
      className="py-16 transition-colors duration-300"
      style={{
        background: isDark ? "#0f0f1a" : "#F0F4FF",
        borderTop: `1px solid ${isDark ? "#1f2937" : "#E2E8F0"}`,
        color: isDark ? "#94A3B8" : "#475569",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">

          {/* Logo + Description */}
          <div className="space-y-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg shadow-indigo-500/20 flex-shrink-0">
                <img src="/images/HomePageLogo.jpg" alt="SmaranAI" className="w-full h-full object-cover" />
              </div>
              <span
                className="text-3xl font-bold tracking-tight transition-colors"
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              >
                Smaran
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  AI.in
                </span>
              </span>
            </div>

            <p className="text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
              Empowering students through AI-driven interactive quizzes and
              personalized learning paths.
            </p>

            <div className="flex justify-center sm:justify-start gap-5 pt-2">
              {[FaFacebook, FaInstagram, FaTwitter, FaGithub].map((Icon, i) => (
                <Icon key={i} className="w-5 h-5 hover:text-indigo-400 transition-all cursor-pointer hover:scale-110" />
              ))}
            </div>
          </div>

          {/* About */}
          <div className="space-y-5 text-center sm:text-left">
            <h4
              className="font-bold uppercase tracking-widest text-lg transition-colors"
              style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
            >
              About
            </h4>
            <ul className="space-y-3 text-sm">
              {["Company History", "Meet the Team", "Careers"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-indigo-400 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-5 text-center sm:text-left">
            <h3
              className="font-bold uppercase tracking-widest text-lg transition-colors"
              style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
            >
              Services
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/quizzes" className="hover:text-indigo-400 transition-colors">Quizzes</Link></li>
              <li><Link to="/courses" className="hover:text-indigo-400 transition-colors">Courses</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5 text-center sm:text-left">
            <h3
              className="font-bold uppercase tracking-widest text-lg transition-colors"
              style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
            >
              Contact
            </h3>
            <ul className="space-y-4 text-sm">
              {[
                { icon: "📧", text: "Admin@SmaranAI.in" },
                { icon: "📞", text: "+91 7736799084" },
                { icon: "📍", text: "SVNIT, India" },
              ].map((item) => (
                <li key={item.text} className="flex items-center justify-center sm:justify-start gap-3 group">
                  <span
                    className="p-2 rounded-lg text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all"
                    style={{ background: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.08)" }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className="transition-colors group-hover:text-indigo-400"
                    style={{ color: isDark ? "#94A3B8" : "#475569" }}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-xs font-medium uppercase tracking-widest gap-4 transition-colors"
          style={{
            borderTop: `1px solid ${isDark ? "#1f2937" : "#E2E8F0"}`,
            color: isDark ? "#64748B" : "#94A3B8",
          }}
        >
          <p>© 2022 SmaranAI.in All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;