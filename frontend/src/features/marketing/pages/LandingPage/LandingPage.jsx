import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  GraduationCap,
  Video,
  PencilRuler,
  ClipboardList,
  CalendarCheck,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

import LoginIllustration from "../../../../assets/Login.png";
import usePageMeta from "../../../../hooks/usePageMeta";

const FEATURES = [
  {
    Icon: Video,
    title: "Live video classes",
    description:
      "Camera, mic, and screen share for every teacher and student — one click to join, no extra software.",
  },
  {
    Icon: PencilRuler,
    title: "Collaborative whiteboard",
    description:
      "A real-time, multi-page whiteboard everyone can see live, with drawing, shapes, and export to PDF.",
  },
  {
    Icon: ClipboardList,
    title: "Quizzes & assignments",
    description:
      "Launch quizzes mid-class, collect submissions, and track results — all without leaving the session.",
  },
  {
    Icon: CalendarCheck,
    title: "Attendance, automatically",
    description:
      "Every session's attendance is tracked for you, ready to review any time from the dashboard.",
  },
];

function LandingPage() {
  const token = useSelector((state) => state.auth.token);

  usePageMeta(
    "Live Online Classes, Whiteboard & Quizzes",
    "Virtual Classroom is a live online teaching platform — video classes, a real-time collaborative whiteboard, quizzes, attendance, and assignments in one place for teachers and students."
  );

  // Already signed in — the marketing page isn't for them, send them
  // straight to what they actually came back for.
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f8faff]">
      <header className="relative z-10 flex items-center justify-between gap-2.5 px-5 pt-6 sm:px-10 sm:pt-8">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="h-9 w-9 text-[#4b4fd6] sm:h-[42px] sm:w-[42px]" />
          <span className="text-2xl font-bold text-[#1d1d1f] sm:text-[28px]">
            Virtual Classroom
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-[#5b5fef] no-underline hover:underline sm:text-base"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-gradient-to-br from-[#5b5fef] to-[#4347d9] px-4 py-2 text-sm font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(75,79,214,0.3)] sm:px-5 sm:py-2.5 sm:text-base"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col-reverse items-center gap-8 px-5 py-12 sm:px-10 sm:py-16 md:flex-row md:gap-12 md:py-24">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-extrabold leading-tight text-[#0f0f10] sm:text-4xl md:text-5xl">
            Teach and learn together,
            <br className="hidden sm:block" /> from anywhere.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#61646b] sm:text-lg md:mx-0">
            Live video classes, a shared whiteboard, quizzes, and attendance
            — everything a classroom needs, in one link.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#5b5fef] to-[#4347d9] px-7 py-3.5 text-base font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(75,79,214,0.3)] sm:w-auto"
            >
              Create your classroom
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="w-full rounded-full border-[1.5px] border-[#5b5fef] px-7 py-3.5 text-center text-base font-semibold text-[#5b5fef] no-underline transition-colors duration-200 hover:bg-[#f3f4ff] sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
        </div>
        <img
          src={LoginIllustration}
          alt="Teacher and students in a virtual classroom"
          className="w-2/3 max-w-[340px] flex-shrink-0 md:w-1/2 md:max-w-[420px]"
        />
      </main>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 sm:px-10 sm:pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(15,15,16,0.05)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3f4ff] text-[#5b5fef]">
                <Icon size={22} />
              </div>
              <h3 className="mb-1.5 text-base font-bold text-[#0f0f10]">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-[#61646b]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 text-center sm:px-10 sm:pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-[#5b5fef] to-[#4347d9] px-6 py-12 shadow-[0_20px_50px_rgba(75,79,214,0.25)] sm:px-12">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-white/90" />
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to run your first class?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/80 sm:text-base">
            Free to get started. Set up a classroom in minutes.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#4347d9] no-underline transition-transform duration-200 hover:-translate-y-0.5"
          >
            Get started for free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#e5e9f9] px-5 py-6 text-center text-sm text-[#61646b] sm:px-10">
        © {new Date().getFullYear()} Virtual Classroom. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
