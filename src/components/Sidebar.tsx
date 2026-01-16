import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../stores/useStore";
import {
  BookOpenIcon,
  TagIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  UsersIcon,
} from "./icons";

export function Sidebar() {
  const {
    projects,
    tags,
    filter,
    setFilter,
    isSidebarCollapsed,
    toggleSidebar,
    setProjectModalOpen,
    setTagModalOpen,
    characters,
  } = useStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-full bg-parchment-50 dark:bg-ink-950 border-r border-ink-100 dark:border-ink-800
                 flex flex-col z-20 shadow-paper"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-ink-100 dark:border-ink-800">
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-gold to-accent-burgundy
                            flex items-center justify-center shadow-sm"
              >
                <BookOpenIcon className="w-4 h-4 text-parchment-50" />
              </div>
              <span className="font-display font-semibold text-lg text-ink-900 dark:text-parchment-100">
                CharacterDB
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleSidebar}
          className="btn-icon"
          aria-label={
            isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
        >
          {isSidebarCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin">
        {/* All Characters */}
        <div className="px-3 mb-6">
          <button
            onClick={() => setFilter({ projectId: null, tagIds: [] })}
            className={`w-full ${
              filter.projectId === null && filter.tagIds.length === 0
                ? "sidebar-item-active"
                : "sidebar-item"
            }`}
          >
            <UsersIcon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  All Characters
                </motion.span>
              )}
            </AnimatePresence>
            {!isSidebarCollapsed && (
              <span className="badge ml-auto">{characters.length}</span>
            )}
          </button>
        </div>

        {/* Projects Section */}
        <div className="px-3 mb-6">
          <div className="flex items-center justify-between mb-2 px-3">
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-ink-500 uppercase tracking-wider"
                >
                  Projects
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="btn-icon p-1"
              aria-label="Add project"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setFilter({ projectId: project.id })}
                className={`w-full ${
                  filter.projectId === project.id
                    ? "sidebar-item-active"
                    : "sidebar-item"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color || "#c9a227" }}
                />
                <AnimatePresence mode="wait">
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate flex-1 text-left"
                    >
                      {project.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}

            {projects.length === 0 && !isSidebarCollapsed && (
              <p className="px-3 py-2 text-xs text-ink-400 italic">
                No projects yet
              </p>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="px-3 mb-6">
          <div className="flex items-center justify-between mb-2 px-3">
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-ink-500 uppercase tracking-wider"
                >
                  Tags
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={() => setTagModalOpen(true)}
              className="btn-icon p-1"
              aria-label="Add tag"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  const isSelected = filter.tagIds.includes(tag.id);
                  setFilter({
                    tagIds: isSelected
                      ? filter.tagIds.filter((id) => id !== tag.id)
                      : [...filter.tagIds, tag.id],
                  });
                }}
                className={`w-full ${
                  filter.tagIds.includes(tag.id)
                    ? "sidebar-item-active"
                    : "sidebar-item"
                }`}
              >
                <TagIcon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: tag.color }}
                />
                <AnimatePresence mode="wait">
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate flex-1 text-left"
                    >
                      {tag.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}

            {tags.length === 0 && !isSidebarCollapsed && (
              <p className="px-3 py-2 text-xs text-ink-400 italic">
                No tags yet
              </p>
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-ink-100 p-3">
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-ink-500"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>For storytellers</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <SparklesIcon className="w-4 h-4 text-ink-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
