import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Spinner from "./Spinner";

/**
 * Guards nested routes. Waits for the initial session check, then sends
 * logged-out visitors to /login (and back afterwards) and wrong roles home.
 */
const ProtectedRoute = ({ roles }) => {
  const { authChecked, isAuthenticated, user } = useSelector((state) => state.user);
  const location = useLocation();

  if (!authChecked) {
    return <Spinner />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
