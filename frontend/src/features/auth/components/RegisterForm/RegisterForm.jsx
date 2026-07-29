import { useState } from "react";
import { registerUser } from "../../api/auth.api";
import { useNavigate } from "react-router-dom";
import RegisterIllustration from "../../../../assets/Register.png";
import {
  GraduationCap,
  User,
  Eye,
  EyeOff,
  BookOpen,
  Laptop,
  MessageSquare,
  Video,
  Users,
} from "lucide-react";
import "./RegisterForm.css";

function RegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [loading, setLoading] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  
  const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

  const handleChange = (e) => {
  setFormData((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));

  if (e.target.name === "email") {
    setEmailError("");
  }
};

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateEmail(formData.email)) {
    setEmailError("Please enter a valid email address.");
    return;
  }

  setEmailError("");

  if (!agreeTerms) {
    setTermsError("Please accept the Terms & Conditions to continue.");
    return;
  }

  setTermsError("");

  setLoading(true);

  try {
    const response = await registerUser(formData);

    alert(response.message);
    navigate("/login");
  } catch (error) {
    alert(error.response?.data?.message || "Registration Failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="register-page">
      <header className="login-header">
        <GraduationCap className="logo-icon" />
        <span className="logo-text">Virtual Classroom</span>
      </header>

      <main className="login-container">
        <div className="rp-card">
          {/* -------- Left panel -------- */}
          <div className="rp-left">
            <img
              src={RegisterIllustration}
              alt="Virtual Classroom Illustration"
              className="login-illustration"
            />

            <h1 className="rp-left-heading">Start Your Learning Journey</h1>
            <p className="rp-left-text">
              Create your account to join virtual classrooms, attend live
              sessions, complete assignments, and collaborate with teachers and
              classmates.
            </p>
          </div>

          {/* -------- Right panel -------- */}
          <div className="rp-right">
            <h2 className="rp-right-heading">
              Create Account
              <GraduationCap
                size={34}
                strokeWidth={2}
                className="rp-heading-icon"
              />
            </h2>
            <p className="rp-right-subtitle">
              Register to access your Virtual Classroom.
            </p>

            <div
              className="rp-role-toggle"
              role="radiogroup"
              aria-label="Select role"
            >
              <button
                type="button"
                role="radio"
                aria-checked={formData.role === "teacher"}
                className={`rp-role-btn ${
                  formData.role === "teacher" ? "active" : ""
                }`}
                onClick={() => handleRoleSelect("teacher")}
              >
                <User size={18} /> Teacher
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={formData.role === "student"}
                className={`rp-role-btn ${
                  formData.role === "student" ? "active" : ""
                }`}
                onClick={() => handleRoleSelect("student")}
              >
                <GraduationCap size={18} /> Student
              </button>
            </div>

            <form onSubmit={handleSubmit} className="rp-form" noValidate>
              <div className="rp-field">
                <label htmlFor="name" className="rp-sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="rp-input"
                  required
                />
              </div>

              <div className="rp-field">
  <label htmlFor="email" className="rp-sr-only">
    Email Address
  </label>

  <input
    id="email"
    type="email"
    name="email"
    placeholder="Email Address"
    value={formData.email}
    onChange={handleChange}
    className="rp-input"
    required
  />

  {emailError && (
    <p className="rp-error">{emailError}</p>
  )}

              </div>

              <div className="rp-field">
                <label htmlFor="password" className="rp-sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="rp-input"
                  required
                />
                <button
                  type="button"
                  className="rp-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </button>
              </div>

              <div className="rp-field">
                <label htmlFor="confirmPassword" className="rp-sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rp-input"
                  required
                />
                <button
                  type="button"
                  className="rp-eye-btn"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </button>
              </div>

              <div className="rp-checkbox-row">
  <input
    id="agreeTerms"
    type="checkbox"
    checked={agreeTerms}
    onChange={(e) => {
      setAgreeTerms(e.target.checked);
      if (e.target.checked) setTermsError("");
    }}
    className="rp-checkbox"
  />

  <label htmlFor="agreeTerms" className="rp-checkbox-label">
    I agree to the Terms &amp; Conditions and Privacy Policy.
  </label>
</div>

{termsError && (
  <p className="rp-error">{termsError}</p>
)}
              <button
                type="submit"
                disabled={loading}
                className="rp-submit-btn"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>

            <p className="rp-login-text">
              Already have an account?{" "}
              <a href="/login" className="rp-login-link">
                Login
              </a>
            </p>
          </div>
        </div>
      </main>
      <p className="rp-footer">
        © 2026 Virtual Classroom. All Rights Reserved.
      </p>
    </div>
  );
}

export default RegisterForm;
