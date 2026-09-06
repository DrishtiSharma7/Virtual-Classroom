import React, { useState, useEffect, useRef } from "react";
import {
  NotebookPen,
  Plus,
  Star,
  MoreVertical,
  Edit3,
  Trash2,
  Check,
  X,
  Clock,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../../api/note.api";
import "./QuickNotes.css";

const QuickNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isImportantNew, setIsImportantNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortNotes = (items) => {
    return [...items].sort((a, b) => {
      if (a.isImportant !== b.isImportant) {
        return a.isImportant ? -1 : 1;
      }
      return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
    });
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await getNotes();
      setNotes(sortNotes(data));
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    try {
      setSubmitting(true);
      const newNote = await createNote({
        text: trimmed,
        isImportant: isImportantNew,
      });

      setNotes((prev) => sortNotes([newNote, ...prev]));
      setInputText("");
      setIsImportantNew(false);
      toast.success("Note saved!");
    } catch (err) {
      console.error("Error creating note:", err);
      toast.error(err.response?.data?.message || "Failed to save note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleImportant = async (note) => {
    try {
      setActiveDropdownId(null);
      const nextImportant = !note.isImportant;

      setNotes((prev) =>
        sortNotes(
          prev.map((n) =>
            n._id === note._id ? { ...n, isImportant: nextImportant } : n
          )
        )
      );

      await updateNote(note._id, { isImportant: nextImportant });
      toast.success(
        nextImportant ? "Marked as Important ⭐" : "Unmarked as Important"
      );
    } catch (err) {
      console.error("Error toggling important:", err);
      toast.error("Failed to update note priority");
      loadNotes();
    }
  };

  const handleToggleCompleted = async (note) => {
    try {
      const nextCompleted = !note.isCompleted;

      setNotes((prev) =>
        prev.map((n) =>
          n._id === note._id ? { ...n, isCompleted: nextCompleted } : n
        )
      );

      await updateNote(note._id, { isCompleted: nextCompleted });
    } catch (err) {
      console.error("Error toggling completed:", err);
      loadNotes();
    }
  };

  const handleStartEdit = (note) => {
    setEditingId(note._id);
    setEditText(note.text);
    setActiveDropdownId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (id) => {
    const trimmed = editText.trim();
    if (!trimmed) {
      toast.error("Note cannot be empty");
      return;
    }

    try {
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, text: trimmed } : n))
      );
      setEditingId(null);

      await updateNote(id, { text: trimmed });
      toast.success("Note updated");
    } catch (err) {
      console.error("Error updating note:", err);
      toast.error("Failed to update note");
      loadNotes();
    }
  };

  const handleDelete = async (id) => {
    try {
      setActiveDropdownId(null);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      await deleteNote(id);
      toast.success("Note removed");
    } catch (err) {
      console.error("Error deleting note:", err);
      toast.error("Failed to delete note");
      loadNotes();
    }
  };

  const formatNoteDate = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const importantCount = notes.filter((n) => n.isImportant).length;

  return (
    <div className="quick-notes-container">
      <div className="quick-notes-header">
        <div className="quick-notes-title-group">
          <NotebookPen size={18} className="quick-notes-icon" />
          <h3 className="quick-notes-title">Quick Notes</h3>
          <span className="quick-notes-count-badge">
            {notes.length}
          </span>
        </div>

        {importantCount > 0 && (
          <span className="quick-notes-important-badge">
            <Star size={11} fill="currentColor" />
            {importantCount} pinned
          </span>
        )}
      </div>

      <div className="quick-notes-list">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 size={20} className="animate-spin text-indigo-600 mr-2" />
            <span className="text-xs">Loading notes...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="quick-notes-empty">
            <NotebookPen size={30} className="quick-notes-empty-icon" />
            <p className="quick-notes-empty-text">No notes yet</p>
            <p className="quick-notes-empty-subtext">
              Write self-reminders, key topics, or to-dos to keep handy!
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const isEditing = editingId === note._id;
            const isDropdownOpen = activeDropdownId === note._id;

            return (
              <div
                key={note._id}
                className={`quick-notes-item ${note.isImportant ? "important" : ""} ${
                  note.isCompleted ? "completed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={note.isCompleted}
                  onChange={() => handleToggleCompleted(note)}
                  className="quick-notes-checkbox"
                  title={note.isCompleted ? "Mark incomplete" : "Mark completed"}
                />

                {isEditing ? (
                  <div className="quick-notes-edit-form">
                    <input
                      type="text"
                      className="quick-notes-edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(note._id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(note._id)}
                      className="quick-notes-edit-btn quick-notes-edit-save"
                      title="Save (Enter)"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="quick-notes-edit-btn quick-notes-edit-cancel"
                      title="Cancel (Esc)"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="quick-notes-body">
                    <p className="quick-notes-text">{note.text}</p>
                    <div className="quick-notes-meta">
                      {note.isImportant && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                          <Star size={10} fill="currentColor" />
                          Important
                        </span>
                      )}
                      <span className="quick-notes-time">
                        <Clock size={10} className="inline mr-0.5" />
                        {formatNoteDate(note.createdAt)}
                      </span>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="relative" ref={isDropdownOpen ? dropdownRef : null}>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdownId(isDropdownOpen ? null : note._id)
                      }
                      className="quick-notes-menu-btn"
                      title="Options"
                      aria-label="Note options"
                    >
                      <MoreVertical size={15} />
                    </button>

                    {isDropdownOpen && (
                      <div className="quick-notes-dropdown">
                        <button
                          type="button"
                          onClick={() => handleToggleImportant(note)}
                          className="quick-notes-dropdown-item"
                        >
                          <Star
                            size={14}
                            className={note.isImportant ? "text-amber-500" : "text-gray-400"}
                            fill={note.isImportant ? "currentColor" : "none"}
                          />
                          {note.isImportant ? "Unmark Important" : "Mark as Important"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(note)}
                          className="quick-notes-dropdown-item"
                        >
                          <Edit3 size={14} className="text-gray-400" />
                          Edit Note
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(note._id)}
                          className="quick-notes-dropdown-item danger"
                        >
                          <Trash2 size={14} />
                          Delete Note
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddNote} className="quick-notes-form">
        <input
          type="text"
          className="quick-notes-input"
          placeholder="Add a quick reminder or note..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={500}
        />

        <button
          type="button"
          onClick={() => setIsImportantNew((prev) => !prev)}
          className={`quick-notes-star-toggle ${isImportantNew ? "active" : ""}`}
          title={isImportantNew ? "Important (priority pinned)" : "Mark as Important"}
          aria-label="Toggle priority importance"
        >
          <Star
            size={16}
            fill={isImportantNew ? "currentColor" : "none"}
          />
        </button>

        <button
          type="submit"
          disabled={!inputText.trim() || submitting}
          className="quick-notes-submit-btn"
          title="Add note"
          aria-label="Add note"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
        </button>
      </form>
    </div>
  );
};

export default QuickNotes;
