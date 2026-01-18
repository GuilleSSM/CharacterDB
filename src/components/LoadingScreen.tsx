import { motion } from "framer-motion";
import { BookOpenIcon } from "./icons";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-parchment-100 dark:bg-ink-950 flex flex-col items-center justify-center">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-burgundy/5 rounded-full blur-3xl" />
      </div>

      {/* Logo and loading animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Animated logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-gold to-accent-burgundy
                     flex items-center justify-center shadow-paper-lifted mb-8"
        >
          <BookOpenIcon className="w-10 h-10 text-parchment-50" />
        </motion.div>

        {/* Title */}
        <h1 className="font-display font-semibold text-3xl text-ink-900 dark:text-parchment-100 mb-2">
          CharacterDB
        </h1>
        <p className="text-ink-500 dark:text-parchment-300 mb-8">Loading your characters...</p>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-accent-gold"
            />
          ))}
        </div>
      </motion.div>

      {/* Decorative flourish */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-12 text-center"
      >
        <div className="font-display italic text-ink-400 dark:text-parchment-400 text-sm">
          "Every character has a story waiting to be told"
        </div>
      </motion.div>
    </div>
  );
}