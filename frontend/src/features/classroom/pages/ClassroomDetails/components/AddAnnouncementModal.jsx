import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

export default function AddAnnouncementModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementDescription, setAnnouncementDescription] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAnnouncementTitle("");
      setAnnouncementDescription("");
      setAnnouncementError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!announcementTitle.trim()) {
      setAnnouncementError("Give this announcement a title.");
      return;
    }
    try {
      setPostingAnnouncement(true);
      setAnnouncementError("");
      await onSubmit({
        title: announcementTitle.trim(),
        description: announcementDescription.trim(),
      });
      onClose();
    } catch (err) {
      setAnnouncementError(
        err.response?.data?.message || "Unable to post announcement."
      );
    } finally {
      setPostingAnnouncement(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-2">
            <Megaphone size={18} className="text-indigo-600" />
            Post Announcement
          </h2>
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

        {announcementError && (
          <p className="form-error">{announcementError}</p>
        )}

        <div className="form-field">
          <label className="form-label">Title</label>
          <input
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            placeholder="e.g. Class rescheduled to 4 PM"
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Description (optional)</label>
          <input
            value={announcementDescription}
            onChange={(e) => setAnnouncementDescription(e.target.value)}
            placeholder="Add more details..."
            className="form-input"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={postingAnnouncement}
          data-tooltip="Publish announcement"
          title="Post"
          className="join-btn mt-6 w-full justify-center"
        >
          {postingAnnouncement ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
