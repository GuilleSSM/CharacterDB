import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useStore } from "../stores/useStore";
import { pickImageForCrop, saveCroppedImage } from "../lib/images";
import { CropModal } from "./CropModal";
import type { CharacterWithRelations, Power, PowerCategory, DnDStats, DnDAbilityScores } from "../types";
import { CHARACTER_ROLES, RELATIONSHIP_TYPES, POWER_CATEGORIES } from "../types";
import {
  XMarkIcon,
  HeartIcon,
  TrashIcon,
  ArchiveBoxIcon,
  UserIcon,
  PhotoIcon,
  PlusIcon,
  TagIcon,
  SwordIcon,
  ShieldIcon,
  WrenchIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  D20Icon,
} from "./icons";

type TabId = "basic" | "appearance" | "personality" | "powers" | "background" | "story" | "relationships";

const TABS: { id: TabId; label: string }[] = [
  { id: "basic", label: "Basic" },
  { id: "appearance", label: "Appearance" },
  { id: "personality", label: "Personality" },
  { id: "powers", label: "Powers" },
  { id: "background", label: "Background" },
  { id: "story", label: "Story" },
  { id: "relationships", label: "Relationships" },
];

export function CharacterModal() {
  const {
    selectedCharacter,
    setCharacterModalOpen,
    updateCharacter,
    deleteCharacter,
    archiveCharacter,
    toggleFavorite,
    projects,
    tags,
    assignCharacterToProject,
    removeCharacterFromProject,
    assignTagToCharacter,
    removeTagFromCharacter,
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [localData, setLocalData] = useState<Partial<CharacterWithRelations>>({});
  const [pendingChanges, setPendingChanges] = useState<Partial<CharacterWithRelations>>({});
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const lastCharacterIdRef = useRef<number | null>(null);

  // Initialize local data only when opening a DIFFERENT character
  // This prevents resetting local edits when the store refreshes after a save
  useEffect(() => {
    if (selectedCharacter) {
      if (selectedCharacter.id !== lastCharacterIdRef.current) {
        // New character - full reset
        setLocalData(selectedCharacter);
        setPendingChanges({});
        lastCharacterIdRef.current = selectedCharacter.id;
      }
      // If same character, keep our local edits - they're either pending save or already saved
    }
  }, [selectedCharacter]);

  // Auto-save with debounce - only save the fields that actually changed
  useEffect(() => {
    if (Object.keys(pendingChanges).length === 0 || !selectedCharacter) return;

    const timeout = setTimeout(async () => {
      try {
        await updateCharacter(selectedCharacter.id, pendingChanges);
        setPendingChanges({});
      } catch (error) {
        console.error("Failed to save character:", error);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [pendingChanges, selectedCharacter, updateCharacter]);

  const handleChange = useCallback(
    (field: keyof CharacterWithRelations, value: unknown) => {
      setLocalData((prev) => ({ ...prev, [field]: value }));
      setPendingChanges((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClose = () => {
    lastCharacterIdRef.current = null; // Reset so reopening shows fresh data
    setCharacterModalOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedCharacter) return;
    const confirmed = await confirm(
      `Delete "${selectedCharacter.name}"? This cannot be undone.`,
      { title: "Delete Character", kind: "warning" }
    );
    if (confirmed) {
      deleteCharacter(selectedCharacter.id);
    }
  };

  const handleArchive = () => {
    if (!selectedCharacter) return;
    archiveCharacter(selectedCharacter.id, !localData.is_archived);
  };

  const handleToggleFavorite = () => {
    if (!selectedCharacter) return;
    toggleFavorite(selectedCharacter.id);
  };

  const handlePortraitUpload = async () => {
    try {
      const imageDataUrl = await pickImageForCrop();
      if (imageDataUrl) {
        setCropImageSrc(imageDataUrl);
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      const imagePath = await saveCroppedImage(croppedBlob);
      handleChange("portrait_path", imagePath);
      setCropImageSrc(null);
    } catch (error) {
      console.error("Failed to save cropped image:", error);
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
  };

  if (!selectedCharacter) return null;

  const character = { ...selectedCharacter, ...localData };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex"
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
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative ml-auto w-full max-w-3xl h-full bg-parchment-50 dark:bg-ink-950 shadow-paper-lifted
                     flex flex-col overflow-hidden"
        >
          {/* Header */}
          <header className="flex items-start gap-4 p-6 border-b border-ink-100 dark:border-ink-800">
            {/* Portrait */}
            <div className="relative group">
              {character.portrait_path ? (
                <img
                  src={character.portrait_path}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-parchment-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-parchment-200 to-parchment-300 dark:from-ink-800 dark:to-ink-700
                               flex items-center justify-center ring-2 ring-parchment-200 dark:ring-ink-800">
                  <UserIcon className="w-10 h-10 text-ink-400" />
                </div>
              )}
              <button
                onClick={handlePortraitUpload}
                className="absolute inset-0 flex items-center justify-center bg-ink-900/60
                           rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PhotoIcon className="w-6 h-6 text-parchment-50" />
              </button>
            </div>

            {/* Title & meta */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={character.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Character Name"
                className="w-full font-display font-semibold text-2xl text-ink-900 dark:text-parchment-50
                          bg-transparent border-none focus:outline-none focus:ring-0 p-0"
              />
              <input
                type="text"
                value={character.aliases || ""}
                onChange={(e) => handleChange("aliases", e.target.value)}
                placeholder="Aliases or nickname..."
                className="w-full text-sm text-ink-600 dark:text-parchment-300 mt-1
                          bg-transparent border-none focus:outline-none focus:ring-0 p-0"
              />

              {/* Projects & Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {/* Projects */}
                {character.projects?.map((project) => (
                  <span
                    key={project.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
                              rounded-full bg-parchment-200 dark:bg-ink-800 text-ink-700 dark:text-parchment-200"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project.color || "#c9a227" }}
                    />
                    {project.name}
                    <button
                      onClick={() =>
                        removeCharacterFromProject(selectedCharacter.id, project.id)
                      }
                      className="ml-0.5 hover:text-accent-burgundy"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Tags */}
                {character.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border
                              text-ink-800 dark:text-parchment-100"
                    style={{
                      backgroundColor: `${tag.color}35`,
                      borderColor: `${tag.color}60`,
                    }}
                  >
                    <TagIcon className="w-3 h-3" style={{ color: tag.color }} />
                    {tag.name}
                    <button
                      onClick={() =>
                        removeTagFromCharacter(selectedCharacter.id, tag.id)
                      }
                      className="ml-0.5 hover:opacity-70"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Add buttons */}
                <div className="relative">
                  <button
                    onClick={() => setShowProjectPicker(!showProjectPicker)}
                    className="p-1.5 rounded-full border border-dashed border-ink-300
                              text-ink-400 hover:text-ink-600 hover:border-ink-400 transition-colors"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>

                  {showProjectPicker && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-parchment-50 dark:bg-ink-900 rounded-xl
                                   shadow-paper-hover border border-ink-100 dark:border-ink-800 z-10 p-1">
                      <p className="px-3 py-2 text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">
                        Add to Project
                      </p>
                      {projects
                        .filter(
                          (p) => !character.projects?.some((cp) => cp.id === p.id)
                        )
                        .map((project) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              assignCharacterToProject(
                                selectedCharacter.id,
                                project.id
                              );
                              setShowProjectPicker(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 dark:text-parchment-200
                                      rounded-lg hover:bg-parchment-100 dark:hover:bg-ink-800 transition-colors"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: project.color || "#c9a227" }}
                            />
                            {project.name}
                          </button>
                        ))}
                      {projects.filter(
                        (p) => !character.projects?.some((cp) => cp.id === p.id)
                      ).length === 0 && (
                        <p className="px-3 py-2 text-sm text-ink-400 italic">
                          No more projects
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className="p-1.5 rounded-full border border-dashed border-ink-300
                              text-ink-400 hover:text-ink-600 hover:border-ink-400 transition-colors"
                  >
                    <TagIcon className="w-3 h-3" />
                  </button>

                  {showTagPicker && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-parchment-50 dark:bg-ink-900 rounded-xl
                                   shadow-paper-hover border border-ink-100 dark:border-ink-800 z-10 p-1">
                      <p className="px-3 py-2 text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">
                        Add Tag
                      </p>
                      {tags
                        .filter((t) => !character.tags?.some((ct) => ct.id === t.id))
                        .map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => {
                              assignTagToCharacter(selectedCharacter.id, tag.id);
                              setShowTagPicker(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 dark:text-parchment-200
                                      rounded-lg hover:bg-parchment-100 dark:hover:bg-ink-800 transition-colors"
                          >
                            <TagIcon
                              className="w-3 h-3"
                              style={{ color: tag.color }}
                            />
                            {tag.name}
                          </button>
                        ))}
                      {tags.filter(
                        (t) => !character.tags?.some((ct) => ct.id === t.id)
                      ).length === 0 && (
                        <p className="px-3 py-2 text-sm text-ink-400 italic">
                          No more tags
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleFavorite}
                className={`btn-icon ${
                  character.is_favorite ? "text-accent-burgundy" : ""
                }`}
              >
                <HeartIcon className="w-5 h-5" filled={character.is_favorite} />
              </button>
              <button
                onClick={handleArchive}
                className="btn-icon"
                title={localData.is_archived ? "Unarchive" : "Archive"}
              >
                <ArchiveBoxIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="btn-icon text-accent-burgundy hover:bg-accent-burgundy/10"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <button onClick={handleClose} className="btn-icon">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Tabs */}
          <nav className="flex border-b border-ink-100 dark:border-ink-800 px-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-ink-900 dark:text-parchment-50"
                    : "text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-parchment-300"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold"
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "basic" && (
                  <BasicTab character={character} onChange={handleChange} />
                )}
                {activeTab === "appearance" && (
                  <AppearanceTab character={character} onChange={handleChange} />
                )}
                {activeTab === "personality" && (
                  <PersonalityTab character={character} onChange={handleChange} />
                )}
                {activeTab === "powers" && (
                  <PowersTab character={character} onChange={handleChange} />
                )}
                {activeTab === "background" && (
                  <BackgroundTab character={character} onChange={handleChange} />
                )}
                {activeTab === "story" && (
                  <StoryTab character={character} onChange={handleChange} />
                )}
                {activeTab === "relationships" && (
                  <RelationshipsTab character={character} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between px-6 py-3 border-t border-ink-100 dark:border-ink-800
                           bg-parchment-100/50 dark:bg-ink-900/50 text-xs text-ink-500 dark:text-ink-400">
            <span>
              Created {new Date(character.created_at).toLocaleDateString()}
            </span>
            <span>
              {Object.keys(pendingChanges).length > 0 ? "Saving..." : "All changes saved"}
            </span>
          </footer>
        </motion.div>

        {/* Crop Modal */}
        {cropImageSrc && (
          <CropModal
            imageSrc={cropImageSrc}
            onCrop={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Tab Components

interface TabProps {
  character: CharacterWithRelations;
  onChange: (field: keyof CharacterWithRelations, value: unknown) => void;
}

function BasicTab({ character, onChange }: TabProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="col-span-2 sm:col-span-1">
        <label className="label">Role</label>
        <select
          value={character.role || ""}
          onChange={(e) => onChange("role", e.target.value || null)}
          className="input"
        >
          <option value="">Select role...</option>
          {CHARACTER_ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="label">Age</label>
        <input
          type="text"
          value={character.age || ""}
          onChange={(e) => onChange("age", e.target.value)}
          placeholder="e.g., 28, Early 30s, Unknown"
          className="input"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="label">Gender</label>
        <input
          type="text"
          value={character.gender || ""}
          onChange={(e) => onChange("gender", e.target.value)}
          placeholder="e.g., Male, Female, Non-binary"
          className="input"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="label">Pronouns</label>
        <input
          type="text"
          value={character.pronouns || ""}
          onChange={(e) => onChange("pronouns", e.target.value)}
          placeholder="e.g., he/him, she/her, they/them"
          className="input"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="label">Species / Race</label>
        <input
          type="text"
          value={character.species || ""}
          onChange={(e) => onChange("species", e.target.value)}
          placeholder="e.g., Human, Elf, Android"
          className="input"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="label">Occupation</label>
        <input
          type="text"
          value={character.occupation || ""}
          onChange={(e) => onChange("occupation", e.target.value)}
          placeholder="e.g., Detective, Scholar, Mercenary"
          className="input"
        />
      </div>
    </div>
  );
}

function AppearanceTab({ character, onChange }: TabProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="col-span-2 sm:col-span-1">
        <label className="label">Height</label>
        <input
          type="text"
          value={character.height || ""}
          onChange={(e) => onChange("height", e.target.value)}
          placeholder="e.g., 5'10, 178cm, Tall"
          className="input"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="label">Build</label>
        <input
          type="text"
          value={character.build || ""}
          onChange={(e) => onChange("build", e.target.value)}
          placeholder="e.g., Athletic, Slender, Muscular"
          className="input"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="label">Hair</label>
        <input
          type="text"
          value={character.hair || ""}
          onChange={(e) => onChange("hair", e.target.value)}
          placeholder="e.g., Long black hair, Short blonde curls"
          className="input"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="label">Eyes</label>
        <input
          type="text"
          value={character.eyes || ""}
          onChange={(e) => onChange("eyes", e.target.value)}
          placeholder="e.g., Deep blue, Heterochromatic"
          className="input"
        />
      </div>

      <div className="col-span-2">
        <label className="label">Distinguishing Features</label>
        <input
          type="text"
          value={character.distinguishing_features || ""}
          onChange={(e) => onChange("distinguishing_features", e.target.value)}
          placeholder="Scars, tattoos, birthmarks, etc."
          className="input"
        />
      </div>

      <div className="col-span-2">
        <label className="label">Appearance Notes</label>
        <textarea
          value={character.appearance_notes || ""}
          onChange={(e) => onChange("appearance_notes", e.target.value)}
          placeholder="Additional notes about their appearance, style, mannerisms..."
          className="textarea"
          rows={4}
        />
      </div>
    </div>
  );
}

function PersonalityTab({ character, onChange }: TabProps) {
  const [newTrait, setNewTrait] = useState("");

  const addTrait = () => {
    if (!newTrait.trim()) return;
    const traits = [...(character.personality_traits || []), newTrait.trim()];
    onChange("personality_traits", traits);
    setNewTrait("");
  };

  const removeTrait = (index: number) => {
    const traits = [...(character.personality_traits || [])];
    traits.splice(index, 1);
    onChange("personality_traits", traits);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="label">Personality Traits</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {character.personality_traits?.map((trait, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm
                        bg-parchment-200 dark:bg-ink-800 text-ink-700 dark:text-parchment-200 rounded-full"
            >
              {trait}
              <button
                onClick={() => removeTrait(index)}
                className="ml-1 hover:text-accent-burgundy"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTrait}
            onChange={(e) => setNewTrait(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTrait()}
            placeholder="Add a trait..."
            className="input flex-1"
          />
          <button onClick={addTrait} className="btn-secondary">
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Strengths</label>
          <textarea
            value={character.strengths || ""}
            onChange={(e) => onChange("strengths", e.target.value)}
            placeholder="What are they good at?"
            className="textarea"
            rows={3}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Weaknesses</label>
          <textarea
            value={character.weaknesses || ""}
            onChange={(e) => onChange("weaknesses", e.target.value)}
            placeholder="What are their flaws?"
            className="textarea"
            rows={3}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Fears</label>
          <textarea
            value={character.fears || ""}
            onChange={(e) => onChange("fears", e.target.value)}
            placeholder="What do they fear?"
            className="textarea"
            rows={3}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Desires & Goals</label>
          <textarea
            value={character.desires || ""}
            onChange={(e) => onChange("desires", e.target.value)}
            placeholder="What do they want?"
            className="textarea"
            rows={3}
          />
        </div>

        <div className="col-span-2">
          <label className="label">Quirks & Habits</label>
          <textarea
            value={character.quirks || ""}
            onChange={(e) => onChange("quirks", e.target.value)}
            placeholder="Unique behaviors, habits, or quirks..."
            className="textarea"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

// Helper to get category icon
function getCategoryIcon(category: PowerCategory) {
  const iconClass = "w-5 h-5";
  switch (category) {
    case "offensive":
      return <SwordIcon className={iconClass} />;
    case "defensive":
      return <ShieldIcon className={iconClass} />;
    case "utility":
      return <WrenchIcon className={iconClass} />;
    case "passive":
      return <SparklesIcon className={iconClass} />;
    case "transformation":
      return <ArrowsRightLeftIcon className={iconClass} />;
  }
}

// Helper to get category color based on theme
function getCategoryColor(category: PowerCategory, isDark: boolean): string {
  const cat = POWER_CATEGORIES.find((c) => c.value === category);
  if (!cat) return isDark ? "#e8c55a" : "#c9a227";
  return isDark ? cat.darkColor : cat.color;
}

// Helper to generate a UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Power level labels
function getPowerLevelLabel(level: number): string {
  if (level <= 2) return "Minor";
  if (level <= 4) return "Notable";
  if (level <= 6) return "Moderate";
  if (level <= 8) return "Powerful";
  return "Legendary";
}

interface PowerCardProps {
  power: Power;
  isExpanded: boolean;
  isDark: boolean;
  onToggle: () => void;
  onUpdate: (power: Power) => void;
  onDelete: () => void;
}

function PowerCard({ power, isExpanded, isDark, onToggle, onUpdate, onDelete }: PowerCardProps) {
  const categoryColor = getCategoryColor(power.category, isDark);
  const categoryLabel = POWER_CATEGORIES.find((c) => c.value === power.category)?.label || "Utility";

  return (
    <motion.div
      layout
      className="rounded-xl bg-parchment-100 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 overflow-hidden"
    >
      {/* Collapsed header - always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-parchment-200/50 dark:hover:bg-ink-700/50 transition-colors"
      >
        {/* Category icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
        >
          {getCategoryIcon(power.category)}
        </div>

        {/* Name and category */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink-900 dark:text-parchment-100 truncate">
            {power.name || "Unnamed Power"}
          </p>
          <p className="text-sm text-ink-500 dark:text-ink-400" style={{ color: categoryColor }}>
            {categoryLabel}
          </p>
        </div>

        {/* Power level indicator */}
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-4 rounded-sm ${
                i < power.powerLevel
                  ? "bg-accent-gold"
                  : "bg-ink-200 dark:bg-ink-600"
              }`}
            />
          ))}
        </div>

        {/* Expand/collapse icon */}
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-ink-400 shrink-0" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-ink-400 shrink-0" />
        )}
      </button>

      {/* Expanded form */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-ink-100 dark:border-ink-700 pt-4">
              {/* Name input */}
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={power.name}
                  onChange={(e) => onUpdate({ ...power, name: e.target.value })}
                  placeholder="Power name..."
                  className="input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  value={power.description || ""}
                  onChange={(e) => onUpdate({ ...power, description: e.target.value })}
                  placeholder="Describe how this power works, its limitations, or effects..."
                  className="textarea"
                  rows={3}
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="label">Category</label>
                <div className="flex flex-wrap gap-2">
                  {POWER_CATEGORIES.map((cat) => {
                    const catColor = isDark ? cat.darkColor : cat.color;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => onUpdate({ ...power, category: cat.value })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all border
                                  text-ink-800 dark:text-parchment-100 ${
                          power.category === cat.value
                            ? "ring-2 ring-offset-2 ring-offset-parchment-50 dark:ring-offset-ink-900"
                            : "opacity-70 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: `${catColor}40`,
                          borderColor: `${catColor}70`,
                          ...(power.category === cat.value ? { ringColor: catColor } : {}),
                        }}
                      >
                        <span style={{ color: catColor }}>{getCategoryIcon(cat.value)}</span>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Power level slider */}
              <div>
                <label className="label">
                  Power Level: {power.powerLevel}/10
                  <span className="ml-2 text-ink-400 dark:text-ink-500 font-normal">
                    ({getPowerLevelLabel(power.powerLevel)})
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={power.powerLevel}
                  onChange={(e) => onUpdate({ ...power, powerLevel: parseInt(e.target.value) })}
                  className="w-full h-2 bg-ink-200 dark:bg-ink-600 rounded-lg appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:bg-accent-gold [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-accent-gold
                            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                />
                <div className="flex justify-between text-xs text-ink-400 dark:text-ink-500 mt-1">
                  <span>Minor</span>
                  <span>Moderate</span>
                  <span>Legendary</span>
                </div>
              </div>

              {/* Delete button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-accent-burgundy hover:bg-accent-burgundy/10 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Power
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// D&D helper functions
const DEFAULT_ABILITY_SCORES: DnDAbilityScores = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const DEFAULT_DND_STATS: DnDStats = {
  abilityScores: DEFAULT_ABILITY_SCORES,
  armorClass: 10,
  hitPoints: 10,
  maxHitPoints: 10,
  speed: "30 ft",
  proficiencyBonus: 2,
  level: 1,
  characterClass: "",
  subclass: "",
};

function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const ABILITY_LABELS: { key: keyof DnDAbilityScores; label: string; short: string }[] = [
  { key: "strength", label: "Strength", short: "STR" },
  { key: "dexterity", label: "Dexterity", short: "DEX" },
  { key: "constitution", label: "Constitution", short: "CON" },
  { key: "intelligence", label: "Intelligence", short: "INT" },
  { key: "wisdom", label: "Wisdom", short: "WIS" },
  { key: "charisma", label: "Charisma", short: "CHA" },
];

interface DnDCombatBlockProps {
  stats: DnDStats;
  onUpdate: (stats: DnDStats) => void;
}

function DnDCombatBlock({ stats, onUpdate }: DnDCombatBlockProps) {
  const handleAbilityChange = (ability: keyof DnDAbilityScores, value: number) => {
    const clampedValue = Math.max(1, Math.min(30, value));
    onUpdate({
      ...stats,
      abilityScores: {
        ...stats.abilityScores,
        [ability]: clampedValue,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-4 rounded-xl bg-parchment-100 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 space-y-4">
        {/* Level, Class, Subclass Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Level */}
          <div className="flex flex-col p-3 rounded-lg bg-parchment-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-700">
            <label className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-1">
              Level
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={stats.level ?? 1}
              onChange={(e) => onUpdate({ ...stats, level: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
              className="w-full text-center text-xl font-bold text-ink-900 dark:text-parchment-100 bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>

          {/* Class */}
          <div className="flex flex-col p-3 rounded-lg bg-parchment-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-700">
            <label className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-1">
              Class
            </label>
            <input
              type="text"
              value={stats.characterClass ?? ""}
              onChange={(e) => onUpdate({ ...stats, characterClass: e.target.value })}
              placeholder="Fighter, Wizard..."
              className="w-full text-sm font-medium text-ink-900 dark:text-parchment-100 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-ink-400 dark:placeholder:text-ink-500"
            />
          </div>

          {/* Subclass */}
          <div className="flex flex-col p-3 rounded-lg bg-parchment-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-700">
            <label className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-1">
              Subclass
            </label>
            <input
              type="text"
              value={stats.subclass ?? ""}
              onChange={(e) => onUpdate({ ...stats, subclass: e.target.value })}
              placeholder="Champion, Evocation..."
              className="w-full text-sm font-medium text-ink-900 dark:text-parchment-100 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-ink-400 dark:placeholder:text-ink-500"
            />
          </div>
        </div>

        {/* Combat Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* AC */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-parchment-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-700">
            <label className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
              AC
            </label>
            <input
              type="number"
              value={stats.armorClass ?? 10}
              onChange={(e) => onUpdate({ ...stats, armorClass: parseInt(e.target.value) || 10 })}
              className="w-16 text-center text-2xl font-bold text-ink-900 dark:text-parchment-100 bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>

          {/* HP */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-parchment-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-700">
            <label className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
              HP
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={stats.hitPoints ?? 10}
                onChange={(e) => onUpdate({ ...stats, hitPoints: parseInt(e.target.value) || 0 })}
                className="w-12 text-center text-xl font-bold text-ink-900 dark:text-parchment-100 bg-transparent border-none focus:outline-none focus:ring-0"
              />
              <span className="text-ink-400">/</span>
              <input
                type="number"
                value={stats.maxHitPoints ?? 10}
                onChange={(e) => onUpdate({ ...stats, maxHitPoints: parseInt(e.target.value) || 1 })}
                className="w-12 text-center text-xl font-bold text-ink-900 dark:text-parchment-100 bg-transparent border-none focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Speed */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-parchment-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-700">
            <label className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
              Speed
            </label>
            <input
              type="text"
              value={stats.speed ?? "30 ft"}
              onChange={(e) => onUpdate({ ...stats, speed: e.target.value })}
              className="w-20 text-center text-lg font-bold text-ink-900 dark:text-parchment-100 bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>

          {/* Proficiency Bonus */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-parchment-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-700">
            <label className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
              Prof
            </label>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-accent-gold">+</span>
              <input
                type="number"
                min={2}
                max={6}
                value={stats.proficiencyBonus ?? 2}
                onChange={(e) => onUpdate({ ...stats, proficiencyBonus: Math.max(2, Math.min(6, parseInt(e.target.value) || 2)) })}
                className="w-10 text-center text-2xl font-bold text-accent-gold bg-transparent border-none focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Ability Scores Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ABILITY_LABELS.map(({ key, short }) => {
            const score = stats.abilityScores[key];
            const modifier = calculateModifier(score);
            return (
              <div
                key={key}
                className="flex flex-col items-center p-2 rounded-lg bg-parchment-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-700"
              >
                <label className="text-xs font-bold text-ink-600 dark:text-ink-300 tracking-wider">
                  {short}
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(e) => handleAbilityChange(key, parseInt(e.target.value) || 10)}
                  className="w-12 text-center text-lg font-bold text-ink-900 dark:text-parchment-100 bg-transparent border-none focus:outline-none focus:ring-0"
                />
                <span
                  className={`text-sm font-bold ${
                    modifier >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatModifier(modifier)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function PowersTab({ character, onChange }: TabProps) {
  const { theme } = useStore();
  const isDark = theme === "dark";
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedPowerId, setExpandedPowerId] = useState<string | null>(null);
  const [newPowerName, setNewPowerName] = useState("");

  const powers = character.powers || [];
  const dndEnabled = character.dnd_enabled ?? false;
  const dndStats = character.dnd_stats ?? DEFAULT_DND_STATS;

  const addPower = () => {
    if (!newPowerName.trim()) return;

    const newPower: Power = {
      id: generateUUID(),
      name: newPowerName.trim(),
      category: "utility",
      powerLevel: 5,
    };

    onChange("powers", [...powers, newPower]);
    setNewPowerName("");
    setShowAddForm(false);
    setExpandedPowerId(newPower.id); // Auto-expand the new power
  };

  const updatePower = (updatedPower: Power) => {
    const updatedPowers = powers.map((p) =>
      p.id === updatedPower.id ? updatedPower : p
    );
    onChange("powers", updatedPowers);
  };

  const deletePower = (powerId: string) => {
    const updatedPowers = powers.filter((p) => p.id !== powerId);
    onChange("powers", updatedPowers);
    if (expandedPowerId === powerId) {
      setExpandedPowerId(null);
    }
  };

  const handleDnDToggle = () => {
    const newEnabled = !dndEnabled;
    onChange("dnd_enabled", newEnabled);
    // Initialize stats if enabling for the first time and no stats exist
    if (newEnabled && !character.dnd_stats) {
      onChange("dnd_stats", DEFAULT_DND_STATS);
    }
  };

  const handleDnDStatsUpdate = (stats: DnDStats) => {
    onChange("dnd_stats", stats);
  };

  return (
    <div className="space-y-4">
      {/* D&D Mode Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-parchment-100 dark:bg-ink-800 border border-ink-100 dark:border-ink-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            dndEnabled
              ? "bg-accent-burgundy/20 text-accent-burgundy"
              : "bg-ink-200 dark:bg-ink-700 text-ink-400"
          }`}>
            <D20Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-ink-900 dark:text-parchment-100">
              D&D Mode
            </p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Track ability scores, AC, HP, and combat stats
            </p>
          </div>
        </div>
        <button
          onClick={handleDnDToggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            dndEnabled
              ? "bg-accent-burgundy"
              : "bg-ink-300 dark:bg-ink-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              dndEnabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* D&D Combat Block */}
      <AnimatePresence>
        {dndEnabled && (
          <DnDCombatBlock stats={dndStats} onUpdate={handleDnDStatsUpdate} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg text-ink-900 dark:text-parchment-100">
            Powers & Abilities
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Special abilities, magical powers, or extraordinary capabilities
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-secondary text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          {showAddForm ? "Cancel" : "Add Power"}
        </button>
      </div>

      {/* Add power form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-parchment-100 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 space-y-4">
              <div>
                <label className="label">Power Name</label>
                <input
                  type="text"
                  value={newPowerName}
                  onChange={(e) => setNewPowerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPower()}
                  placeholder="Enter the power name..."
                  className="input"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addPower}
                  disabled={!newPowerName.trim()}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Power
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Powers list */}
      {powers.length > 0 ? (
        <div className="space-y-3">
          {powers.map((power) => (
            <PowerCard
              key={power.id}
              power={power}
              isExpanded={expandedPowerId === power.id}
              isDark={isDark}
              onToggle={() =>
                setExpandedPowerId(expandedPowerId === power.id ? null : power.id)
              }
              onUpdate={updatePower}
              onDelete={() => deletePower(power.id)}
            />
          ))}
        </div>
      ) : !showAddForm ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-parchment-200 dark:bg-ink-800 flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-ink-400 dark:text-ink-500" />
          </div>
          <p className="text-ink-600 dark:text-ink-400 mb-2">No powers yet</p>
          <p className="text-sm text-ink-400 dark:text-ink-500">
            Add special abilities, magic, skills, or supernatural powers
          </p>
        </div>
      ) : null}
    </div>
  );
}

function BackgroundTab({ character, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Origin / Birthplace</label>
          <input
            type="text"
            value={character.origin || ""}
            onChange={(e) => onChange("origin", e.target.value)}
            placeholder="Where are they from?"
            className="input"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Education</label>
          <input
            type="text"
            value={character.education || ""}
            onChange={(e) => onChange("education", e.target.value)}
            placeholder="Formal education, training, etc."
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Family</label>
        <textarea
          value={character.family || ""}
          onChange={(e) => onChange("family", e.target.value)}
          placeholder="Family members, family history..."
          className="textarea"
          rows={3}
        />
      </div>

      <div>
        <label className="label">Backstory</label>
        <textarea
          value={character.backstory || ""}
          onChange={(e) => onChange("backstory", e.target.value)}
          placeholder="Their history, significant life events, formative experiences..."
          className="textarea"
          rows={8}
        />
      </div>
    </div>
  );
}

function StoryTab({ character, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">First Appearance</label>
          <input
            type="text"
            value={character.first_appearance || ""}
            onChange={(e) => onChange("first_appearance", e.target.value)}
            placeholder="Chapter, scene, episode..."
            className="input"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Last Appearance</label>
          <input
            type="text"
            value={character.last_appearance || ""}
            onChange={(e) => onChange("last_appearance", e.target.value)}
            placeholder="Chapter, scene, episode..."
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Character Arc</label>
        <textarea
          value={character.character_arc || ""}
          onChange={(e) => onChange("character_arc", e.target.value)}
          placeholder="How does this character change throughout the story?"
          className="textarea"
          rows={4}
        />
      </div>

      <div>
        <label className="label">Story Notes</label>
        <textarea
          value={character.story_notes || ""}
          onChange={(e) => onChange("story_notes", e.target.value)}
          placeholder="Additional notes about their role in the story..."
          className="textarea"
          rows={6}
        />
      </div>
    </div>
  );
}

function RelationshipsTab({ character }: { character: CharacterWithRelations }) {
  const { characters, createRelationship, deleteRelationship } = useStore();
  const relationships = character.relationships || [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | "">("");
  const [selectedType, setSelectedType] = useState<string>(RELATIONSHIP_TYPES[0]);
  const [notes, setNotes] = useState("");

  // Filter out current character and characters already in relationships
  const existingRelationIds = new Set(relationships.map((r) => r.related_character?.id));
  const availableCharacters = characters.filter(
    (c) => c.id !== character.id && !existingRelationIds.has(c.id) && !c.is_archived
  );

  const handleAddRelationship = async () => {
    if (selectedCharacterId === "" || !selectedType) return;

    await createRelationship(character.id, selectedCharacterId, selectedType, notes || undefined);
    setShowAddForm(false);
    setSelectedCharacterId("");
    setSelectedType(RELATIONSHIP_TYPES[0]);
    setNotes("");
  };

  const handleDeleteRelationship = async (relationshipId: number) => {
    const confirmed = await confirm("Remove this relationship?", {
      title: "Remove Relationship",
      kind: "warning",
    });
    if (confirmed) {
      await deleteRelationship(relationshipId, character.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg text-ink-900 dark:text-parchment-100">
          Relationships
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-secondary text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          {showAddForm ? "Cancel" : "Add Relationship"}
        </button>
      </div>

      {/* Add relationship form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-parchment-100 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Character</label>
                  <select
                    value={selectedCharacterId}
                    onChange={(e) =>
                      setSelectedCharacterId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="input"
                  >
                    <option value="">Select a character...</option>
                    {availableCharacters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Relationship Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="input"
                  >
                    {RELATIONSHIP_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this relationship..."
                  className="input"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAddRelationship}
                  disabled={selectedCharacterId === ""}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Relationship
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {relationships.length === 0 && !showAddForm ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-parchment-200 dark:bg-ink-800
                         flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-ink-400 dark:text-ink-500" />
          </div>
          <p className="text-ink-600 dark:text-ink-400 mb-2">No relationships yet</p>
          <p className="text-sm text-ink-400 dark:text-ink-500">
            Connect this character to others in your story
          </p>
        </div>
      ) : relationships.length > 0 ? (
        <div className="space-y-3">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-parchment-100 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 group"
            >
              <div className="w-10 h-10 rounded-full bg-parchment-200 dark:bg-ink-700 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-ink-400 dark:text-ink-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink-900 dark:text-parchment-100">
                  {rel.related_character?.name}
                </p>
                <p className="text-sm text-ink-600 dark:text-ink-400 capitalize">
                  {rel.relationship_type}
                  {rel.notes && <span className="text-ink-400 dark:text-ink-500"> · {rel.notes}</span>}
                </p>
              </div>
              <button
                onClick={() => handleDeleteRelationship(rel.id)}
                className="p-2 text-ink-400 hover:text-accent-burgundy rounded-lg
                          opacity-0 group-hover:opacity-100 transition-all"
                title="Remove relationship"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
