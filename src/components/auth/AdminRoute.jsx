import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const signupData = useSelector((state) => state.auth.signupData);

  // ⏳ HARD BLOCK until redux is ready
  if (!signupData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // ❌ Not admin
  if (!signupData.isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // ✅ Admin
  return children;
};

export default AdminRoute;
