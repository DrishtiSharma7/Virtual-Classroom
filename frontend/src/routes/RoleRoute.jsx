import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
function RoleRoute({ allow = [], children }) {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allow.length && !allow.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleRoute;
