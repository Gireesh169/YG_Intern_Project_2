import React from "react";
import { CheckCircle2, Download, ArrowRight, Receipt } from "lucide-react";
import { useSelector } from "react-redux";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { Link } from "react-router-dom";
import { useTheme } from "../../utils/useTheme";

// ── PDF Styles ─────────────────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#ffffff" },
  header: { fontSize: 26, marginBottom: 8, textAlign: "center", fontWeight: "bold", color: "#6366F1" },
  subheader: { fontSize: 11, textAlign: "center", color: "#9CA3AF", marginBottom: 24 },
  divider: { borderBottom: "1px solid #E2E8F0", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottom: "1px solid #F1F5F9" },
  label: { fontSize: 11, color: "#6B7280" },
  value: { fontSize: 11, color: "#111827", fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "#9CA3AF" },
  badge: { backgroundColor: "#EFF6FF", padding: "8 16", borderRadius: 6, marginTop: 20, textAlign: "center" },
  badgeText: { color: "#3B82F6", fontSize: 11 },
});

const ReceiptPDF = ({ details }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>SmaranAI.in</Text>
      <Text style={pdfStyles.subheader}>Pro Subscription Receipt · {details.date}</Text>
      <View style={pdfStyles.divider} />
      {[
        ["Name",           details.name],
        ["Email",          details.email],
        ["Transaction ID", details.transactionId],
        ["Receipt No.",    details.receiptNo],
        ["Plan",           "Pro — Unlimited Access"],
        ["Amount Paid",    details.amount],
        ["Date",           details.date],
        ["Status",         "✓ Payment Successful"],
      ].map(([label, value]) => (
        <View key={label} style={pdfStyles.row}>
          <Text style={pdfStyles.label}>{label}</Text>
          <Text style={pdfStyles.value}>{value}</Text>
        </View>
      ))}
      <View style={pdfStyles.badge}>
        <Text style={pdfStyles.badgeText}>Thank you for subscribing to SmaranAI.in Pro!</Text>
      </View>
      <Text style={pdfStyles.footer}>© 2025 SmaranAI.in · Admin@SmaranAI.in · +91 7736799084</Text>
    </Page>
  </Document>
);

// ── Main Component ──────────────────────────────────────────────────────────
const PaymentSuccessPage = () => {
  const { signupData } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const details = {
    name:          signupData?.name || "Student",
    email:         signupData?.email || "—",
    transactionId: "SMRN-" + Date.now().toString(36).toUpperCase(),
    receiptNo:     "RCP-" + Math.floor(Math.random() * 90000 + 10000),
    amount:        "₹499.00",
    date:          new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
  };

  const handleDownload = async () => {
    const blob = await pdf(<ReceiptPDF details={details} />).toBlob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `SmaranAI-Receipt-${details.receiptNo}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Theme tokens
  const pageBg      = isDark ? "#0B0F19" : "#F0F4FF";
  const cardBg      = isDark ? "#111827" : "#FFFFFF";
  const cardBorder  = isDark ? "#1F2937" : "#E2E8F0";
  const textPrimary = isDark ? "#E5E7EB" : "#0F172A";
  const textSecond  = isDark ? "#9CA3AF" : "#475569";
  const textMuted   = isDark ? "#6B7280" : "#94A3B8";
  const rowBg       = isDark ? "rgba(31,41,55,0.5)"  : "rgba(248,250,252,0.8)";
  const rowBorder   = isDark ? "#1F2937" : "#F1F5F9";

  const rows = [
    { label: "Name",           value: details.name },
    { label: "Email",          value: details.email },
    { label: "Transaction ID", value: details.transactionId },
    { label: "Receipt No.",    value: details.receiptNo },
    { label: "Plan",           value: "Pro · Unlimited Access" },
    { label: "Amount Paid",    value: details.amount },
    { label: "Date",           value: details.date },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: pageBg }}
    >
      {/* Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: isDark ? "linear-gradient(to bottom, rgba(34,197,94,0.10), transparent)" : "linear-gradient(to bottom, rgba(34,197,94,0.08), transparent)" }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)" }} />

      <div
        className="w-full max-w-md rounded-3xl overflow-hidden relative z-10 transition-colors duration-300"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isDark ? "0 8px 48px rgba(0,0,0,0.5)" : "0 8px 48px rgba(0,0,0,0.08)" }}
      >
        {/* Success header */}
        <div
          className="p-8 text-center relative overflow-hidden"
          style={{ background: isDark ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.10))" : "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.06))", borderBottom: `1px solid ${cardBorder}` }}
        >
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center relative">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: textPrimary }}>Payment Successful!</h1>
          <p className="text-sm" style={{ color: textSecond }}>
            Welcome to <span className="text-indigo-400 font-semibold">SmaranAI.in Pro</span> — enjoy unlimited access
          </p>
        </div>

        {/* Receipt rows */}
        <div className="p-6 space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Receipt size={14} className="text-indigo-400" />
            </div>
            <h2 className="font-bold text-sm" style={{ color: textPrimary }}>Transaction Receipt</h2>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
            {rows.map(({ label, value }, i) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: i % 2 === 0 ? rowBg : "transparent",
                  borderBottom: i < rows.length - 1 ? `1px solid ${rowBorder}` : "none",
                }}
              >
                <span className="text-xs font-medium" style={{ color: textMuted }}>{label}</span>
                <span className="text-xs font-bold" style={{ color: textPrimary }}>{value}</span>
              </div>
            ))}

            {/* Status badge */}
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ background: isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.06)" }}>
              <span className="text-xs font-medium" style={{ color: textMuted }}>Status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: isDark ? "#1F2937" : "#F1F5F9", color: textPrimary, border: `1px solid ${cardBorder}` }}
          >
            <Download size={15} />
            Download PDF
          </button>
          <Link
            to="/quizzes"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}
          >
            Start Learning
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;