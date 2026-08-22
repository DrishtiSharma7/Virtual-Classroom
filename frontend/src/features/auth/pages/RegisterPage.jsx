import RegisterForm from "../components/RegisterForm/RegisterForm";
import usePageMeta from "../../../hooks/usePageMeta";

function RegisterPage() {
  usePageMeta(
    "Create Your Free Account",
    "Create a free Virtual Classroom account to start teaching or join a class — live video, whiteboard, quizzes, and attendance included."
  );

  return <RegisterForm />;
}

export default RegisterPage;
