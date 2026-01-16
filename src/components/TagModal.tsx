import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../stores/useStore";
import { XMarkIcon, TrashIcon } from "./icons";

const COLORS = [
  "#c9a227", // Gold
  "#722f37", // Burgundy
  "#2d4a3e", // Forest
  "#1e3a5f", // Navy
  "#8b4513", // Saddle brown
  "#e57373", // Coral
  "#6b5b95", // Violet
  "#88b04b", // Greenery
  "#f7cac9", // Rose quartz
  "#92a8d1", // Serenity
];

export function TagModal() {
  const {
    isTagModalOpen,
    setTagModalOpen,
    editingTag,
    createTag,
    updateTag,
    deleteTag,
  } = useStore();

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (editingTag) {
      setName(editingTag.name);
      setColor(editingTag.color || COLORS[0]);
    } else {
      setName("");
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
  }, [editingTag]);

  const handleClose = () => {
    setTagModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTag) {
      await updateTag(editingTag.id, { name, color });
    } else {
      await createTag({ name, color });
    }

    handleClose();
  };

  const handleDelete = async () => {
    if (!editingTag) return;
    if (
      confirm(
        `Delete tag "${editingTag.name}"? It will be removed from all characters.`
      )
    ) {
      await deleteTag(editingTag.id);
      handleClose();
    }
  };

  if (!isTagModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-parchment-50 dark:bg-ink-900 rounded-2xl shadow-paper-lifted overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-ink-100 dark:border-ink-800">
              <h2 className="font-display font-semibold text-xl text-ink-900 dark:text-parchment-50">
                {editingTag ? "Edit Tag" : "New Tag"}
              </h2>
              <button type="button" onClick={handleClose} className="btn-icon">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <label className="label">Tag Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hero, Villain, Love Interest"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        color === c
                          ? "ring-2 ring-offset-2 ring-offset-parchment-50 dark:ring-offset-ink-900 ring-ink-400 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="label">Preview</label>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {name || "Tag Name"}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-ink-100 dark:border-ink-800 bg-parchment-100/50 dark:bg-ink-950/30">
              {editingTag ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-ghost text-accent-burgundy hover:bg-accent-burgundy/10"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button type="button" onClick={handleClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTag ? "Save" : "Create Tag"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
