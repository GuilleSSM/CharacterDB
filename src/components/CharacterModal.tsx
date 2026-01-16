import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../stores/useStore";
import type { CharacterWithRelations } from "../types";
import { CHARACTER_ROLES } from "../types";
import {
  XMarkIcon,
  HeartIcon,
  TrashIcon,
  ArchiveBoxIcon,
  UserIcon,
  PhotoIcon,
  PlusIcon,
  TagIcon,
} from "./icons";

type TabId = "basic" | "appearance" | "personality" | "background" | "story" | "relationships";

const TABS: { id: TabId; label: string }[] = [
  { id: "basic", label: "Basic" },
  { id: "appearance", label: "Appearance" },
  { id: "personality", label: "Personality" },
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
  const [isDirty, setIsDirty] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // Initialize local data when character changes
  useEffect(() => {
    if (selectedCharacter) {
      setLocalData(selectedCharacter);
      setIsDirty(false);
    }
  }, [selectedCharacter]);

  // Auto-save with debounce
  useEffect(() => {
    if (!isDirty || !selectedCharacter) return;

    const timeout = setTimeout(() => {
      updateCharacter(selectedCharacter.id, localData);
      setIsDirty(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [localData, isDirty, selectedCharacter, updateCharacter]);

  const handleChange = useCallback(
    (field: keyof CharacterWithRelations, value: unknown) => {
      setLocalData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleClose = () => {
    setCharacterModalOpen(false);
  };

  const handleDelete = () => {
    if (!selectedCharacter) return;
    if (confirm(`Delete "${selectedCharacter.name}"? This cannot be undone.`)) {
      deleteCharacter(selectedCharacter.id);
    }
  };

  const handleArchive = () => {
    if (!selectedCharacter) return;
    archiveCharacter(selectedCharacter.id, true);
  };

  const handleToggleFavorite = () => {
    if (!selectedCharacter) return;
    toggleFavorite(selectedCharacter.id);
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
              <button className="absolute inset-0 flex items-center justify-center bg-ink-900/60
                                 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    <TagIcon className="w-3 h-3" />
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
              <button onClick={handleArchive} className="btn-icon">
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
              {isDirty ? "Saving..." : "All changes saved"}
            </span>
          </footer>
        </motion.div>
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
                        bg-parchment-200 text-ink-700 rounded-full"
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
  const relationships = character.relationships || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg text-ink-900">
          Relationships
        </h3>
        <button className="btn-secondary text-sm">
          <PlusIcon className="w-4 h-4" />
          Add Relationship
        </button>
      </div>

      {relationships.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-parchment-100 dark:bg-ink-800 border border-ink-100 dark:border-ink-700"
            >
              <div className="w-10 h-10 rounded-full bg-parchment-200 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-ink-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink-900">
                  {rel.related_character?.name}
                </p>
                <p className="text-sm text-ink-600 capitalize">
                  {rel.relationship_type}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
