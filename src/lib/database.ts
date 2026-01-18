import Database from "@tauri-apps/plugin-sql";
import type {
  Character,
  Project,
  Tag,
  Relationship,
  CharacterWithRelations,
  ImportResult,
  Power,
  PowerCategory,
} from "../types";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:characterdb.db");
    await initializeSchema();
  }
  return db;
}

async function initializeSchema(): Promise<void> {
  const database = db!;

  await database.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#c9a227',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      aliases TEXT,
      role TEXT,
      age TEXT,
      gender TEXT,
      pronouns TEXT,
      species TEXT,
      occupation TEXT,
      height TEXT,
      build TEXT,
      hair TEXT,
      eyes TEXT,
      distinguishing_features TEXT,
      appearance_notes TEXT,
      personality_traits TEXT,
      strengths TEXT,
      weaknesses TEXT,
      fears TEXT,
      desires TEXT,
      quirks TEXT,
      powers TEXT,
      origin TEXT,
      family TEXT,
      education TEXT,
      backstory TEXT,
      character_arc TEXT,
      first_appearance TEXT,
      last_appearance TEXT,
      story_notes TEXT,
      portrait_path TEXT,
      reference_images TEXT,
      is_favorite INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#c9a227'
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS character_projects (
      character_id INTEGER,
      project_id INTEGER,
      PRIMARY KEY (character_id, project_id),
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS character_tags (
      character_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (character_id, tag_id),
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_a_id INTEGER,
      character_b_id INTEGER,
      relationship_type TEXT,
      notes TEXT,
      FOREIGN KEY (character_a_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (character_b_id) REFERENCES characters(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_characters_role ON characters(role)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_character_projects_character ON character_projects(character_id)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_character_projects_project ON character_projects(project_id)
  `);

  // Migration: Add powers column if it doesn't exist
  try {
    await database.execute(`ALTER TABLE characters ADD COLUMN powers TEXT`);
  } catch {
    // Column already exists, ignore
  }
}

// Character CRUD operations
export async function getAllCharacters(showArchived = false): Promise<Character[]> {
  const database = await getDb();
  const rows = await database.select<Character[]>(
    showArchived
      ? "SELECT * FROM characters ORDER BY updated_at DESC"
      : "SELECT * FROM characters WHERE is_archived = 0 ORDER BY updated_at DESC"
  );
  return rows.map(parseCharacter);
}

export async function getCharacterById(
  id: number
): Promise<CharacterWithRelations | null> {
  const database = await getDb();
  const rows = await database.select<Character[]>(
    "SELECT * FROM characters WHERE id = ?",
    [id]
  );

  if (rows.length === 0) return null;

  const character = parseCharacter(rows[0]);

  // Get projects
  const projects = await database.select<Project[]>(
    `SELECT p.* FROM projects p
     JOIN character_projects cp ON p.id = cp.project_id
     WHERE cp.character_id = ?`,
    [id]
  );

  // Get tags
  const tags = await database.select<Tag[]>(
    `SELECT t.* FROM tags t
     JOIN character_tags ct ON t.id = ct.tag_id
     WHERE ct.character_id = ?`,
    [id]
  );

  // Get relationships
  const relationshipsA = await database.select<
    (Relationship & { related_character: Character })[]
  >(
    `SELECT r.*, c.id as rc_id, c.name as rc_name, c.portrait_path as rc_portrait
     FROM relationships r
     JOIN characters c ON r.character_b_id = c.id
     WHERE r.character_a_id = ?`,
    [id]
  );

  const relationshipsB = await database.select<
    (Relationship & { related_character: Character })[]
  >(
    `SELECT r.*, c.id as rc_id, c.name as rc_name, c.portrait_path as rc_portrait
     FROM relationships r
     JOIN characters c ON r.character_a_id = c.id
     WHERE r.character_b_id = ?`,
    [id]
  );

  return {
    ...character,
    projects,
    tags,
    relationships: [
      ...relationshipsA.map((r) => ({
        ...r,
        related_character: {
          id: (r as unknown as Record<string, unknown>).rc_id,
          name: (r as unknown as Record<string, unknown>).rc_name,
          portrait_path: (r as unknown as Record<string, unknown>).rc_portrait,
        } as Character,
      })),
      ...relationshipsB.map((r) => ({
        ...r,
        related_character: {
          id: (r as unknown as Record<string, unknown>).rc_id,
          name: (r as unknown as Record<string, unknown>).rc_name,
          portrait_path: (r as unknown as Record<string, unknown>).rc_portrait,
        } as Character,
      })),
    ],
  };
}

export async function createCharacter(
  character: Partial<Character>
): Promise<number> {
  const database = await getDb();

  const result = await database.execute(
    `INSERT INTO characters (
      name, aliases, role, age, gender, pronouns, species, occupation,
      height, build, hair, eyes, distinguishing_features, appearance_notes,
      personality_traits, strengths, weaknesses, fears, desires, quirks, powers,
      origin, family, education, backstory,
      character_arc, first_appearance, last_appearance, story_notes,
      portrait_path, reference_images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      character.name || "Unnamed Character",
      character.aliases || null,
      character.role || null,
      character.age || null,
      character.gender || null,
      character.pronouns || null,
      character.species || null,
      character.occupation || null,
      character.height || null,
      character.build || null,
      character.hair || null,
      character.eyes || null,
      character.distinguishing_features || null,
      character.appearance_notes || null,
      character.personality_traits
        ? JSON.stringify(character.personality_traits)
        : null,
      character.strengths || null,
      character.weaknesses || null,
      character.fears || null,
      character.desires || null,
      character.quirks || null,
      character.powers ? JSON.stringify(character.powers) : null,
      character.origin || null,
      character.family || null,
      character.education || null,
      character.backstory || null,
      character.character_arc || null,
      character.first_appearance || null,
      character.last_appearance || null,
      character.story_notes || null,
      character.portrait_path || null,
      character.reference_images
        ? JSON.stringify(character.reference_images)
        : null,
    ]
  );

  return result.lastInsertId ?? 0;
}

export async function updateCharacter(
  id: number,
  character: Partial<Character>
): Promise<void> {
  const database = await getDb();

  const fields: string[] = [];
  const values: unknown[] = [];

  const updateableFields = [
    "name",
    "aliases",
    "role",
    "age",
    "gender",
    "pronouns",
    "species",
    "occupation",
    "height",
    "build",
    "hair",
    "eyes",
    "distinguishing_features",
    "appearance_notes",
    "strengths",
    "weaknesses",
    "fears",
    "desires",
    "quirks",
    "origin",
    "family",
    "education",
    "backstory",
    "character_arc",
    "first_appearance",
    "last_appearance",
    "story_notes",
    "portrait_path",
    "is_favorite",
    "is_archived",
  ];

  for (const field of updateableFields) {
    if (field in character) {
      fields.push(`${field} = ?`);
      let value: unknown = character[field as keyof Character];
      // Convert empty strings to null for optional fields (except name which is required)
      if (value === "" && field !== "name") {
        value = null;
      }
      // Convert undefined to null
      if (value === undefined) {
        value = null;
      }
      // Convert booleans to integers for SQLite
      if (typeof value === "boolean") {
        value = value ? 1 : 0;
      }
      values.push(value);
    }
  }

  if ("personality_traits" in character) {
    fields.push("personality_traits = ?");
    values.push(
      character.personality_traits
        ? JSON.stringify(character.personality_traits)
        : null
    );
  }

  if ("powers" in character) {
    fields.push("powers = ?");
    values.push(character.powers ? JSON.stringify(character.powers) : null);
  }

  if ("reference_images" in character) {
    fields.push("reference_images = ?");
    values.push(
      character.reference_images
        ? JSON.stringify(character.reference_images)
        : null
    );
  }

  if (fields.length === 0) return;

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  await database.execute(
    `UPDATE characters SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deleteCharacter(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM characters WHERE id = ?", [id]);
}

export async function archiveCharacter(
  id: number,
  archived: boolean
): Promise<void> {
  const database = await getDb();
  await database.execute(
    "UPDATE characters SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [archived ? 1 : 0, id]
  );
}

// Project CRUD operations
export async function getAllProjects(): Promise<Project[]> {
  const database = await getDb();
  return database.select<Project[]>(
    "SELECT * FROM projects ORDER BY updated_at DESC"
  );
}

export async function createProject(project: Partial<Project>): Promise<number> {
  const database = await getDb();
  const result = await database.execute(
    "INSERT INTO projects (name, description, color) VALUES (?, ?, ?)",
    [project.name || "Untitled Project", project.description || null, project.color || "#c9a227"]
  );
  return result.lastInsertId ?? 0;
}

export async function updateProject(
  id: number,
  project: Partial<Project>
): Promise<void> {
  const database = await getDb();
  await database.execute(
    "UPDATE projects SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [project.name, project.description || null, project.color || "#c9a227", id]
  );
}

export async function deleteProject(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM projects WHERE id = ?", [id]);
}

export async function assignCharacterToProject(
  characterId: number,
  projectId: number
): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT OR IGNORE INTO character_projects (character_id, project_id) VALUES (?, ?)",
    [characterId, projectId]
  );
}

export async function removeCharacterFromProject(
  characterId: number,
  projectId: number
): Promise<void> {
  const database = await getDb();
  await database.execute(
    "DELETE FROM character_projects WHERE character_id = ? AND project_id = ?",
    [characterId, projectId]
  );
}

export async function getCharactersByProject(
  projectId: number,
  showArchived = false
): Promise<Character[]> {
  const database = await getDb();
  const rows = await database.select<Character[]>(
    showArchived
      ? `SELECT c.* FROM characters c
         JOIN character_projects cp ON c.id = cp.character_id
         WHERE cp.project_id = ?
         ORDER BY c.updated_at DESC`
      : `SELECT c.* FROM characters c
         JOIN character_projects cp ON c.id = cp.character_id
         WHERE cp.project_id = ? AND c.is_archived = 0
         ORDER BY c.updated_at DESC`,
    [projectId]
  );
  return rows.map(parseCharacter);
}

// Tag CRUD operations
export async function getAllTags(): Promise<Tag[]> {
  const database = await getDb();
  return database.select<Tag[]>("SELECT * FROM tags ORDER BY name");
}

export async function createTag(tag: Partial<Tag>): Promise<number> {
  const database = await getDb();
  const result = await database.execute(
    "INSERT INTO tags (name, color) VALUES (?, ?)",
    [tag.name || "New Tag", tag.color || "#c9a227"]
  );
  return result.lastInsertId ?? 0;
}

export async function updateTag(id: number, tag: Partial<Tag>): Promise<void> {
  const database = await getDb();
  await database.execute("UPDATE tags SET name = ?, color = ? WHERE id = ?", [
    tag.name,
    tag.color,
    id,
  ]);
}

export async function deleteTag(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM tags WHERE id = ?", [id]);
}

export async function assignTagToCharacter(
  characterId: number,
  tagId: number
): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT OR IGNORE INTO character_tags (character_id, tag_id) VALUES (?, ?)",
    [characterId, tagId]
  );
}

export async function removeTagFromCharacter(
  characterId: number,
  tagId: number
): Promise<void> {
  const database = await getDb();
  await database.execute(
    "DELETE FROM character_tags WHERE character_id = ? AND tag_id = ?",
    [characterId, tagId]
  );
}

export async function getCharacterIdsByTags(
  tagIds: number[]
): Promise<number[]> {
  if (tagIds.length === 0) return [];
  const database = await getDb();
  const placeholders = tagIds.map(() => "?").join(", ");
  const rows = await database.select<{ character_id: number }[]>(
    `SELECT character_id FROM character_tags
     WHERE tag_id IN (${placeholders})
     GROUP BY character_id
     HAVING COUNT(DISTINCT tag_id) = ?`,
    [...tagIds, tagIds.length]
  );
  return rows.map((r) => r.character_id);
}

// Relationship operations
export async function createRelationship(
  relationship: Partial<Relationship>
): Promise<number> {
  const database = await getDb();
  const result = await database.execute(
    "INSERT INTO relationships (character_a_id, character_b_id, relationship_type, notes) VALUES (?, ?, ?, ?)",
    [
      relationship.character_a_id,
      relationship.character_b_id,
      relationship.relationship_type,
      relationship.notes || null,
    ]
  );
  return result.lastInsertId ?? 0;
}

export async function deleteRelationship(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM relationships WHERE id = ?", [id]);
}

// Search
export async function searchCharacters(query: string, showArchived = false): Promise<Character[]> {
  const database = await getDb();
  const searchTerm = `%${query}%`;
  const rows = await database.select<Character[]>(
    showArchived
      ? `SELECT * FROM characters
         WHERE (
           name LIKE ? OR
           aliases LIKE ? OR
           role LIKE ? OR
           occupation LIKE ? OR
           backstory LIKE ? OR
           appearance_notes LIKE ? OR
           personality_traits LIKE ?
         )
         ORDER BY
           CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
           updated_at DESC`
      : `SELECT * FROM characters
         WHERE is_archived = 0 AND (
           name LIKE ? OR
           aliases LIKE ? OR
           role LIKE ? OR
           occupation LIKE ? OR
           backstory LIKE ? OR
           appearance_notes LIKE ? OR
           personality_traits LIKE ?
         )
         ORDER BY
           CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
           updated_at DESC`,
    [
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
    ]
  );
  return rows.map(parseCharacter);
}

// Export/Import
export async function exportAllData(): Promise<{
  characters: Character[];
  projects: Project[];
  tags: Tag[];
  relationships: Relationship[];
  character_projects: { character_id: number; project_id: number }[];
  character_tags: { character_id: number; tag_id: number }[];
}> {
  const database = await getDb();

  const characters = await database.select<Character[]>(
    "SELECT * FROM characters"
  );
  const projects = await database.select<Project[]>("SELECT * FROM projects");
  const tags = await database.select<Tag[]>("SELECT * FROM tags");
  const relationships = await database.select<Relationship[]>(
    "SELECT * FROM relationships"
  );
  const character_projects = await database.select<
    { character_id: number; project_id: number }[]
  >("SELECT * FROM character_projects");
  const character_tags = await database.select<
    { character_id: number; tag_id: number }[]
  >("SELECT * FROM character_tags");

  return {
    characters: characters.map(parseCharacter),
    projects,
    tags,
    relationships,
    character_projects,
    character_tags,
  };
}

export async function importData(data: {
  characters?: Partial<Character>[];
  projects?: Partial<Project>[];
  tags?: Partial<Tag>[];
}): Promise<ImportResult> {
  const database = await getDb();
  const result: ImportResult = {
    characters: { imported: 0, duplicates: 0, errors: 0 },
    projects: { imported: 0, duplicates: 0, errors: 0 },
    tags: { imported: 0, duplicates: 0, errors: 0 },
  };

  // Import projects (check for duplicates by name)
  if (data.projects) {
    const existingProjects = await database.select<Project[]>("SELECT name FROM projects");
    const existingNames = new Set(existingProjects.map((p) => p.name.toLowerCase()));

    for (const project of data.projects) {
      if (!project.name || existingNames.has(project.name.toLowerCase())) {
        result.projects.duplicates++;
        continue;
      }
      try {
        await createProject(project);
        existingNames.add(project.name.toLowerCase());
        result.projects.imported++;
      } catch {
        result.projects.errors++;
      }
    }
  }

  // Import tags (check for duplicates by name)
  if (data.tags) {
    const existingTags = await database.select<Tag[]>("SELECT name FROM tags");
    const existingNames = new Set(existingTags.map((t) => t.name.toLowerCase()));

    for (const tag of data.tags) {
      if (!tag.name || existingNames.has(tag.name.toLowerCase())) {
        result.tags.duplicates++;
        continue;
      }
      try {
        await createTag(tag);
        existingNames.add(tag.name.toLowerCase());
        result.tags.imported++;
      } catch {
        result.tags.errors++;
      }
    }
  }

  // Import characters (check for duplicates by name)
  if (data.characters) {
    const existingChars = await database.select<Character[]>("SELECT name FROM characters");
    const existingNames = new Set(existingChars.map((c) => c.name.toLowerCase()));

    for (const character of data.characters) {
      if (!character.name || existingNames.has(character.name.toLowerCase())) {
        result.characters.duplicates++;
        continue;
      }
      try {
        await createCharacter(character);
        existingNames.add(character.name.toLowerCase());
        result.characters.imported++;
      } catch {
        result.characters.errors++;
      }
    }
  }

  return result;
}

// Export a single character (without project/tag references to avoid import errors)
export async function exportCharacter(id: number): Promise<Partial<Character> | null> {
  const database = await getDb();
  const rows = await database.select<Character[]>(
    "SELECT * FROM characters WHERE id = ?",
    [id]
  );

  if (rows.length === 0) return null;

  const character = parseCharacter(rows[0]);

  // Remove fields that would cause issues on import
  const { id: _id, created_at, updated_at, ...exportData } = character;

  return exportData;
}

// Helper to generate a UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to migrate old string powers to Power objects
function migratePowers(powers: unknown): Power[] {
  if (!powers) return [];

  // Parse if it's a JSON string
  let parsed = powers;
  if (typeof powers === "string") {
    try {
      parsed = JSON.parse(powers);
    } catch {
      // If parsing fails, treat it as a single power name
      return [{
        id: generateUUID(),
        name: powers,
        category: "utility" as PowerCategory,
        powerLevel: 5,
      }];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.map((power: unknown) => {
    // Already a Power object
    if (typeof power === "object" && power !== null && "id" in power && "name" in power) {
      return power as Power;
    }
    // Old string format - migrate to Power object
    if (typeof power === "string") {
      return {
        id: generateUUID(),
        name: power,
        category: "utility" as PowerCategory,
        powerLevel: 5,
      };
    }
    // Unknown format, skip
    return null;
  }).filter((p): p is Power => p !== null);
}

// Helper to parse JSON fields
function parseCharacter(row: Character): Character {
  return {
    ...row,
    personality_traits: row.personality_traits
      ? typeof row.personality_traits === "string"
        ? JSON.parse(row.personality_traits)
        : row.personality_traits
      : [],
    powers: migratePowers(row.powers),
    reference_images: row.reference_images
      ? typeof row.reference_images === "string"
        ? JSON.parse(row.reference_images)
        : row.reference_images
      : [],
    is_favorite: Boolean(row.is_favorite),
    is_archived: Boolean(row.is_archived),
  };
}
