import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff, User } from "lucide-react";
import LoginIllustration from "../../../assets/Login.png";
import "./LoginForm.css";

import { loginUser } from "../api/auth.api";
import useAuth from "../hooks/useAuth";

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
    }
  };

  return (
    <div className="login-page">
      {/* Floating background blur circles */}
      <header className="login-header">
        <GraduationCap className="logo-icon" />
        <span className="logo-text">Virtual Classroom</span>
      </header>

      {/* Main Card */}
      <main className="login-container">
        <div className="login-card">
          {/* LEFT PANEL */}
          <section className="login-left">
            <img
              src={LoginIllustration}
              alt="Virtual Classroom Illustration"
              className="login-illustration"
            />

            <h2 className="left-heading">Learn, Teach and Collaborate</h2>

            <p className="left-text">
              Manage your virtual classrooms, attend live sessions, submit
              assignments, and stay connected from anywhere.
            </p>
          </section>

          {/* RIGHT PANEL */}
          <section className="login-right">
            <form className="login-form" onSubmit={handleSubmit}>
              <h1 className="welcome-heading">
                Welcome Back <span className="wave">👋</span>
              </h1>

              <p className="welcome-subtitle">
                Sign in to continue to your Virtual Classroom.
              </p>

              {/* EMAIL */}
              <div className="input-box">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="input-box">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* OPTIONS */}
              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <span>Remember Me</span>
                </label>

                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              {/* ROLE SELECTOR */}
              <div className="role-selector">
                <button
                  type="button"
                  className={
                    role === "teacher" ? "role-btn active" : "role-btn"
                  }
                  onClick={() => setRole("teacher")}
                >
                  <User size={22} />
                  Teacher
                </button>

                <button
                  type="button"
                  className={
                    role === "student" ? "role-btn active" : "role-btn"
                  }
                  onClick={() => setRole("student")}
                >
                  <GraduationCap size={24} />
                  Student
                </button>
              </div>

              {/* LOGIN BUTTON */}
              <button type="submit" className="login-btn">
                Login
              </button>

              {/* REGISTER */}
              <p className="register-text">
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default LoginForm;
