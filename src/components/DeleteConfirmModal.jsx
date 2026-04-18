import { useState, useEffect } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const DeleteConfirmModal = ({
  title = "Confirm Delete",
  onConfirm,
  onClose,
  loading = false,
  itemName = "",
  matchName = "", // Optional: if provided, user must type this to confirm
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [typedName, setTypedName] = useState("");

  useEffect(() => {
    if (!loading) {
      setPassword("");
      setTypedName("");
    }
  }, [loading]);

  const isNameMatching = !matchName || typedName === matchName;
  const isFormValid = password && isNameMatching;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl w-[450px] shadow-2xl border border-gray-100 transform transition-all">
        <h3 className="text-red-600 font-bold text-lg mb-2 flex items-center gap-2">
          {title}
        </h3>

        <p className="text-gray-600 text-sm mb-4">
          Are you sure you want to delete <span className="font-semibold text-gray-800">{matchName || itemName}</span>?
          This action cannot be undone.
        </p>

        {/* Safety Check: Type Name */}
        {matchName && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To confirm, type "<span className="font-bold select-all">{matchName}</span>" in the box below
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-red-500 focus:ring-red-500 transition-colors bg-gray-50 font-mono text-sm"
              placeholder={matchName}
              onPaste={(e) => e.preventDefault()} // Force typing? optional. User asked "type".
              autoComplete="off"
            />
          </div>
        )}

        {/* Password Input */}
        <div className="mb-6 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enter Delete Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter delete password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-red-500 focus:ring-red-500 transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <FiEyeOff className="w-5 h-5" />
              ) : (
                <FiEye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            disabled={!isFormValid || loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={() => onConfirm(password)}
          >
            {loading ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
