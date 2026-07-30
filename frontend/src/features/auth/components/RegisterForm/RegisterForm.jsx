import { useState } from "react";
import { registerUser } from "../../api/auth.api";
import { useNavigate } from "react-router-dom";
import RegisterIllustration from "../../../../assets/Register.png";
import { GraduationCap, User, Eye, EyeOff } from "lucide-react";
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

  const roleBtnClass = (active) =>
    active
      ? "flex h-11 flex-1 items-center justify-center gap-2 rounded-[30px] border border-transparent bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] text-sm font-medium text-white shadow-[0_6px_16px_rgba(79,70,229,0.3)] transition-all duration-300 lg:h-[52px] lg:text-[15px]"
      : "flex h-11 flex-1 items-center justify-center gap-2 rounded-[30px] border border-[#4f46e5] bg-white text-sm font-medium text-[#333] transition-all duration-300 hover:bg-[#4f46e5]/[0.06] lg:h-[52px] lg:text-[15px]";

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
      <main className="relative z-10 flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-6 sm:px-5">
        <div className="animate-rp-fade-in flex w-full max-w-[950px] flex-col overflow-hidden rounded-[18px] bg-gradient-to-br from-[#98d1f7] via-[#a7c4ff] to-[#dabbfb] shadow-[0_20px_45px_rgba(0,0,0,0.12)] sm:rounded-[22px] md:h-[640px] md:flex-row">
          {/* -------- Left panel -------- */}
          <div className="hidden flex-1 flex-row items-center justify-between gap-3 px-5 py-5 text-left md:flex md:flex-col md:items-center md:justify-center md:gap-0 md:px-8 md:py-12 md:text-center">
            <div className="flex flex-col md:order-2 md:items-center">
              <h1 className="mb-1.5 text-lg font-bold leading-tight text-gray-900 md:mb-3 md:text-xl lg:mb-3.5 lg:text-[28px]">
                Start Your Learning Journey
              </h1>
              <p className="hidden max-w-[420px] text-sm leading-[1.6] text-[#404244] md:block lg:text-base lg:leading-[1.7]">
                Create your account to join virtual classrooms, attend live
                sessions, complete assignments, and collaborate with teachers
                and classmates.
              </p>
            </div>

            <img
              src={RegisterIllustration}
              alt="Virtual Classroom Illustration"
              className="w-2/5 max-w-[170px] flex-shrink-0 md:order-1 md:w-3/5 md:max-w-full md:pb-8 lg:w-full"
            />
          </div>

          {/* -------- Right panel -------- */}
          <div className="flex flex-col overflow-y-auto rounded-t-[18px] bg-white px-5 py-7 sm:rounded-t-[22px] sm:px-8 sm:py-9 md:w-1/2 md:rounded-l-3xl md:rounded-tr-none md:px-8 md:py-6 lg:px-12 lg:py-10">
            <h2 className="mb-1.5 flex items-center gap-2 text-xl font-bold text-[#111] sm:text-3xl lg:text-[32px]">
              Create Account
              <GraduationCap
                size={24}
                strokeWidth={2}
                className="text-[#111] lg:h-[34px] lg:w-[34px]"
              />
            </h2>
            <p className="mb-6 text-sm text-[#555] md:text-base lg:text-lg">
              Register to access your Virtual Classroom.
            </p>

            <div
              className="mb-4 flex gap-3"
              role="radiogroup"
              aria-label="Select role"
            >
              <button
                type="button"
                role="radio"
                aria-checked={formData.role === "teacher"}
                className={roleBtnClass(formData.role === "teacher")}
                onClick={() => handleRoleSelect("teacher")}
              >
                <User size={18} /> Teacher
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={formData.role === "student"}
                className={roleBtnClass(formData.role === "student")}
                onClick={() => handleRoleSelect("student")}
              >
                <GraduationCap size={18} /> Student
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3.5"
              noValidate
            >
              <div className="relative w-full">
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-inherit text-gray-900 outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-gray-400 focus:border-[#60a5fa] focus:shadow-[0_0_0_4px_rgba(96,165,250,0.15)] lg:h-[52px] lg:px-[18px] lg:text-[15px]"
                />
              </div>

              <div className="relative w-full">
                <label htmlFor="email" className="sr-only">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-inherit text-gray-900 outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-gray-400 focus:border-[#60a5fa] focus:shadow-[0_0_0_4px_rgba(96,165,250,0.15)] lg:h-[52px] lg:px-[18px] lg:text-[15px]"
                />

                {emailError && (
                  <p className="mb-px mt-px text-sm text-red-600">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="relative w-full">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 pr-11 text-sm font-inherit text-gray-900 outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-gray-400 focus:border-[#60a5fa] focus:shadow-[0_0_0_4px_rgba(96,165,250,0.15)] lg:h-[52px] lg:px-[18px] lg:pr-12 lg:text-[15px]"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center border-none bg-transparent p-0 text-gray-500"
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

              <div className="relative w-full">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 pr-11 text-sm font-inherit text-gray-900 outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-gray-400 focus:border-[#60a5fa] focus:shadow-[0_0_0_4px_rgba(96,165,250,0.15)] lg:h-[52px] lg:px-[18px] lg:pr-12 lg:text-[15px]"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center border-none bg-transparent p-0 text-gray-500"
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

              <div className="mt-0.5 flex items-start gap-2.5">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (e.target.checked) setTermsError("");
                  }}
                  className="mt-[3px] h-4 w-4 flex-shrink-0 cursor-pointer accent-[#4f46e5]"
                />

                <label
                  htmlFor="agreeTerms"
                  className="cursor-pointer text-sm leading-[1.4] text-[#444]"
                >
                  I agree to the Terms &amp; Conditions and Privacy Policy.
                </label>
              </div>

              {termsError && (
                <p className="mb-px mt-px text-sm text-red-600">{termsError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 h-11 w-full rounded-[30px] border-none bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)] transition-[transform,box-shadow,opacity] duration-200 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_12px_26px_rgba(79,70,229,0.4)] active:enabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 lg:h-[52px] lg:text-[17px]"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>

            <p className="mt-[18px] text-center text-sm text-[#444]">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-[#4f46e5] no-underline hover:underline"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </main>

      <p className="relative z-10 mb-0.5 text-center text-sm text-gray-500 sm:text-base">
        © 2026 Virtual Classroom. All Rights Reserved.
      </p>
    </div>
  );
}

export default RegisterForm;
