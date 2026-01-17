import { motion } from "framer-motion";
import { useStore } from "../stores/useStore";
import { CharacterCard } from "./CharacterCard";

export function CharacterGrid() {
  const { characters, sort } = useStore();

  // Sort characters (favorites first, then by selected field)
  const sortedCharacters = [...characters].sort((a, b) => {
    // Favorites always come first
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;

    const direction = sort.direction === "asc" ? 1 : -1;

    switch (sort.field) {
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "role":
        return direction * (a.role || "").localeCompare(b.role || "");
      case "created_at":
        return (
          direction *
          (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        );
      case "updated_at":
      default:
        return (
          direction *
          (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
        );
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
    >
      {sortedCharacters.map((character) => (
        <motion.div key={character.id} variants={itemVariants}>
          <CharacterCard character={character} />
        </motion.div>
      ))}
    </motion.div>
  );
}
