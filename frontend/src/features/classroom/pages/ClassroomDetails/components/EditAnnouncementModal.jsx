import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

export default function EditAnnouncementModal({
  isOpen,
  onClose,
  announcement,
  onSubmit,
}) {
  const [editAnnouncementTitle, setEditAnnouncementTitle] = useState("");
  const [editAnnouncementDescription, setEditAnnouncementDescription] = useState("");
  const [updatingAnnouncement, setUpdatingAnnouncement] = useState(false);
  const [editAnnouncementError, setEditAnnouncementError] = useState("");

  useEffect(() => {
    if (isOpen && announcement) {
      setEditAnnouncementTitle(announcement.title || "");
      setEditAnnouncementDescription(announcement.description || "");
      setEditAnnouncementError("");
    }
  }, [isOpen, announcement]);

  if (!isOpen || !announcement) return null;

  const handleUpdate = async () => {
    if (!editAnnouncementTitle.trim()) {
      setEditAnnouncementError("Give this announcement a title.");
      return;
    }
    try {
      setUpdatingAnnouncement(true);
      setEditAnnouncementError("");
      await onSubmit(announcement._id, {
        title: editAnnouncementTitle.trim(),
        description: editAnnouncementDescription.trim(),
      });
      onClose();
    } catch (err) {
      setEditAnnouncementError(
        err.response?.data?.message || "Unable to update announcement."
      );
    } finally {
      setUpdatingAnnouncement(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-2">
            <Megaphone size={18} className="text-indigo-600" />
            Edit Announcement
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

        {editAnnouncementError && (
          <p className="form-error">{editAnnouncementError}</p>
        )}

        <div className="form-field">
          <label className="form-label">Title</label>
          <input
            value={editAnnouncementTitle}
            onChange={(e) => setEditAnnouncementTitle(e.target.value)}
            placeholder="e.g. Class rescheduled to 4 PM"
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Description (optional)</label>
          <input
            value={editAnnouncementDescription}
            onChange={(e) => setEditAnnouncementDescription(e.target.value)}
            placeholder="Add more details..."
            className="form-input"
          />
        </div>

        <button
          onClick={handleUpdate}
          disabled={updatingAnnouncement}
          data-tooltip="Save changes"
          title="Save Changes"
          className="join-btn mt-6 w-full justify-center"
        >
          {updatingAnnouncement ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
