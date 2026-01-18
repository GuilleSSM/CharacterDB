// Power types
export type PowerCategory = "offensive" | "defensive" | "utility" | "passive" | "transformation";

export const POWER_CATEGORIES: { value: PowerCategory; label: string; color: string }[] = [
  { value: "offensive", label: "Offensive", color: "#722f37" },      // burgundy
  { value: "defensive", label: "Defensive", color: "#1e3a5f" },      // navy
  { value: "utility", label: "Utility", color: "#c9a227" },          // gold
  { value: "passive", label: "Passive", color: "#2d4a3e" },          // forest
  { value: "transformation", label: "Transformation", color: "#7b7169" },
];

export interface Power {
  id: string;           // UUID
  name: string;
  description?: string;
  category: PowerCategory;
  powerLevel: number;   // 1-10 scale
}

// D&D Combat Block types
export interface DnDAbilityScores {
  strength: number;      // 1-30, default 10
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface DnDStats {
  abilityScores: DnDAbilityScores;
  armorClass?: number;          // AC
  hitPoints?: number;           // Current HP
  maxHitPoints?: number;        // Max HP
  speed?: string;               // "30 ft"
  proficiencyBonus?: number;    // +2 to +6
}

export interface Character {
  id: number;
  name: string;
  aliases?: string;
  role?: string;
  age?: string;
  gender?: string;
  pronouns?: string;
  species?: string;
  occupation?: string;

  // Physical
  height?: string;
  build?: string;
  hair?: string;
  eyes?: string;
  distinguishing_features?: string;
  appearance_notes?: string;

  // Personality
  personality_traits?: string[];
  strengths?: string;
  weaknesses?: string;
  fears?: string;
  desires?: string;
  quirks?: string;

  // Powers & Abilities
  powers?: Power[];

  // D&D Stats (optional)
  dnd_enabled?: boolean;
  dnd_stats?: DnDStats;

  // Background
  origin?: string;
  family?: string;
  education?: string;
  backstory?: string;

  // Story
  character_arc?: string;
  first_appearance?: string;
  last_appearance?: string;
  story_notes?: string;

  // Media
  portrait_path?: string;
  reference_images?: string[];

  // Metadata
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  is_archived?: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Relationship {
  id: number;
  character_a_id: number;
  character_b_id: number;
  relationship_type: string;
  notes?: string;
}

export interface CharacterWithRelations extends Character {
  projects?: Project[];
  tags?: Tag[];
  relationships?: (Relationship & { related_character: Character })[];
}

export type ViewMode = "grid" | "list";

export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "minor"
  | "mentioned";

export const CHARACTER_ROLES: { value: CharacterRole; label: string }[] = [
  { value: "protagonist", label: "Protagonist" },
  { value: "antagonist", label: "Antagonist" },
  { value: "supporting", label: "Supporting" },
  { value: "minor", label: "Minor" },
  { value: "mentioned", label: "Mentioned" },
];

export const RELATIONSHIP_TYPES = [
  "family",
  "friend",
  "enemy",
  "rival",
  "mentor",
  "student",
  "romantic",
  "colleague",
  "acquaintance",
  "other",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface FilterState {
  search: string;
  projectId: number | null;
  tagIds: number[];
  roles: CharacterRole[];
  showArchived: boolean;
}

export interface SortState {
  field: "name" | "created_at" | "updated_at" | "role";
  direction: "asc" | "desc";
}

export interface ImportResult {
  characters: { imported: number; duplicates: number; errors: number };
  projects: { imported: number; duplicates: number; errors: number };
  tags: { imported: number; duplicates: number; errors: number };
}
