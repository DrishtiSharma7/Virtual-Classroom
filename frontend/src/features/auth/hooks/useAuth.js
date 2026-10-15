import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "../store/authSlice";
import { logoutUser } from "../api/auth.api";

function useAuth() {
  const dispatch = useDispatch();

  const login = (data) => {
    dispatch(
      loginSuccess({
        token: data.token,
        user: data.user,
        role: data.user?.role || data.role,
      })
    );
  };

  const signOut = async () => {
    try {
      await logoutUser();
    } catch {}
    dispatch(logout());
  };

  return {
    login,
    signOut,
  };
}

export default useAuth;
