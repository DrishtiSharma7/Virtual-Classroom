import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Loader2, Save, KeyRound } from "lucide-react";

import SettingsSection, { SettingsRow } from "../../components/SettingsSection";
import ToggleSwitch from "../../components/ToggleSwitch";
import {
  getSettings,
  updateProfile,
  changePassword,
  updateSessionSettings,
  updateTeacherSettings,
  updateStudentSettings,
} from "../../api/settings.api";

const SettingsPage = () => {
  const { role } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);

  const [profile, setProfile] = useState({ name: "", email: "", role: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [session, setSession] = useState({
    joinWithCameraOn: true,
    joinWithMicOn: false,
  });
  const [teacher, setTeacher] = useState({
    defaultPenColor: "#1e293b",
    defaultStrokeSize: 3,
    defaultQuizTimeLimit: 60,
    autoMuteStudentsOnJoin: false,
    allowStudentVideoByDefault: true,
  });
  const [student, setStudent] = useState({
    preferredSessionView: "speaker",
    showQuizResultImmediately: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setProfile(data.profile);
        setSession(data.session);
        if (data.teacher) setTeacher(data.teacher);
        if (data.student) setStudent(data.student);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingSection("profile");
    try {
      const data = await updateProfile({ name: profile.name });
      setProfile(data.profile);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingSection(null);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingSection("password");
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password updated");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSessionChange = async (field, value) => {
    const updated = { ...session, [field]: value };
    setSession(updated);
    setSavingSection("session");
    try {
      const data = await updateSessionSettings({ [field]: value });
      setSession(data.session);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save preference");
      setSession(session);
    } finally {
      setSavingSection(null);
    }
  };

  const handleTeacherChange = async (field, value) => {
    const updated = { ...teacher, [field]: value };
    setTeacher(updated);
    setSavingSection("teacher");
    try {
      const data = await updateTeacherSettings({ [field]: value });
      setTeacher(data.teacher);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save preference");
      setTeacher(teacher);
    } finally {
      setSavingSection(null);
    }
  };

  const handleStudentChange = async (field, value) => {
    const updated = { ...student, [field]: value };
    setStudent(updated);
    setSavingSection("student");
    try {
      const data = await updateStudentSettings({ [field]: value });
      setStudent(data.student);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save preference");
      setStudent(student);
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account and{" "}
          {role === "teacher" ? "classroom" : "learning"} preferences.
        </p>
      </div>

      {/* Account */}
      <SettingsSection
        title="Account"
        description="Your basic profile information."
      >
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={profile.role === "teacher" ? "Teacher" : "Student"}
              disabled
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500 capitalize cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={savingSection === "profile"}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {savingSection === "profile" ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            Save changes
          </button>
        </form>
      </SettingsSection>

      {/* Security */}
      <SettingsSection
        title="Security"
        description="Update the password used to sign in."
      >
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                minLength={6}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                minLength={6}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingSection === "password"}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {savingSection === "password" ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <KeyRound size={16} />
            )}
            Update password
          </button>
        </form>
      </SettingsSection>

      {/* Session preferences — shared by both roles */}
      <SettingsSection
        title="Live Session"
        description="Defaults applied when you join a video session."
      >
        <SettingsRow
          label="Join with camera on"
          description="Your video starts on automatically when you enter a session."
        >
          <ToggleSwitch
            checked={session.joinWithCameraOn}
            onChange={(val) => handleSessionChange("joinWithCameraOn", val)}
          />
        </SettingsRow>
        <SettingsRow
          label="Join with microphone on"
          description="Your microphone starts unmuted when you enter a session."
        >
          <ToggleSwitch
            checked={session.joinWithMicOn}
            onChange={(val) => handleSessionChange("joinWithMicOn", val)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* Teacher-only settings */}
      {role === "teacher" && (
        <>
          <SettingsSection
            title="Whiteboard Defaults"
            description="Default tool settings when you open the whiteboard."
          >
            <SettingsRow label="Default pen colour">
              <input
                type="color"
                value={teacher.defaultPenColor}
                onChange={(e) => handleTeacherChange("defaultPenColor", e.target.value)}
                className="h-9 w-14 rounded border border-slate-300 cursor-pointer"
              />
            </SettingsRow>
            <SettingsRow
              label="Default stroke size"
              description={`${teacher.defaultStrokeSize}px`}
            >
              <input
                type="range"
                min={1}
                max={20}
                value={teacher.defaultStrokeSize}
                onChange={(e) =>
                  handleTeacherChange("defaultStrokeSize", Number(e.target.value))
                }
                className="w-40 accent-blue-600"
              />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection
            title="Live Quiz Defaults"
            description="Applied when you create a new in-class quiz."
          >
            <SettingsRow
              label="Default time limit per question"
              description="Between 30 and 120 seconds."
            >
              <select
                value={teacher.defaultQuizTimeLimit}
                onChange={(e) =>
                  handleTeacherChange("defaultQuizTimeLimit", Number(e.target.value))
                }
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[30, 45, 60, 90, 120].map((sec) => (
                  <option key={sec} value={sec}>
                    {sec} seconds
                  </option>
                ))}
              </select>
            </SettingsRow>
          </SettingsSection>

          <SettingsSection
            title="Classroom Control"
            description="Rules applied automatically when students join your session."
          >
            <SettingsRow
              label="Auto-mute students on join"
              description="Students join with their microphone muted; they can unmute themselves after."
            >
              <ToggleSwitch
                checked={teacher.autoMuteStudentsOnJoin}
                onChange={(val) => handleTeacherChange("autoMuteStudentsOnJoin", val)}
              />
            </SettingsRow>
            <SettingsRow
              label="Allow students' video by default"
              description="Students can turn their camera on unless you mute it."
            >
              <ToggleSwitch
                checked={teacher.allowStudentVideoByDefault}
                onChange={(val) =>
                  handleTeacherChange("allowStudentVideoByDefault", val)
                }
              />
            </SettingsRow>
          </SettingsSection>
        </>
      )}

      {/* Student-only settings */}
      {role === "student" && (
        <SettingsSection
          title="Learning Preferences"
          description="Personalize how sessions and quizzes appear to you."
        >
          <SettingsRow
            label="Preferred session view"
            description="How the teacher's video and whiteboard are laid out."
          >
            <select
              value={student.preferredSessionView}
              onChange={(e) =>
                handleStudentChange("preferredSessionView", e.target.value)
              }
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="speaker">Speaker view</option>
              <option value="grid">Grid view</option>
            </select>
          </SettingsRow>
          <SettingsRow
            label="Show result after each quiz question"
            description="See whether your answer was correct as soon as you submit it."
          >
            <ToggleSwitch
              checked={student.showQuizResultImmediately}
              onChange={(val) =>
                handleStudentChange("showQuizResultImmediately", val)
              }
            />
          </SettingsRow>
        </SettingsSection>
      )}
    </div>
  );
};

export default SettingsPage;