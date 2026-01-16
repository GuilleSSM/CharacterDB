import { motion } from "framer-motion";
import { useStore } from "../stores/useStore";
import { formatShortcut } from "../lib/platform";
import { UsersIcon, PlusIcon, SparklesIcon } from "./icons";

export function EmptyState() {
  const { createCharacter, selectCharacter, filter } = useStore();

  const handleCreateCharacter = async () => {
    const id = await createCharacter({ name: "New Character" });
    await selectCharacter(id);
  };

  // Check if we have active filters
  const hasFilters = filter.search || filter.projectId || filter.tagIds.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent-burgundy/5 rounded-full blur-3xl" />
      </div>

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-parchment-200 to-parchment-300 dark:from-ink-800 dark:to-ink-700
                       flex items-center justify-center">
          <UsersIcon className="w-12 h-12 text-ink-400 dark:text-ink-500" />
        </div>

        {/* Sparkle decoration */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="absolute -top-2 -right-2"
        >
          <SparklesIcon className="w-6 h-6 text-accent-gold" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 mb-8"
      >
        {hasFilters ? (
          <>
            <h2 className="font-display font-semibold text-2xl text-ink-900 dark:text-parchment-50">
              No characters found
            </h2>
            <p className="text-ink-600 dark:text-parchment-200 max-w-md">
              No characters match your current filters.
              Try adjusting your search or clearing filters.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display font-semibold text-2xl text-ink-900 dark:text-parchment-50">
              Your story awaits
            </h2>
            <p className="text-ink-600 dark:text-parchment-200 max-w-md">
              Create your first character to begin building your cast.
              Every great story starts with compelling characters.
            </p>
          </>
        )}
      </motion.div>

      {/* Action button */}
      {!hasFilters && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateCharacter}
          className="btn-primary text-base px-6 py-3"
        >
          <PlusIcon className="w-5 h-5" />
          Create Your First Character
        </motion.button>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl"
      >
        {[
          {
            title: "Quick Add",
            description: `Press ${formatShortcut("N")} to quickly create a new character`,
          },
          {
            title: "Organize",
            description: "Use projects and tags to keep your cast organized",
          },
          {
            title: "Search",
            description: `Press ${formatShortcut("K")} to instantly find any character`,
          },
        ].map((tip, index) => (
          <motion.div
            key={tip.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="text-left p-4 rounded-xl bg-parchment-50/50 dark:bg-ink-900/50 border border-ink-100 dark:border-ink-800"
          >
            <h3 className="font-display font-semibold text-ink-900 dark:text-parchment-100 mb-1">
              {tip.title}
            </h3>
            <p className="text-sm text-ink-500 dark:text-ink-400">{tip.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
