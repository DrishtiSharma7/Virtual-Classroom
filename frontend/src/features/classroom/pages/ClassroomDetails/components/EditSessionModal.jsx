import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function EditSessionModal({
  isOpen,
  onClose,
  initialTitle,
  subject,
  onSave,
}) {
  const [sessionTitleInput, setSessionTitleInput] = useState(initialTitle || "");
  const [savingSessionTitle, setSavingSessionTitle] = useState(false);
  const [sessionTitleError, setSessionTitleError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSessionTitleInput(initialTitle || "");
      setSessionTitleError("");
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = sessionTitleInput.trim();
    if (!trimmed) {
      setSessionTitleError("Session title cannot be empty.");
      return;
    }
    try {
      setSavingSessionTitle(true);
      setSessionTitleError("");
      await onSave(trimmed);
      onClose();
    } catch (err) {
      setSessionTitleError(
        err.response?.data?.message || "Unable to update session title."
      );
    } finally {
      setSavingSessionTitle(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">Edit Session Title</h2>
          <button
            onClick={onClose}
            data-tooltip="Close modal"
            title="Close"
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {sessionTitleError && (
          <p className="form-error">{sessionTitleError}</p>
        )}

        <div className="form-field">
          <label className="form-label">Session Title</label>
          <input
            value={sessionTitleInput}
            onChange={(e) => setSessionTitleInput(e.target.value)}
            placeholder={`e.g. ${subject || "Class"} Live Session`}
            className="form-input"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={savingSessionTitle}
          data-tooltip="Save updated"
          title="Save"
          className="join-btn mt-6 w-full justify-center"
        >
          {savingSessionTitle ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
