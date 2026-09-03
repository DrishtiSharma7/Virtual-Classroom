import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import LoginIllustration from "../../../../assets/Login.png";
import LoginIllustrationWebp from "../../../../assets/Login.webp";
import { forgotPassword, resetPassword } from "../../api/auth.api";
import "../LoginForm/LoginForm.css";

function ForgotPasswordForm() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: New Password, 3: Success
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    let timer;
    if (step === 3 && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (step === 3 && countdown === 0) {
      navigate("/login", { replace: true });
    }
    return () => clearTimeout(timer);
  }, [step, countdown, navigate]);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await forgotPassword(email.trim());
      setResetToken(res.resetToken || "");
      toast.success("Account verified. Please set your new password.");
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No account found with this email. Please check and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await resetPassword({
        email: email.trim(),
        resetToken,
        newPassword,
      });
      toast.success("Password updated successfully!");
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f8faff]">
      <header className="relative z-10 flex items-center gap-2.5 px-5 pt-6 sm:px-10 sm:pt-8">
        <GraduationCap className="h-9 w-9 text-[#4b4fd6] sm:h-[42px] sm:w-[42px]" />
        <span className="text-2xl font-bold text-[#1d1d1f] sm:text-[28px]">
          Virtual Classroom
        </span>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-6 sm:px-5">
        <div className="animate-card-fade-in flex w-full max-w-[1050px] flex-col overflow-hidden rounded-[18px] bg-[#e5e9f9] shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:rounded-3xl md:min-h-[560px] md:flex-row">
          {/* Left Decorative Banner */}
          <section className="hidden flex-1 flex-row items-center justify-between gap-3 bg-[#e5e9f9] px-5 py-5 text-left sm:flex-col sm:items-center sm:justify-center sm:gap-0 sm:px-8 sm:py-9 sm:text-center md:px-5 md:py-12 lg:flex">
            <div className="flex flex-col sm:order-2 sm:items-center">
              <h2 className="mb-1.5 text-lg font-bold leading-tight text-gray-900 sm:mb-3.5 sm:text-2xl md:text-[28px]">
                Secure Account Recovery
              </h2>
              <p className="hidden max-w-[420px] text-base leading-[1.7] text-[#404244] sm:block">
                Regain quick access to your Virtual Classroom courses, live
                sessions, assignments, and whiteboard discussions.
              </p>
            </div>

            <picture>
              <source srcSet={LoginIllustrationWebp} type="image/webp" />
              <img
                src={LoginIllustration}
                alt="Virtual Classroom Illustration"
                width={620}
                height={403}
                decoding="async"
                fetchPriority="high"
                className="w-2/5 max-w-[170px] flex-shrink-0 sm:order-1 sm:w-3/5 sm:max-w-full sm:pb-8 md:w-full"
              />
            </picture>
          </section>

          {/* Right Form Card */}
          <section className="flex flex-1 flex-col items-center justify-center rounded-t-[18px] bg-white px-5 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:rounded-t-3xl sm:px-8 sm:py-9 md:rounded-l-3xl md:rounded-tr-none md:px-8 md:py-8">
            <div className="w-full max-w-[400px]">
              <Link
                to="/login"
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b5fef] transition-colors hover:text-[#4347d4]"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>

              {/* STEP 1: VERIFY EMAIL */}
              {step === 1 && (
                <form onSubmit={handleVerifyEmail}>
                  <div className="mb-2 flex items-center gap-2">
                    <h1 className="text-[26px] font-bold text-[#0f0f10] sm:text-[30px]">
                      Forgot Password?
                    </h1>
                  </div>
                  <p className="mb-6 text-sm text-[#61646b] sm:text-base">
                    Enter the email associated with your account to verify your
                    identity and reset your password.
                  </p>

                  {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-600">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="relative mb-5">
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      required
                      autoFocus
                      className="h-14 w-full rounded-[14px] border border-[#d9dce8] bg-white px-[18px] font-inherit text-base text-[#1d1d1f] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-gray-400 focus:border-[#6b8ef7] focus:shadow-[0_0_0_4px_rgba(107,142,247,0.15)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    data-tooltip="Continue"
                    title="Continue"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border-none bg-gradient-to-br from-[#5c60f3] to-[#4b4fd6] text-base font-semibold text-white shadow-[0_8px_20px_rgba(91,95,239,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(91,95,239,0.36)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <div className="mt-6 text-center">
                    <span className="text-sm text-gray-500">
                      Remember your password?{" "}
                    </span>
                    <Link
                      to="/login"
                      className="text-sm font-semibold text-[#5b5fef] hover:underline"
                    >
                      Sign in
                    </Link>
                  </div>
                </form>
              )}

              {/* STEP 2: SET NEW PASSWORD */}
              {step === 2 && (
                <form onSubmit={handleResetPassword}>
                  <div className="mb-2 flex items-center gap-2">
                    <h1 className="text-[26px] font-bold text-[#0f0f10] sm:text-[30px]">
                      Set New Password
                    </h1>
                  </div>

                  <div className="mb-6 flex items-center justify-between rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-xs text-indigo-700 sm:text-sm">
                    <span className="truncate">
                      Resetting password for: <strong>{email}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError("");
                      }}
                      data-tooltip="Change Email"
                      title="Change email"
                      className="ml-2 shrink-0 font-semibold underline hover:text-indigo-900"
                    >
                      Change
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-600">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="relative mb-4">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password (min. 6 characters)"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError("");
                      }}
                      required
                      autoFocus
                      className="h-14 w-full rounded-[14px] border border-[#d9dce8] bg-white px-[18px] pr-12 font-inherit text-base text-[#1d1d1f] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-gray-400 focus:border-[#6b8ef7] focus:shadow-[0_0_0_4px_rgba(107,142,247,0.15)]"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center border-none bg-transparent p-0 text-gray-400 hover:text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                      data-tooltip={showPassword ? "Hide Password" : "Show Password"}
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="relative mb-5">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
                      required
                      className="h-14 w-full rounded-[14px] border border-[#d9dce8] bg-white px-[18px] pr-12 font-inherit text-base text-[#1d1d1f] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-gray-400 focus:border-[#6b8ef7] focus:shadow-[0_0_0_4px_rgba(107,142,247,0.15)]"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center border-none bg-transparent p-0 text-gray-400 hover:text-gray-500"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      data-tooltip={showConfirmPassword ? "Hide Password" : "Show Password"}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    data-tooltip="Save Password"
                    title="Update Password"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border-none bg-gradient-to-br from-[#5c60f3] to-[#4b4fd6] text-base font-semibold text-white shadow-[0_8px_20px_rgba(91,95,239,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(91,95,239,0.36)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Updating Password...</span>
                      </div>
                    ) : (
                      <>
                        <ShieldCheck size={19} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: SUCCESS CONFIRMATION */}
              {step === 3 && (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={36} />
                  </div>

                  <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-[28px]">
                    Password Updated!
                  </h1>
                  <p className="mb-6 text-sm text-[#61646b] sm:text-base">
                    Your password has been successfully updated on the server.
                    You can now sign in with your new credentials.
                  </p>

                  <button
                    onClick={() => navigate("/login", { replace: true })}
                    data-tooltip="Sign In"
                    title="Sign In Now"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border-none bg-gradient-to-br from-[#5c60f3] to-[#4b4fd6] text-base font-semibold text-white shadow-[0_8px_20px_rgba(91,95,239,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(91,95,239,0.36)]"
                  >
                    <span>Sign In Now</span>
                    <ArrowRight size={18} />
                  </button>

                  <p className="mt-4 text-xs text-gray-400">
                    Redirecting to sign-in page in {countdown}s...
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordForm;
