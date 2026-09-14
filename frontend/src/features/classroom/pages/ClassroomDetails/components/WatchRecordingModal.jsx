import { X } from "lucide-react";
import { getRecordingUrl } from "../../../api/recording.api";

export default function WatchRecordingModal({ recording, onClose }) {
  if (!recording) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-card max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{recording.title}</h2>
            {recording.description && (
              <p className="text-xs text-gray-500 mt-0.5">
                {recording.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            data-tooltip="Close Player"
            title="Close"
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <video
          key={recording._id}
          src={getRecordingUrl(recording.fileUrl)}
          controls
          autoPlay
          className="w-full rounded-xl bg-black max-h-[70vh]"
        />
      </div>
    </div>
  );
}
