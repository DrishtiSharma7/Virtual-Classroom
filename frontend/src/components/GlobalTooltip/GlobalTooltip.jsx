import React, { useEffect, useState, useRef } from "react";
import "./GlobalTooltip.css";

const PHRASE_MAP = {
  // Navigation & General
  "toggle navigation menu": "Menu",
  "log out of your account": "Logout",
  "logout": "Logout",
  "return to classrooms list": "Classrooms",
  "back to classrooms": "Classrooms",
  "back to quizzes": "Quizzes",
  "return to quizzes list": "Quizzes",
  "go to classroom": "Classroom",
  "open enrolled classroom page": "Classroom",
  "open this classroom's hub": "Open",
  "open classroom": "Open",
  "enter classroom": "Open",
  "view": "View",
  "close": "Close",
  "cancel": "Cancel",
  "save": "Save",
  "submit": "Submit",
  "retry": "Retry",
  "next": "Next",
  "previous": "Previous",
  "go to next page": "Next",
  "go to previous page": "Previous",

  // Classroom & Sessions
  "create a new classroom for your students": "Create Classroom",
  "create a new classroom": "Create Classroom",
  "create new classroom": "Create Classroom",
  "create classroom": "Create Classroom",
  "join a classroom using an invite code": "Join Classroom",
  "join this classroom": "Join Classroom",
  "join classroom": "Join Classroom",
  "permanently delete this classroom": "Delete Classroom",
  "delete classroom": "Delete Classroom",
  "copy classroom invite code to clipboard": "Copy Code",
  "copy code": "Copy Code",
  "start a live video session for this class": "Start Session",
  "start live session": "Start Session",
  "rejoin ongoing live session": "Rejoin Session",
  "rejoin live session": "Rejoin Session",
  "join ongoing live class session": "Join Session",
  "join live session": "Join Session",
  "join session": "Join Session",
  "end this live session": "End Session",
  "end live session": "End Session",
  "end session": "End Session",
  "edit session title": "Edit Title",
  "share announcement with students": "Post Announcement",
  "post announcement": "Post Announcement",
  "edit this announcement": "Edit Announcement",
  "edit announcement": "Edit Announcement",
  "delete this announcement": "Delete Announcement",
  "delete announcement": "Delete Announcement",
  "remove student from this classroom": "Remove Student",
  "remove student": "Remove Student",

  // Attendance
  "export attendance records to excel spreadsheet": "Export Excel",
  "export attendance records to excel": "Export Excel",
  "export attendance to excel": "Export Excel",
  "export attendance": "Export Excel",
  "export excel": "Export Excel",
  "delete student attendance record": "Delete Record",
  "delete record": "Delete Record",
  "close live attendance panel": "Close Panel",
  "close attendance panel": "Close Panel",

  // Quizzes
  "download excel quiz question template": "Download Template",
  "download sample excel quiz template": "Download Template",
  "download sample excel template": "Download Template",
  "download template": "Download Template",
  "import quiz questions from an excel file": "Import Excel",
  "import quiz questions from excel file": "Import Excel",
  "import questions from excel sheet": "Import Excel",
  "import from excel": "Import Excel",
  "import excel": "Import Excel",
  "create a new quiz for your classroom": "New Quiz",
  "build a new quiz for this class": "New Quiz",
  "build new quiz": "New Quiz",
  "start another quiz for attendees": "New Quiz",
  "new quiz": "New Quiz",
  "open quiz for students to self-attempt": "Open Retake",
  "open for retake": "Open Retake",
  "close self-attempt retake for students": "Close Retake",
  "close self-attempt retake": "Close Retake",
  "close retake": "Close Retake",
  "view quiz details and responses": "View Quiz",
  "view quiz details and student responses": "View Quiz",
  "view quiz": "View Quiz",
  "export student results to excel": "Export Excel",
  "export results to excel": "Export Excel",
  "export quiz submissions to excel": "Export Excel",
  "export quiz responses to excel spreadsheet": "Export Excel",
  "export to excel": "Export Excel",
  "export results": "Export Excel",
  "permanently delete this quiz": "Delete Quiz",
  "delete quiz": "Delete Quiz",
  "close quiz builder modal": "Close",
  "delete this question": "Delete Question",
  "delete question": "Delete Question",
  "add another question to quiz": "Add Question",
  "add another question": "Add Question",
  "add question": "Add Question",
  "discard changes and exit": "Cancel",
  "save and publish this quiz": "Save Quiz",
  "save quiz": "Save Quiz",
  "start answering quiz questions": "Start Quiz",
  "attempt quiz": "Start Quiz",
  "retake this quiz now": "Retake Quiz",
  "retake quiz": "Retake Quiz",
  "cancel and discard current answers": "Cancel",
  "submit your answers for evaluation": "Submit Answers",
  "submit quiz answers for grading": "Submit Answers",
  "close live quiz panel": "Close Panel",
  "lock in and submit your selected answer": "Submit Answer",
  "launch this quiz live to attendees": "Launch Quiz",
  "launch quiz": "Launch Quiz",
  "return to saved quizzes list": "Back",
  "show correct answer to all students": "Reveal Answer",
  "reveal answer": "Reveal Answer",
  "proceed to next question": "Next Question",
  "next question": "Next Question",
  "end quiz and display results": "End Quiz",
  "terminate current live quiz": "End Quiz",

  // Recordings
  "upload recorded video for this class": "Upload Recording",
  "upload recorded video lecture": "Upload Recording",
  "upload recording": "Upload Recording",
  "watch this recorded lecture": "Watch Recording",
  "watch this session recording": "Watch Recording",
  "watch recording": "Watch Recording",
  "permanently delete this recording": "Delete Recording",
  "delete recording": "Delete Recording",
  "close upload modal": "Close",
  "close video player": "Close Player",
  "upload video file to classroom recordings": "Upload Video",

  // Live Classroom
  "end session for everyone": "End Session",
  "leave this session": "Leave Session",
  "leave session": "Leave Session",
  "manage whiteboard pages": "Manage Pages",
  "delete this whiteboard page": "Delete Page",
  "add new whiteboard page": "Add Page",
  "choose stroke color": "Stroke Color",
  "stroke color": "Stroke Color",
  "stroke style": "Stroke Style",
  "disable student drawing access": "Disable Draw",
  "allow students to draw on whiteboard": "Enable Draw",
  "reset zoom to 100%": "Reset Zoom",
  "reset zoom": "Reset Zoom",
  "fullscreen view": "Fullscreen",
  "fullscreen": "Fullscreen",
  "exit fullscreen": "Exit Fullscreen",
  "view session participants": "Participants",
  "participants": "Participants",
  "open in-call chat": "Chat",
  "chat": "Chat",
  "mute student microphone": "Mute Student",
  "mute student": "Mute Student",
  "unmute student microphone": "Unmute Student",
  "unmute student": "Unmute Student",
  "remove student from session": "Remove Student",
  "turn off student camera": "Camera Off",
  "send chat message": "Send Message",
  "send message": "Send Message",
  "retry camera stream connection": "Retry Camera",
  "switch camera source": "Switch Camera",
  "switch camera": "Switch Camera",
  "close materials viewer": "Close Materials",
  "leave room temporarily; attendees stay and you can rejoin": "Leave Room",
  "end session and disconnect all attendees": "End Session",
  "stay in the live session": "Cancel",
  "close zoomed view": "Close View",

  // Analytics & Filter
  "toggle filter controls": "Filters",
  "refresh analytics metrics": "Refresh",
  "refresh your analytics stats": "Refresh",
  "retry loading your analytics": "Retry",
  "retry fetching teacher analytics": "Retry",
  "export analytics reports": "Export",
  "download metrics as csv spreadsheet": "Export CSV",
  "export csv": "Export CSV",
  "download metrics as pdf document": "Export PDF",
  "export pdf": "Export PDF",
  "close student details": "Close Details",

  // Auth & Settings
  "sign in as a teacher": "Teacher",
  "sign in as a student": "Student",
  "register as a teacher": "Teacher",
  "register as a student": "Student",
  "log in to your account": "Login",
  "create your new account": "Create Account",
  "create account": "Create Account",
  "verify email and proceed to reset password": "Continue",
  "change target email address": "Change Email",
  "save new password to server": "Save Password",
  "proceed to sign-in page": "Sign In",
  "sign in now": "Sign In",
  "show password text": "Show Password",
  "hide password text": "Hide Password",
  "show password": "Show Password",
  "hide password": "Hide Password",
  "save updated profile changes": "Save Profile",
  "save changes": "Save Profile",
  "save new account password": "Save Password",
  "update password": "Save Password",
  "click to disable": "Disable",
  "click to enable": "Enable",
};

const STOP_WORDS = new Set([
  "a", "an", "the", "to", "for", "of", "and", "or", "in", "on", "your",
  "this", "that", "these", "those", "all", "now", "here", "yet", "from"
]);

/**
 * Ensures any tooltip string is strictly 1 or 2 words.
 */
function toOneOrTwoWords(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  const trimmed = rawText.trim().replace(/[.!?:;]+$/g, "").trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();

  // 1. Direct phrase lookup
  if (PHRASE_MAP[lower]) {
    return PHRASE_MAP[lower];
  }

  // 2. Check for dynamic pattern like "Filter quizzes: Attempted" -> "Filter Attempted"
  if (lower.startsWith("filter quizzes:")) {
    const part = trimmed.split(":")[1]?.trim() || "";
    return part ? `Filter ${part}` : "Filter";
  }

  // 3. Dynamic pattern like "Switch to Page 1" -> "Page 1"
  if (lower.startsWith("switch to ")) {
    const rest = trimmed.slice(10).trim();
    const restWords = rest.split(/\s+/);
    return restWords.slice(0, 2).join(" ");
  }

  // 4. Dynamic pattern like "View whiteboard materials for Page 1" -> "Materials"
  if (lower.includes("whiteboard materials")) {
    return "Materials";
  }

  // 5. Dynamic pattern like "Send thumbs up reaction" -> "Thumbs Up"
  if (lower.startsWith("send ") && lower.endsWith(" reaction")) {
    const middle = trimmed.slice(5, -9).trim();
    return middle.split(/\s+/).slice(0, 2).join(" ");
  }

  // 6. Dynamic pattern like "Delete <Name>'s attendance record" -> "Delete Record"
  if (lower.startsWith("delete ") && lower.includes("attendance")) {
    return "Delete Record";
  }

  // 7. General word count check
  const words = trimmed.split(/\s+/);
  if (words.length <= 2) {
    return trimmed;
  }

  // Filter out stop words to keep the two most meaningful words
  const meaningful = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
  if (meaningful.length >= 2) {
    return `${meaningful[0]} ${meaningful[1]}`;
  }
  if (meaningful.length === 1) {
    return meaningful[0];
  }

  return `${words[0]} ${words[1]}`;
}

const GlobalTooltip = () => {
  const [tooltip, setTooltip] = useState({
    text: "",
    top: 0,
    left: 0,
    position: "above",
    visible: false,
  });

  const activeElementRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const resolveTooltipText = (el) => {
      // 1. Explicit data-tooltip
      const dataTooltip = el.getAttribute("data-tooltip");
      if (dataTooltip && dataTooltip.trim()) {
        return toOneOrTwoWords(dataTooltip);
      }

      // 2. Native title
      const title = el.getAttribute("title") || el.getAttribute("data-orig-title");
      if (title && title.trim()) {
        return toOneOrTwoWords(title);
      }

      // 3. aria-label
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.trim()) {
        return toOneOrTwoWords(ariaLabel);
      }

      // 4. Fallback based on inner button text
      const text = (el.innerText || el.textContent || "").trim();
      if (text && text.length <= 40) {
        return toOneOrTwoWords(text);
      }

      return null;
    };

    const hideTooltip = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (activeElementRef.current) {
        const origTitle = activeElementRef.current.getAttribute("data-orig-title");
        if (origTitle) {
          activeElementRef.current.setAttribute("title", origTitle);
          activeElementRef.current.removeAttribute("data-orig-title");
        }
        activeElementRef.current = null;
      }
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const showForElement = (el) => {
      const text = resolveTooltipText(el);
      if (!text) {
        hideTooltip();
        return;
      }

      // Suppress browser native tooltip
      if (el.hasAttribute("title")) {
        const titleVal = el.getAttribute("title");
        if (titleVal) {
          el.setAttribute("data-orig-title", titleVal);
        }
        el.removeAttribute("title");
      }

      activeElementRef.current = el;

      if (timerRef.current) clearTimeout(timerRef.current);

      // Exactly 1 second (1000ms) hover dwell delay as requested
      timerRef.current = setTimeout(() => {
        if (!activeElementRef.current || !activeElementRef.current.isConnected) {
          hideTooltip();
          return;
        }

        const rect = activeElementRef.current.getBoundingClientRect();
        const placeBelow = rect.top < 46;
        const top = placeBelow ? rect.bottom + 8 : rect.top - 8;
        const rawLeft = rect.left + rect.width / 2;
        const left = Math.max(50, Math.min(window.innerWidth - 50, rawLeft));

        setTooltip({
          text,
          top,
          left,
          position: placeBelow ? "below" : "above",
          visible: true,
        });
      }, 1000);
    };

    const handlePointerOver = (e) => {
      const targetBtn = e.target.closest(
        'button, [data-tooltip], [role="button"]'
      );
      if (!targetBtn) {
        hideTooltip();
        return;
      }
      showForElement(targetBtn);
    };

    const handlePointerOut = (e) => {
      if (!activeElementRef.current) return;
      const related = e.relatedTarget;
      if (related && activeElementRef.current.contains(related)) return;
      hideTooltip();
    };

    const handleFocusIn = (e) => {
      const targetBtn = e.target.closest(
        'button, [data-tooltip], [role="button"]'
      );
      if (targetBtn) {
        showForElement(targetBtn);
      }
    };

    const handleFocusOut = () => {
      hideTooltip();
    };

    const handleClickOrScroll = () => {
      hideTooltip();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        hideTooltip();
      }
    };

    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("pointerout", handlePointerOut, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);
    document.addEventListener("click", handleClickOrScroll, true);
    window.addEventListener("scroll", handleClickOrScroll, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("pointerout", handlePointerOut, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
      document.removeEventListener("click", handleClickOrScroll, true);
      window.removeEventListener("scroll", handleClickOrScroll, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  if (!tooltip.text) return null;

  return (
    <div
      className={`global-tooltip-container position-${tooltip.position} ${
        tooltip.visible ? "is-visible" : "is-hidden"
      }`}
      style={{
        top: `${tooltip.top}px`,
        left: `${tooltip.left}px`,
      }}
      role="tooltip"
      aria-hidden={!tooltip.visible}
    >
      <div className="global-tooltip-bubble">
        <span>{tooltip.text}</span>
      </div>
      <div className="global-tooltip-arrow" />
    </div>
  );
};

export default GlobalTooltip;
