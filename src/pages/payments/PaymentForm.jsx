import { useState } from "react";
import { CreditCard, Lock, X, ShieldCheck, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiConnector } from "../../services/apiConnectors";
import { useSelector } from "react-redux";
import { useTheme } from "../../utils/useTheme";

const PaymentForm = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const { signupData } = useSelector((state) => state.auth);
  const [errors, setErrors] = useState({});
  const [paymentLoader, setPaymentLoader] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ── Theme tokens ────────────────────────────────────────────────
  const pageBg       = isDark ? "#0B0F19" : "#F0F4FF";
  const cardBg       = isDark ? "#111827" : "#FFFFFF";
  const cardBorder   = isDark ? "#1F2937" : "#E2E8F0";
  const textPrimary  = isDark ? "#E5E7EB" : "#0F172A";
  const textSecond   = isDark ? "#9CA3AF" : "#475569";
  const textMuted    = isDark ? "#6B7280" : "#94A3B8";
  const inputBg      = isDark ? "#0B0F19" : "#F8FAFC";
  const inputBorder  = isDark ? "#1F2937" : "#E2E8F0";
  const inputFocus   = "#6366F1";

  // ── Validation ──────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, "")))
      newErrors.cardNumber = "Please enter a valid 16-digit card number";
    if (!formData.cardName.trim())
      newErrors.cardName = "Name on card is required";
    if (!formData.expiryMonth || parseInt(formData.expiryMonth) < 1 || parseInt(formData.expiryMonth) > 12)
      newErrors.expiryMonth = "Invalid month";
    const currentYear = new Date().getFullYear() % 100;
    if (!formData.expiryYear || parseInt(formData.expiryYear) < currentYear)
      newErrors.expiryYear = "Invalid year";
    if (!/^\d{3,4}$/.test(formData.cvv))
      newErrors.cvv = "Invalid CVV";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "cardNumber") {
      formattedValue = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim().slice(0, 19);
    }
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setPaymentLoader(true);
      const response = await apiConnector("POST", "/payment/process-payment", {
        email: signupData.email,
        cardNumber: formData.cardNumber,
        cardName: formData.cardName,
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        cvv: formData.cvv,
        amount: "₹499.00",
      });
      if (response.data?.failed) {
        toast.error("Already subscribed");
        navigate("/dashboard");
      } else if (response.data.subscriptionStatus) {
        toast.success("Payment successful! You are now subscribed.");
        navigate("/payment-success");
      } else {
        toast.error("Payment failed. Please try again.");
        navigate("/payment-failure");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment processing failed");
      navigate("/payment-failure");
    } finally {
      setPaymentLoader(false);
    }
  };

  // ── Input field helper ──────────────────────────────────────────
  const inputClass = (hasError) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1.5px solid ${hasError ? "#EF4444" : inputBorder}`,
    background: inputBg,
    color: textPrimary,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  });

  // ── Cancel modal ────────────────────────────────────────────────
  const CancelModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <div
          className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: textPrimary }}>Cancel Transaction</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? "#1F2937" : "#F1F5F9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: textSecond }}>
              Are you sure you want to cancel this transaction? Any progress will be lost.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: isDark ? "#1F2937" : "#F1F5F9", color: textPrimary, border: `1px solid ${cardBorder}` }}
            >
              Keep Payment
            </button>
            <Link
              to="/payment-failure"
              onClick={() => setShowCancelModal(false)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white text-center transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}
            >
              Cancel Payment
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: pageBg }}
    >
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: isDark ? "linear-gradient(to bottom, rgba(99,102,241,0.12), transparent)" : "linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)" }} />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none"
        style={{ background: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)" }} />

      <div
        className="w-full max-w-md rounded-3xl overflow-hidden relative z-10 transition-colors duration-300"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isDark ? "0 8px 48px rgba(0,0,0,0.5)" : "0 8px 48px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div
          className="p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
            style={{ background: "rgba(255,255,255,0.3)", transform: "translate(30%, -30%)" }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold text-white">Payment Details</h2>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
                <ShieldCheck size={14} className="text-white/80" />
                <span className="text-white/90 text-xs font-semibold">Secure</span>
              </div>
            </div>
            <p className="text-blue-100 text-sm">SmaranAI.in · Pro Subscription · ₹499.00</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Card Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: textMuted }}>
                Card Number
              </label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type="text" name="cardNumber" value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  style={{ ...inputClass(!!errors.cardNumber), paddingLeft: 40 }}
                  onFocus={(e) => e.target.style.borderColor = inputFocus}
                  onBlur={(e) => e.target.style.borderColor = errors.cardNumber ? "#EF4444" : inputBorder}
                />
              </div>
              {errors.cardNumber && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />{errors.cardNumber}
                </p>
              )}
            </div>

            {/* Name on Card */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: textMuted }}>
                Name on Card
              </label>
              <input
                type="text" name="cardName" value={formData.cardName}
                onChange={handleInputChange} placeholder="John Doe"
                style={inputClass(!!errors.cardName)}
                onFocus={(e) => e.target.style.borderColor = inputFocus}
                onBlur={(e) => e.target.style.borderColor = errors.cardName ? "#EF4444" : inputBorder}
              />
              {errors.cardName && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />{errors.cardName}
                </p>
              )}
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "expiryMonth", label: "Month", placeholder: "MM", max: 2 },
                { key: "expiryYear",  label: "Year",  placeholder: "YY", max: 2 },
                { key: "cvv",         label: "CVV",   placeholder: "123", max: 4, type: "password" },
              ].map(({ key, label, placeholder, max, type }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: textMuted }}>{label}</label>
                  <input
                    type={type || "text"} name={key} value={formData[key]}
                    onChange={handleInputChange} placeholder={placeholder}
                    maxLength={max}
                    style={inputClass(!!errors[key])}
                    onFocus={(e) => e.target.style.borderColor = inputFocus}
                    onBlur={(e) => e.target.style.borderColor = errors[key] ? "#EF4444" : inputBorder}
                  />
                  {errors[key] && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle size={10} />{errors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Security note */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <ShieldCheck size={16} className="text-indigo-400 flex-shrink-0" />
              <p className="text-xs" style={{ color: textSecond }}>
                Your payment information is encrypted with 256-bit SSL
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: isDark ? "#1F2937" : "#F1F5F9", color: textPrimary, border: `1px solid ${cardBorder}` }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paymentLoader}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}
              >
                {paymentLoader ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Pay ₹499.00
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CancelModal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} />
    </div>
  );
};

export default PaymentForm;