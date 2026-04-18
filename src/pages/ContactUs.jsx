import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, Clock, MessageSquare } from "lucide-react";
import { useTheme } from "../utils/useTheme";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you for contacting us! We will get back to you soon.");
  };

  return (
    <div
      className="min-h-screen mt-20 py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0B0F19" : "#F0F4FF",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <div className="absolute inset-0" />

        {/* Glow blobs */}
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.12)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[120px]"
          style={{
            background: isDark
              ? "rgba(99,102,241,0.10)"
              : "rgba(99,102,241,0.10)",
          }}
        />
        <div
          className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(59,130,246,0.08)"
              : "rgba(59,130,246,0.08)",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{
            background: isDark
              ? "rgba(6,182,212,0.08)"
              : "rgba(6,182,212,0.08)",
            animationDelay: "4s",
          }}
        />

        {/* Top center beam */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(99,102,241,0.15), transparent)"
              : "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)",
          }}
        />
      </div>

      {/* Background Glows */}
      <div
        className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse pointer-events-none"
        style={{
          background: isDark
            ? "rgba(99,102,241,0.10)"
            : "rgba(99,102,241,0.08)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{
          background: isDark
            ? "rgba(99,102,241,0.10)"
            : "rgba(99,102,241,0.08)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{
          background: isDark
            ? "rgba(99,102,241,0.10)"
            : "rgba(99,102,241,0.08)",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, rgba(99,102,241,0.15), transparent)"
            : "linear-gradient(to bottom, rgba(99,102,241,0.10), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4 transition-colors"
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          >
            Get in{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
              }}
            >
              Touch
            </span>
          </h1>
          <p
            className="text-lg max-w-2xl mx-auto font-medium transition-colors"
            style={{ color: isDark ? "#94A3B8" : "#475569" }}
          >
            Have questions about our quiz platform? We'd love to hear from you.
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Cards */}
          {/* Contact Cards */}
          <div className="lg:col-span-1 space-y-6">
            {[
              {
                icon: <Mail className="w-5 h-5 text-blue-400" />,
                iconBg: "bg-blue-500/10 border-blue-500/20",
                title: "Email Us",
                sub: "Send us an email anytime",
                content: (
                  <a
                    href="mailto:Admin@SmaranAI.in"
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Admin@SmaranAI.in
                  </a>
                ),
              },
              {
                icon: <Phone className="w-5 h-5 text-emerald-400" />,
                iconBg: "bg-emerald-500/10 border-emerald-500/20",
                title: "Call Us",
                sub: "Mon-Fri from 9am to 6pm",
                content: (
                  <a
                    href="tel:+917736799084"
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    +91 7736799084
                  </a>
                ),
              },
              {
                icon: <MapPin className="w-5 h-5 text-indigo-400" />,
                iconBg: "bg-indigo-500/10 border-indigo-500/20",
                title: "Visit Us",
                sub: "Come say hello",
                content: (
                  <p className="text-indigo-400 font-medium">
                    SmaranAI.in
                    <br />
                    India
                  </p>
                ),
              },
              {
                icon: <Clock className="w-5 h-5 text-amber-400" />,
                iconBg: "bg-amber-500/10 border-amber-500/20",
                title: "Working Hours",
                sub: null,
                content: (
                  <p
                    className="text-sm transition-colors"
                    style={{ color: isDark ? "#6B7280" : "#64748B" }}
                  >
                    Monday - Friday: 9:00 AM - 6:00 PM
                    <br />
                    Saturday: 10:00 AM - 4:00 PM
                    <br />
                    Sunday: Closed
                  </p>
                ),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 flex items-start gap-4"
                style={{
                  background: isDark ? "#111827" : "#FFFFFF",
                  border: isDark
                    ? "2px solid rgba(24,94,151,0.55)"
                    : "1px solid #E2E8F0",
                  boxShadow: isDark
                    ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
                    : "0 4px 16px rgba(99,102,241,0.08)",
                  transition: "border 0.3s ease, box-shadow 0.3s ease",
                }}
               
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
                >
                  {item.icon}
                </div>

                {/* Content */}
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                  >
                    {item.title}
                  </h3>
                  {item.sub && (
                    <p
                      className="text-xs mb-2"
                      style={{ color: isDark ? "#b2b5bbff" : "#94A3B8" }}
                    >
                      {item.sub}
                    </p>
                  )}
                  {item.content}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div
              className="rounded-3xl p-8 shadow-2xl relative z-10"
              style={{
                background: isDark ? "#111827" : "#FFFFFF",
                border: isDark
                  ? "2px solid rgba(24,94,151,0.55)"
                  : "1px solid #E2E8F0",
                boxShadow: isDark
                  ? "0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)"
                  : "0 8px 32px rgba(0,0,0,0.08)",
                transition: "border 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = isDark
                  ? "2px solid rgba(99,102,241,0.9)"
                  : "1px solid rgba(99,102,241,0.5)";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 0 0 2px rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.4), 0 0 16px 3px rgba(99,102,241,0.25)"
                  : "0 8px 32px rgba(0,0,0,0.08), 0 0 12px 3px rgba(99,102,241,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = isDark
                  ? "2px solid rgba(24,94,151,0.55)"
                  : "1px solid #E2E8F0";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)"
                  : "0 8px 32px rgba(0,0,0,0.08)";
              }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                </div>
                <h2
                  className="text-2xl font-bold transition-colors"
                  style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
                >
                  Send us a Message
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {[
                  {
                    id: "name",
                    label: "Full Name",
                    type: "text",
                    placeholder: "John Doe",
                  },
                  {
                    id: "email",
                    label: "Email Address",
                    type: "email",
                    placeholder: "john@example.com",
                  },
                  {
                    id: "subject",
                    label: "Subject",
                    type: "text",
                    placeholder: "How can we help you?",
                  },
                ].map((field) => (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                      style={{ color: isDark ? "#999ea8ff" : "#94A3B8" }}
                    >
                      {field.label} *
                    </label>
                    <input
                      type={field.type}
                      id={field.id}
                      name={field.id}
                      value={formData[field.id]}
                      onChange={handleChange}
                      required
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                      style={{
                        background: isDark ? "#0B0F19" : "#F8FAFC",
                        border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                        color: isDark ? "#FFFFFF" : "#0F172A",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
                      onBlur={(e) =>
                        (e.target.style.borderColor = isDark
                          ? "#1F2937"
                          : "#E2E8F0")
                      }
                    />
                  </div>
                ))}

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-bold uppercase tracking-widest mb-2 transition-colors"
                    style={{ color: isDark ? "#9b9fa7ff" : "#94A3B8" }}
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us more about your inquiry..."
                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all resize-none"
                    style={{
                      background: isDark ? "#0B0F19" : "#F8FAFC",
                      border: `1px solid ${isDark ? "#1F2937" : "#E2E8F0"}`,
                      color: isDark ? "#FFFFFF" : "#0F172A",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = isDark
                        ? "#1F2937"
                        : "#E2E8F0")
                    }
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-[1.01]"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366F1, #3B82F6, #06B6D4)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                  }}
                >
                  <Send className="w-5 h-5" />
                  <span>Send Message</span>
                </button>
              </form>

              {/* Note */}
              <div
                className="mt-6 p-4 rounded-xl transition-colors"
                style={{
                  background: isDark
                    ? "rgba(99,102,241,0.10)"
                    : "rgba(99,102,241,0.08)",
                  border: `1px solid ${isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.25)"}`,
                }}
              >
                <p
                  className="text-sm transition-colors"
                  style={{ color: isDark ? "#9CA3AF" : "#475569" }}
                >
                  <span className="font-semibold text-indigo-400">Note:</span>{" "}
                  We typically respond within 24 hours during business days. For
                  urgent matters, please call us directly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
<div
  className="mt-20 rounded-[2rem] p-10 shadow-xl"
  style={{
    background: isDark ? "#111827" : "#FFFFFF",
    border: isDark ? "2px solid rgba(24,94,151,0.55)" : "1px solid #E2E8F0",
    boxShadow: isDark
      ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(0,0,0,0.06)",
    transition: "border 0.3s ease, box-shadow 0.3s ease",
  }}
  
>
  <h2
    className="text-2xl font-bold mb-10 text-center transition-colors"
    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
  >
    Frequently Asked Questions
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {[
      {
        q: "How do I reset my password?",
        a: 'You can reset your password from the login page by clicking "Forgot Password" link.',
      },
      {
        q: "How do I access premium content?",
        a: "Subscribe to our premium plan from the dashboard to unlock all quiz modules.",
      },
      {
        q: "Can I track my progress?",
        a: "Yes! Visit the Analytics Dashboard to view detailed performance metrics.",
      },
      {
        q: "Is there a mobile app?",
        a: "Our web app is fully responsive and works great on all mobile devices.",
      },
    ].map((faq, i) => (
      <div
        key={i}
        className="p-6 rounded-2xl"
        style={{
          background: isDark ? "#0B0F19" : "#F8FAFC",
          border: isDark ? "2px solid rgba(24,94,151,0.55)" : "1px solid #E2E8F0",
          boxShadow: isDark
            ? "0 0 0 1px rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)"
            : "none",
          transition: "border 0.3s ease, box-shadow 0.3s ease",
        }}
        
      >
        <h3
          className="font-semibold mb-2 transition-colors"
          style={{ color: isDark ? "#E5E7EB" : "#0F172A" }}
        >
          {faq.q}
        </h3>
        <p
          className="text-sm transition-colors"
          style={{ color: isDark ? "#6B7280" : "#64748B" }}
        >
          {faq.a}
        </p>
      </div>
    ))}
  </div>
</div>
      </div>
    </div>
  );
};

export default ContactUs;
