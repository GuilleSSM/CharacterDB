import { create } from "zustand";
import type {
  Character,
  Project,
  Tag,
  CharacterWithRelations,
  ViewMode,
  FilterState,
  SortState,
} from "../types";
import * as db from "../lib/database";

interface AppState {
  // Data
  characters: Character[];
  projects: Project[];
  tags: Tag[];
  selectedCharacter: CharacterWithRelations | null;
  recentCharacterIds: number[];

  // UI State
  viewMode: ViewMode;
  filter: FilterState;
  sort: SortState;
  isLoading: boolean;
  isSidebarCollapsed: boolean;
  isCharacterModalOpen: boolean;
  isProjectModalOpen: boolean;
  isTagModalOpen: boolean;
  editingProject: Project | null;
  editingTag: Tag | null;

  // Actions
  loadInitialData: () => Promise<void>;
  refreshCharacters: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshTags: () => Promise<void>;

  selectCharacter: (id: number | null) => Promise<void>;
  createCharacter: (character: Partial<Character>) => Promise<number>;
  updateCharacter: (id: number, character: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  archiveCharacter: (id: number, archived: boolean) => Promise<void>;

  createProject: (project: Partial<Project>) => Promise<number>;
  updateProject: (id: number, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  createTag: (tag: Partial<Tag>) => Promise<number>;
  updateTag: (id: number, tag: Partial<Tag>) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;

  assignCharacterToProject: (
    characterId: number,
    projectId: number
  ) => Promise<void>;
  removeCharacterFromProject: (
    characterId: number,
    projectId: number
  ) => Promise<void>;
  assignTagToCharacter: (characterId: number, tagId: number) => Promise<void>;
  removeTagFromCharacter: (characterId: number, tagId: number) => Promise<void>;

  setViewMode: (mode: ViewMode) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  setSort: (sort: Partial<SortState>) => void;
  toggleSidebar: () => void;
  setCharacterModalOpen: (open: boolean) => void;
  setProjectModalOpen: (open: boolean, project?: Project | null) => void;
  setTagModalOpen: (open: boolean, tag?: Tag | null) => void;

  searchCharacters: (query: string) => Promise<Character[]>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  characters: [],
  projects: [],
  tags: [],
  selectedCharacter: null,
  recentCharacterIds: [],

  viewMode: "grid",
  filter: {
    search: "",
    projectId: null,
    tagIds: [],
    roles: [],
    showArchived: false,
  },
  sort: {
    field: "updated_at",
    direction: "desc",
  },
  isLoading: true,
  isSidebarCollapsed: false,
  isCharacterModalOpen: false,
  isProjectModalOpen: false,
  isTagModalOpen: false,
  editingProject: null,
  editingTag: null,

  // Data loading
  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const [characters, projects, tags] = await Promise.all([
        db.getAllCharacters(),
        db.getAllProjects(),
        db.getAllTags(),
      ]);
      set({ characters, projects, tags, isLoading: false });
    } catch (error) {
      console.error("Failed to load initial data:", error);
      set({ isLoading: false });
    }
  },

  refreshCharacters: async () => {
    const { filter } = get();
    let characters: Character[];

    if (filter.search) {
      characters = await db.searchCharacters(filter.search);
    } else if (filter.projectId) {
      characters = await db.getCharactersByProject(filter.projectId);
    } else {
      characters = await db.getAllCharacters();
    }

    set({ characters });
  },

  refreshProjects: async () => {
    const projects = await db.getAllProjects();
    set({ projects });
  },

  refreshTags: async () => {
    const tags = await db.getAllTags();
    set({ tags });
  },

  // Character operations
  selectCharacter: async (id) => {
    if (id === null) {
      set({ selectedCharacter: null, isCharacterModalOpen: false });
      return;
    }

    const character = await db.getCharacterById(id);
    if (character) {
      const { recentCharacterIds } = get();
      const newRecent = [id, ...recentCharacterIds.filter((i) => i !== id)].slice(
        0,
        5
      );
      set({
        selectedCharacter: character,
        recentCharacterIds: newRecent,
        isCharacterModalOpen: true,
      });
    }
  },

  createCharacter: async (character) => {
    const id = await db.createCharacter(character);
    await get().refreshCharacters();
    return id;
  },

  updateCharacter: async (id, character) => {
    await db.updateCharacter(id, character);
    await get().refreshCharacters();

    // Refresh selected character if it's the one being updated
    const { selectedCharacter } = get();
    if (selectedCharacter?.id === id) {
      await get().selectCharacter(id);
    }
  },

  deleteCharacter: async (id) => {
    await db.deleteCharacter(id);
    const { selectedCharacter } = get();
    if (selectedCharacter?.id === id) {
      set({ selectedCharacter: null, isCharacterModalOpen: false });
    }
    await get().refreshCharacters();
  },

  toggleFavorite: async (id) => {
    const character = get().characters.find((c) => c.id === id);
    if (character) {
      await db.updateCharacter(id, { is_favorite: !character.is_favorite });
      await get().refreshCharacters();
    }
  },

  archiveCharacter: async (id, archived) => {
    await db.archiveCharacter(id, archived);
    const { selectedCharacter } = get();
    if (selectedCharacter?.id === id) {
      set({ selectedCharacter: null, isCharacterModalOpen: false });
    }
    await get().refreshCharacters();
  },

  // Project operations
  createProject: async (project) => {
    const id = await db.createProject(project);
    await get().refreshProjects();
    return id;
  },

  updateProject: async (id, project) => {
    await db.updateProject(id, project);
    await get().refreshProjects();
  },

  deleteProject: async (id) => {
    await db.deleteProject(id);
    const { filter } = get();
    if (filter.projectId === id) {
      set({ filter: { ...filter, projectId: null } });
    }
    await get().refreshProjects();
    await get().refreshCharacters();
  },

  // Tag operations
  createTag: async (tag) => {
    const id = await db.createTag(tag);
    await get().refreshTags();
    return id;
  },

  updateTag: async (id, tag) => {
    await db.updateTag(id, tag);
    await get().refreshTags();
  },

  deleteTag: async (id) => {
    await db.deleteTag(id);
    const { filter } = get();
    if (filter.tagIds.includes(id)) {
      set({ filter: { ...filter, tagIds: filter.tagIds.filter((t) => t !== id) } });
    }
    await get().refreshTags();
  },

  // Relationships
  assignCharacterToProject: async (characterId, projectId) => {
    await db.assignCharacterToProject(characterId, projectId);
    const { selectedCharacter } = get();
    if (selectedCharacter?.id === characterId) {
      await get().selectCharacter(characterId);
    }
  },

  removeCharacterFromProject: async (characterId, projectId) => {
    await db.removeCharacterFromProject(characterId, projectId);
    const { selectedCharacter } = get();
    if (selectedCharacter?.id === characterId) {
      await get().selectCharacter(characterId);
    }
    await get().refreshCharacters();
  },

  assignTagToCharacter: async (characterId, tagId) => {
    await db.assignTagToCharacter(characterId, tagId);
    const { selectedCharacter } = get();
    if (selectedCharacter?.id === characterId) {
      await get().selectCharacter(characterId);
    }
  },

  removeTagFromCharacter: async (characterId, tagId) => {
    await db.removeTagFromCharacter(characterId, tagId);
    const { selectedCharacter } = get();
    if (selectedCharacter?.id === characterId) {
      await get().selectCharacter(characterId);
    }
  },

  // UI state
  setViewMode: (mode) => set({ viewMode: mode }),

  setFilter: (filter) => {
    const newFilter = { ...get().filter, ...filter };
    set({ filter: newFilter });
    get().refreshCharacters();
  },

  setSort: (sort) => set({ sort: { ...get().sort, ...sort } }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setCharacterModalOpen: (open) => {
    if (!open) {
      set({ isCharacterModalOpen: false, selectedCharacter: null });
    } else {
      set({ isCharacterModalOpen: true });
    }
  },

  setProjectModalOpen: (open, project = null) => {
    set({ isProjectModalOpen: open, editingProject: project });
  },

  setTagModalOpen: (open, tag = null) => {
    set({ isTagModalOpen: open, editingTag: tag });
  },

  // Search
  searchCharacters: async (query) => {
    return db.searchCharacters(query);
  },

  // Export/Import
  exportData: async () => {
    const data = await db.exportAllData();
    return JSON.stringify(data, null, 2);
  },

  importData: async (json) => {
    const data = JSON.parse(json);
    await db.importData(data);
    await get().loadInitialData();
  },
}));
