import { useState, useEffect, useRef } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";

export default function UploadRecordingModal({
  isOpen,
  onClose,
  classroomId,
  onSubmit,
}) {
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [recordingFile, setRecordingFile] = useState(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recordingUploadError, setRecordingUploadError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRecordingTitle("");
      setRecordingDescription("");
      setRecordingFile(null);
      setRecordingUploadError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recordingTitle.trim()) {
      setRecordingUploadError("Please provide a title for this recording.");
      return;
    }
    if (!recordingFile) {
      setRecordingUploadError("Please choose a video file to upload.");
      return;
    }

    try {
      setUploadingRecording(true);
      setRecordingUploadError("");

      const formData = new FormData();
      formData.append("classroom", classroomId);
      formData.append("title", recordingTitle.trim());
      formData.append("description", recordingDescription.trim());
      formData.append("file", recordingFile);

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setRecordingUploadError(
        err.response?.data?.message || "Failed to upload recording."
      );
    } finally {
      setUploadingRecording(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">Upload Recording</h2>
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

        {recordingUploadError && (
          <p className="form-error">{recordingUploadError}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Title</label>
            <input
              value={recordingTitle}
              onChange={(e) => setRecordingTitle(e.target.value)}
              placeholder="e.g. Week 4 — Introduction to React"
              className="form-input"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Description (optional)</label>
            <input
              value={recordingDescription}
              onChange={(e) => setRecordingDescription(e.target.value)}
              placeholder="Topics discussed in this lecture..."
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Video File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) =>
                setRecordingFile(e.target.files?.[0] || null)
              }
              className="form-input"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Supports MP4, WebM, MOV, AVI (up to 500MB)
            </p>
          </div>

          <button
            type="submit"
            disabled={uploadingRecording}
            data-tooltip="Upload recorded"
            title="Upload Recording"
            className="join-btn mt-6 w-full justify-center"
          >
            {uploadingRecording ? (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading Video...</span>
              </div>
            ) : (
              <>
                <UploadCloud size={18} />
                <span>Upload Recording</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
