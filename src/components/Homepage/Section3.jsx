// Section3.jsx
import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import { useTheme } from "../../utils/useTheme";

function Section3() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(3);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const updateCards = () => {
      if (window.innerWidth < 640) setCardsVisible(1);
      else if (window.innerWidth < 1024) setCardsVisible(2);
      else setCardsVisible(3);
    };
    updateCards();
    window.addEventListener("resize", updateCards);
    return () => window.removeEventListener("resize", updateCards);
  }, []);

  const slidePercent = 100 / cardsVisible;

  const testimonials = [
    {
      text: "The online quiz module is excellent for both learning and practicing, providing clear and in-depth understanding of quiz concepts.",
      name: "Mohammad Abdul Hamid Khan",
      username: "hamidkhan18",
      location: "India",
      rating: 4,
      image:
        "https://images.unsplash.com/photo-1708531372589-672704f301a3?auto=format&fit=crop&q=60&w=600",
    },
    {
      text: "QuizMaster Pro offers a wide range of practice questions and conducts exceptional quizzes.",
      name: "Anmol Vishwakarma",
      username: "anmol_6265",
      location: "India",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1637942766335-796fd25b00d8?auto=format&fit=crop&q=60&w=600",
    },
    {
      text: "I love quizzing and I'm always searching for the best way to learn.",
      name: "Dhanushree",
      username: "dhanushree",
      location: "India",
      rating: 5,
      image:
        "https://plus.unsplash.com/premium_photo-1682096200654-2f3297b0e9bd?auto=format&fit=crop&q=60&w=600",
    },
    {
      text: "The practice quizzes are well-designed and help in understanding concepts thoroughly.",
      name: "Rahul Sharma",
      username: "rahul_dev",
      location: "India",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1545696968-1a5245650b36?auto=format&fit=crop&q=80&w=1132",
    },
    {
      text: "Great platform for improving problem-solving skills.",
      name: "Priya Patel",
      username: "priya_codes",
      location: "India",
      rating: 4,
      image:
        "https://plus.unsplash.com/premium_photo-1661963936485-aa1830b655a5?auto=format&fit=crop&q=60&w=600",
    },
    {
      text: "The interactive interface makes learning enjoyable.",
      name: "Arjun Kumar",
      username: "arjun_k",
      location: "India",
      rating: 5,
      image:
        "https://plus.unsplash.com/premium_photo-1682089869602-2ec199cc501a?auto=format&fit=crop&q=60&w=600",
    },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev >= testimonials.length - cardsVisible ? 0 : prev + 1,
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - cardsVisible : prev - 1,
    );
  };

  return (
    <section
      className="py-20 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* HEADING */}
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300"
            style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
          >
            Trusted by{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
              }}
            >
              1 Lakh+
            </span>{" "}
            Learners
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto transition-colors duration-300"
            style={{ color: isDark ? "#94A3B8" : "#475569" }}
          >
            Our learners benefit from our rich repository of quizzes,
            interactive tests, and detailed explanations every day.
          </p>
        </div>

        {/* CAROUSEL */}
        <div className="relative">
          {/* LEFT BUTTON */}
          <button
            onClick={prevSlide}
            className="hidden md:flex absolute left-[-2rem] top-1/2 -translate-y-1/2 z-10 p-3 rounded-full shadow transition-all duration-200 hover:scale-110"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
              boxShadow: isDark
                ? "0 4px 12px rgba(0,0,0,0.4)"
                : "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <FaChevronLeft style={{ color: isDark ? "#6366F1" : "#4F46E5" }} />
          </button>

          {/* SLIDER */}
          <div className="overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * slidePercent}%)`,
              }}
            >
              {testimonials.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col rounded-2xl p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-2"
                  style={{
                    minWidth:
                      cardsVisible === 1
                        ? "100%"
                        : cardsVisible === 2
                          ? "calc(50% - 12px)"
                          : "calc(33.33% - 16px)",
                    background: isDark
                      ? "linear-gradient(135deg, #151a30, #0f1426)"
                      : "#FFFFFF",
                    border: `1px solid ${isDark ? "#232846" : "#E2E8F0"}`,
                    boxShadow: isDark ? "none" : "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark
                      ? "rgba(99,102,241,0.6)"
                      : "rgba(99,102,241,0.4)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 25px 60px rgba(79,70,229,0.25)"
                      : "0 12px 40px rgba(99,102,241,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark
                      ? "#232846"
                      : "#E2E8F0";
                    e.currentTarget.style.boxShadow = isDark
                      ? "none"
                      : "0 4px 16px rgba(0,0,0,0.06)";
                  }}
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        style={{
                          color:
                            i < item.rating
                              ? "#FBBF24"
                              : isDark
                                ? "#2a315a"
                                : "#E2E8F0",
                        }}
                      />
                    ))}
                  </div>

                  {/* Review text */}
                  <p
                    className="mb-6 flex-grow text-[15px] leading-relaxed font-medium tracking-wide transition-colors"
                    style={{ color: isDark ? "#CBD5E1" : "#334155" }}
                  >
                    "{item.text}"
                  </p>

                  {/* User */}
                  <div className="flex items-center gap-4 mt-auto">
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        border: `2px solid ${isDark ? "#2a2f4a" : "#E2E8F0"}`,
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p
                        className="font-semibold text-[15px] transition-colors"
                        style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
                      >
                        {item.username}
                      </p>
                      <p
                        className="text-sm transition-colors"
                        style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                      >
                        {item.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT BUTTON */}
          <button
            onClick={nextSlide}
            className="hidden md:flex absolute right-[-2rem] top-1/2 -translate-y-1/2 z-10 p-3 rounded-full shadow transition-all duration-200 hover:scale-110"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
              boxShadow: isDark
                ? "0 4px 12px rgba(0,0,0,0.4)"
                : "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <FaChevronRight style={{ color: isDark ? "#6366F1" : "#4F46E5" }} />
          </button>
        </div>

        {/* MOBILE BUTTONS */}
        <div className="flex justify-center gap-6 mt-10 md:hidden">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full shadow transition-all duration-200 hover:scale-110"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
            }}
          >
            <FaChevronLeft style={{ color: isDark ? "#6366F1" : "#4F46E5" }} />
          </button>
          <button
            onClick={nextSlide}
            className="p-3 rounded-full shadow transition-all duration-200 hover:scale-110"
            style={{
              background: isDark ? "#111827" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
            }}
          >
            <FaChevronRight style={{ color: isDark ? "#6366F1" : "#4F46E5" }} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Section3;
