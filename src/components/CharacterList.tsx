import { motion } from "framer-motion";
import { useStore } from "../stores/useStore";
import type { Character } from "../types";
import { HeartIcon, UserIcon, ChevronRightIcon } from "./icons";

export function CharacterList() {
  const { characters, sort, selectCharacter, toggleFavorite } = useStore();

  // Sort characters
  const sortedCharacters = [...characters].sort((a, b) => {
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

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "protagonist":
        return "bg-accent-gold/60 text-black border-accent-gold/30";
      case "antagonist":
        return "bg-accent-burgundy/20 text-accent-burgundy border-accent-burgundy/30";
      case "supporting":
        return "bg-accent-forest/20 text-accent-forest border-accent-forest/30";
      case "minor":
        return "bg-ink-200 text-ink-600 border-ink-300 dark:bg-ink-700 dark:text-parchment-300 dark:border-ink-600";
      default:
        return "bg-ink-100 text-ink-500 border-ink-200 dark:bg-ink-800 dark:text-parchment-400 dark:border-ink-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="card overflow-hidden">
      {/* Table header */}
      <div
        className="grid grid-cols-[auto_1fr_120px_120px_120px_100px_48px] gap-4 px-6 py-3
                     bg-parchment-100 dark:bg-ink-900 border-b border-ink-100 dark:border-ink-800 text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
      >
        <div className="w-10" />
        <div>Name</div>
        <div>Role</div>
        <div>Age</div>
        <div>Occupation</div>
        <div>Modified</div>
        <div />
      </div>

      {/* Table body */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="divide-y divide-ink-100 dark:divide-ink-800"
      >
        {sortedCharacters.map((character) => (
          <CharacterListItem
            key={character.id}
            character={character}
            variants={itemVariants}
            getRoleColor={getRoleColor}
            formatDate={formatDate}
            onSelect={() => selectCharacter(character.id)}
            onToggleFavorite={() => toggleFavorite(character.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}

interface CharacterListItemProps {
  character: Character;
  variants: {
    hidden: { opacity: number; x: number };
    show: { opacity: number; x: number };
  };
  getRoleColor: (role?: string) => string;
  formatDate: (date: string) => string;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

function CharacterListItem({
  character,
  variants,
  getRoleColor,
  formatDate,
  onSelect,
  onToggleFavorite,
}: CharacterListItemProps) {
  return (
    <motion.div
      variants={variants}
      onClick={onSelect}
      className="grid grid-cols-[auto_1fr_120px_120px_120px_100px_48px] gap-4 px-6 py-4
                 items-center cursor-pointer hover:bg-parchment-100 dark:hover:bg-ink-800 transition-colors group"
    >
      {/* Avatar */}
      <div className="relative">
        {character.portrait_path ? (
          <img
            src={character.portrait_path}
            alt=""
            className="w-10 h-10 rounded-full object-cover ring-2 ring-parchment-200"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-parchment-200 to-parchment-300 dark:from-ink-800 dark:to-ink-700
                         flex items-center justify-center ring-2 ring-parchment-200 dark:ring-ink-800"
          >
            <UserIcon className="w-5 h-5 text-ink-400 dark:text-ink-500" />
          </div>
        )}

        {/* Favorite indicator */}
        {character.is_favorite && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 bg-accent-burgundy rounded-full
                         flex items-center justify-center"
          >
            <HeartIcon className="w-2.5 h-2.5 text-parchment-50" filled />
          </div>
        )}
      </div>

      {/* Name & aliases */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-ink-900 dark:text-parchment-100 truncate">
            {character.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1 rounded transition-all ${
              character.is_favorite
                ? "text-accent-burgundy"
                : "text-ink-300 opacity-0 group-hover:opacity-100 hover:text-ink-500"
            }`}
          >
            <HeartIcon className="w-4 h-4" filled={character.is_favorite} />
          </button>
        </div>
        {character.aliases && (
          <p className="text-xs text-ink-500 truncate">"{character.aliases}"</p>
        )}
      </div>

      {/* Role */}
      <div>
        {character.role ? (
          <span className={`tag border ${getRoleColor(character.role)}`}>
            {character.role}
          </span>
        ) : (
          <span className="text-ink-300 text-sm">—</span>
        )}
      </div>

      {/* Age */}
      <div className="text-sm text-ink-700 dark:text-parchment-300">
        {character.age || <span className="text-ink-300">—</span>}
      </div>

      {/* Occupation */}
      <div className="text-sm text-ink-700 dark:text-parchment-300 truncate">
        {character.occupation || <span className="text-ink-300">—</span>}
      </div>

      {/* Modified date */}
      <div className="text-xs text-ink-500">
        {formatDate(character.updated_at)}
      </div>

      {/* Arrow */}
      <div className="flex justify-end">
        <ChevronRightIcon
          className="w-5 h-5 text-ink-300 group-hover:text-ink-500
                                     group-hover:translate-x-1 transition-all"
        />
      </div>
    </motion.div>
  );
}
