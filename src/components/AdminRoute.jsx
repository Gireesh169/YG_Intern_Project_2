import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

const AdminRoute = ({ children }) => {
  const { signupData } = useSelector((state) => state.auth);

  // Not logged in
  if (!signupData) {
    toast.error("Please login first");
    return <Navigate to="/" replace />;
  }

  // Logged in but NOT admin
  if (signupData.isAdmin !== true) {
    toast.error("Not authorized");
    return <Navigate to="/" replace />;
  }

  // Admin ✅
  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminRoute;
