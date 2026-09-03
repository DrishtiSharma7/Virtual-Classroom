import ForgotPasswordForm from "../components/ForgotPasswordForm/ForgotPasswordForm";
import usePageMeta from "../../../hooks/usePageMeta";

function ForgotPasswordPage() {
  usePageMeta(
    "Forgot Password",
    "Reset your Virtual Classroom password to regain access to your courses and live sessions."
  );

  return <ForgotPasswordForm />;
}

export default ForgotPasswordPage;
