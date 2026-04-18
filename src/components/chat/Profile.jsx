import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";

const ProfileModal = ({ show, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session } = {} } = await supabase.auth.getSession();
        if (!session) throw new Error("User not authenticated");

        const token = session.access_token;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to fetch profile");
        }

        const { profile } = await res.json();
        setProfile(profile || {});
        setFullName(profile?.full_name || "");
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [show]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);

    try {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      const token = session.access_token;
      if(!fullName.trim()) {
        throw new Error("Full name cannot be empty");
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to update profile");

      setProfile({ ...profile, full_name: fullName.trim() });
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-96 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ✕
        </button>

        {loading && <p className="text-center mt-4 text-gray-600">Loading profile...</p>}

        {error && <p className="text-center mt-4 text-red-500 font-semibold">{error}</p>}

        {profile && !loading && (
          <div className="flex flex-col items-center mt-2">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-600 mb-4">
              {fullName ? fullName.charAt(0).toUpperCase() : "U"}
            </div>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-center text-xl font-semibold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Full Name"
            />

            <p className="text-gray-600 mb-1">
              <span className="font-medium">Email:</span> {profile.email || "-"}
            </p>

            <p className="text-gray-600 mb-4">
              <span className="font-medium">Role:</span> {profile.role || "-"}
            </p>

            <button
              onClick={handleSave}
              disabled={saving || !fullName.trim()}
              className="mt-3 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
