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
  "#4a4a4a", // Charcoal
  "#6b5b95", // Violet
  "#88b04b", // Greenery
];

export function ProjectModal() {
  const {
    isProjectModalOpen,
    setProjectModalOpen,
    editingProject,
    createProject,
    updateProject,
    deleteProject,
  } = useStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description || "");
      setColor(editingProject.color || COLORS[0]);
    } else {
      setName("");
      setDescription("");
      setColor(COLORS[0]);
    }
  }, [editingProject]);

  const handleClose = () => {
    setProjectModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProject) {
      await updateProject(editingProject.id, { name, description, color });
    } else {
      await createProject({ name, description, color });
    }

    handleClose();
  };

  const handleDelete = async () => {
    if (!editingProject) return;
    if (
      confirm(
        `Delete "${editingProject.name}"? Characters will not be deleted, but will be removed from this project.`
      )
    ) {
      await deleteProject(editingProject.id);
      handleClose();
    }
  };

  if (!isProjectModalOpen) return null;

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
          className="relative w-full max-w-md bg-parchment-50 rounded-2xl shadow-paper-lifted overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-ink-100">
              <h2 className="font-display font-semibold text-xl text-ink-900">
                {editingProject ? "Edit Project" : "New Project"}
              </h2>
              <button type="button" onClick={handleClose} className="btn-icon">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <label className="label">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Novel"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of this project..."
                  className="textarea"
                  rows={3}
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
                          ? "ring-2 ring-offset-2 ring-offset-parchment-50 ring-ink-400 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-ink-100 bg-parchment-100/50">
              {editingProject ? (
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
                  {editingProject ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
