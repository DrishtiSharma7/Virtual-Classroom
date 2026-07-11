import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "../store/authSlice";

export default function useAuth() {
  const dispatch = useDispatch();

  const login = (data) => {
    dispatch(
      loginSuccess({
        token: data.token,
        user: data.user,
        role: data.user.role,
      })
    );
  };

  const signOut = () => {
    dispatch(logout());
  };

  return {
    login,
    signOut,
  };
}