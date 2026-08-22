import LoginForm from "../components/LoginForm/LoginForm";
import usePageMeta from "../../../hooks/usePageMeta";

function LoginPage() {
  usePageMeta(
    "Sign In",
    "Sign in to Virtual Classroom to join live classes, the collaborative whiteboard, quizzes, and more."
  );

  return <LoginForm />;
}

export default LoginPage;
