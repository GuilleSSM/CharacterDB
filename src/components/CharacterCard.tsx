import { useState } from "react";
import { motion } from "framer-motion";
import { confirm, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useStore } from "../stores/useStore";
import type { Character } from "../types";
import {
  HeartIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  UserIcon,
} from "./icons";

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const {
    selectCharacter,
    toggleFavorite,
    archiveCharacter,
    deleteCharacter,
    createCharacter,
    exportCharacter,
  } = useStore();

  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    selectCharacter(character.id);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(character.id);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const { id, created_at, updated_at, ...rest } = character;
    await createCharacter({ ...rest, name: `${character.name} (Copy)` });
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      const data = await exportCharacter(character.id);
      if (data) {
        const sanitizedName = character.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
        const filePath = await save({
          filters: [{ name: "JSON", extensions: ["json"] }],
          defaultPath: `${sanitizedName}.json`,
        });
        if (filePath) {
          await writeTextFile(filePath, data);
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    archiveCharacter(character.id, !character.is_archived);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const confirmed = await confirm(
      `Delete "${character.name}"? This cannot be undone.`,
      { title: "Delete Character", kind: "warning" },
    );
    if (confirmed) {
      deleteCharacter(character.id);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "protagonist":
        return "bg-accent-gold/60 text-black";
      case "antagonist":
        return "bg-accent-burgundy/20 text-accent-burgundy";
      case "supporting":
        return "bg-accent-forest/20 text-accent-forest";
      case "minor":
        return "bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-parchment-300";
      default:
        return "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-parchment-400";
    }
  };

  return (
    <motion.article
      onClick={handleClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="card-hover group relative overflow-hidden"
    >
      {/* Portrait area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-parchment-200 to-parchment-300">
        {character.portrait_path ? (
          <img
            src={character.portrait_path}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-parchment-100/50 dark:bg-ink-800/50 flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-ink-300 dark:text-ink-600" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />

        {/* Top actions */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* Role badge */}
          {character.role && (
            <span
              className={`tag ${getRoleColor(character.role)} backdrop-blur-sm`}
            >
              {character.role}
            </span>
          )}

          <div className="flex items-center gap-1 ml-auto">
            {/* Favorite button */}
            <motion.button
              onClick={handleFavorite}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1.5 rounded-full backdrop-blur-sm transition-colors ${
                character.is_favorite
                  ? "bg-accent-burgundy/90 text-parchment-50"
                  : "bg-ink-900/40 text-parchment-100 opacity-0 group-hover:opacity-100"
              }`}
            >
              <HeartIcon className="w-4 h-4" filled={character.is_favorite} />
            </motion.button>

            {/* Menu button */}
            <div className="relative">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-full bg-ink-900/40 text-parchment-100 backdrop-blur-sm
                          opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <EllipsisVerticalIcon className="w-4 h-4" />
              </motion.button>

              {/* Dropdown menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-full mt-1 w-40 bg-parchment-50 dark:bg-ink-900 rounded-xl
                              shadow-paper-lifted border border-ink-100 dark:border-ink-800 overflow-hidden z-20"
                  >
                    <div className="p-1">
                      <button
                        onClick={handleDuplicate}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 dark:text-parchment-200
                                  rounded-lg hover:bg-parchment-100 dark:hover:bg-ink-800 transition-colors"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={handleExport}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 dark:text-parchment-200
                                  rounded-lg hover:bg-parchment-100 dark:hover:bg-ink-800 transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export
                      </button>
                      <button
                        onClick={handleArchive}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 dark:text-parchment-200
                                  rounded-lg hover:bg-parchment-100 dark:hover:bg-ink-800 transition-colors"
                      >
                        <ArchiveBoxIcon className="w-4 h-4" />
                        {character.is_archived ? "Unarchive" : "Archive"}
                      </button>
                      <div className="my-1 h-px bg-ink-100 dark:bg-ink-700" />
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-burgundy
                                  rounded-lg hover:bg-accent-burgundy/10 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display font-semibold text-xl text-parchment-50 leading-tight">
            {character.name}
          </h3>
          {character.aliases && (
            <p className="text-sm text-parchment-200/80 mt-0.5 truncate">
              "{character.aliases}"
            </p>
          )}
          {character.occupation && (
            <p className="text-xs text-parchment-300/70 mt-1 truncate">
              {character.occupation}
            </p>
          )}
        </div>
      </div>

      {/* Quick info section */}
      <div className="p-4 space-y-2">
        {/* Physical traits */}
        {(character.age || character.gender || character.species) && (
          <div className="flex flex-wrap gap-2 text-xs text-ink-600 dark:text-ink-400">
            {character.age && <span>{character.age}</span>}
            {character.age && (character.gender || character.species) && (
              <span className="text-ink-300 dark:text-ink-600">·</span>
            )}
            {character.gender && <span>{character.gender}</span>}
            {character.gender && character.species && (
              <span className="text-ink-300 dark:text-ink-600">·</span>
            )}
            {character.species && <span>{character.species}</span>}
          </div>
        )}

        {/* Personality snippet */}
        {character.personality_traits &&
          character.personality_traits.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {character.personality_traits.slice(0, 3).map((trait, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:text-parchment-200
                          bg-parchment-200 dark:bg-ink-800 rounded-full"
                >
                  {trait}
                </span>
              ))}
              {character.personality_traits.length > 3 && (
                <span className="px-2 py-0.5 text-[10px] text-ink-400">
                  +{character.personality_traits.length - 3}
                </span>
              )}
            </div>
          )}
      </div>

      {/* Decorative corner flourish */}
      <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
        <div
          className="absolute bottom-0 right-0 w-32 h-32 transform translate-x-1/2 translate-y-1/2
                      rounded-full border border-ink-100 opacity-30"
        />
      </div>
    </motion.article>
  );
}
