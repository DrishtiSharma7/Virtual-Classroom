import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff, User } from "lucide-react";
import LoginIllustration from "../../../../assets/Login.png";
import "./LoginForm.css";

import { loginUser } from "../../api/auth.api";
import useAuth from "../../hooks/useAuth";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState("student");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const data = await loginUser({
        ...formData,
        role,
      });

      login(data);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f8faff]">
      {/* Header */}
      <header className="relative z-10 flex items-center gap-2.5 px-5 pt-6 sm:px-10 sm:pt-8">
        <GraduationCap className="h-9 w-9 text-[#4b4fd6] sm:h-[42px] sm:w-[42px]" />
        <span className="text-2xl font-bold text-[#1d1d1f] sm:text-[28px]">
          Virtual Classroom
        </span>
      </header>

      {/* Main container */}
      <main className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-6 sm:px-5">
        <div className="animate-card-fade-in flex w-full max-w-[1050px] flex-col overflow-hidden rounded-[18px] bg-[#e5e9f9] shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:rounded-3xl md:min-h-[560px] md:flex-row">
          {/* LEFT PANEL */}
          <section className="flex flex-1 flex-row items-center justify-between gap-3 bg-[#e5e9f9] px-5 py-5 text-left sm:flex-col sm:items-center sm:justify-center sm:gap-0 sm:px-8 sm:py-9 sm:text-center md:px-5 md:py-12">
            <div className="flex flex-col sm:order-2 sm:items-center">
              <h2 className="mb-1.5 text-lg font-bold leading-tight text-gray-900 sm:mb-3.5 sm:text-2xl md:text-[28px]">
                Learn, Teach and Collaborate
              </h2>

              <p className="hidden max-w-[420px] text-base leading-[1.7] text-[#404244] sm:block">
                Manage your virtual classrooms, attend live sessions, submit
                assignments, and stay connected from anywhere.
              </p>
            </div>

            <img
              src={LoginIllustration}
              alt="Virtual Classroom Illustration"
              className="w-2/5 max-w-[170px] flex-shrink-0 sm:order-1 sm:w-3/5 sm:max-w-full sm:pb-8 md:w-full"
            />
          </section>

          {/* RIGHT PANEL */}
          <section className="flex flex-1 flex-col items-center justify-center rounded-t-[18px] bg-white px-5 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:rounded-t-3xl sm:px-8 sm:py-9 md:rounded-l-3xl md:rounded-tr-none md:px-6 md:py-6">
            <form className="w-full max-w-[400px]" onSubmit={handleSubmit}>
              <h1 className="mb-2 text-[26px] font-bold text-[#0f0f10] sm:text-[32px]">
                Welcome Back <span className="inline-block">👋</span>
              </h1>

              <p className="mb-7 text-base text-[#61646b] sm:text-lg">
                Sign in to continue to your Virtual Classroom.
              </p>

              {/* EMAIL */}
              <div className="relative mb-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-14 w-full rounded-[14px] border border-[#d9dce8] bg-white px-[18px] font-inherit text-base text-[#1d1d1f] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-gray-400 focus:border-[#6b8ef7] focus:shadow-[0_0_0_4px_rgba(107,142,247,0.15)]"
                />
              </div>

              {/* PASSWORD */}
              <div className="relative mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-14 w-full rounded-[14px] border border-[#d9dce8] bg-white px-[18px] pr-12 font-inherit text-base text-[#1d1d1f] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-gray-400 focus:border-[#6b8ef7] focus:shadow-[0_0_0_4px_rgba(107,142,247,0.15)]"
                />

                <button
                  type="button"
                  className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center border-none bg-transparent p-0 text-gray-400 hover:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* OPTIONS */}
              <div className="mb-5 mt-1 flex flex-wrap items-center justify-between gap-2">
                <label className="flex select-none items-center gap-2 text-base text-gray-700 sm:text-lg">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="h-4 w-4 cursor-pointer accent-[#5b5fef]"
                  />
                  <span>Remember Me</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-base font-semibold text-[#5b5fef] no-underline hover:underline sm:text-lg"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* ROLE SELECTOR */}
              <div className="mb-5 flex gap-3">
                <button
                  type="button"
                  className={
                    role === "teacher"
                      ? "flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-transparent bg-gradient-to-br from-[#5c60f3] to-[#4b4fd6] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(91,95,239,0.28)] transition-all duration-200 sm:text-[15px]"
                      : "flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-[#5b5fef] bg-white text-sm font-semibold text-[#5b5fef] transition-all duration-200 hover:bg-[#f3f4ff] sm:text-[15px]"
                  }
                  onClick={() => setRole("teacher")}
                >
                  <User size={22} />
                  Teacher
                </button>

                <button
                  type="button"
                  className={
                    role === "student"
                      ? "flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-transparent bg-gradient-to-br from-[#5c60f3] to-[#4b4fd6] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(91,95,239,0.28)] transition-all duration-200 sm:text-[15px]"
                      : "flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-[#5b5fef] bg-white text-sm font-semibold text-[#5b5fef] transition-all duration-200 hover:bg-[#f3f4ff] sm:text-[15px]"
                  }
                  onClick={() => setRole("student")}
                >
                  <GraduationCap size={24} />
                  Student
                </button>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="mb-5 h-[54px] w-full rounded-full border-none bg-gradient-to-br from-[#5b5fef] to-[#4347d9] text-[17px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(75,79,214,0.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              {/* REGISTER */}
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#5b5fef] no-underline hover:underline"
                >
                  Register
                </Link>
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default LoginForm;
