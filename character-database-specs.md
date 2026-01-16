# Character Database Application - Technical Specifications

## Project Overview

A cross-platform desktop application for writers to organize, manage, and reference character information for their narrative projects. The application should be lightweight, fast, and work offline-first.

**Target Users:** Fiction writers, screenwriters, game writers, RPG creators
**Primary Use Case:** Create, organize, and quickly reference detailed character profiles during the writing process

---

## Technical Stack

### Core Framework
- **Tauri** (v2.x recommended for latest features)
- **Rust** backend
- **Frontend:** React with TypeScript (or your preferred framework - Vue, Svelte also work well)
- **Styling:** Tailwind CSS for rapid UI development
- **State Management:** Zustand or React Context
- **Database:** SQLite (via Tauri's SQL plugin) or JSON file storage

### Build Tools
- Vite (comes with Tauri setup)
- pnpm or npm

---

## Core Features

### 1. Character Management

#### Character Creation
- Create new character profiles with customizable fields
- Support for multiple character types (protagonist, antagonist, supporting, etc.)
- Quick-add minimal profile vs. detailed profile modes

#### Character Fields (Suggested Default Schema)
```
Basic Information:
- Name (required)
- Aliases/Nicknames
- Age/Date of Birth
- Gender/Pronouns
- Species/Race (for fantasy/sci-fi)
- Occupation
- Role (protagonist, antagonist, supporting, etc.)

Physical Description:
- Height
- Build
- Hair (color, style)
- Eyes
- Distinguishing Features
- Appearance Notes (free text)

Personality:
- Personality Traits (tags)
- Strengths
- Weaknesses
- Fears
- Desires/Goals
- Quirks/Habits

Background:
- Origin/Birthplace
- Family
- Education
- Significant Life Events
- Backstory (rich text editor)

Relationships:
- Connections to other characters (with relationship type)
- Relationship notes

Story-Specific:
- Character Arc
- First Appearance
- Last Appearance
- Story Role Notes

Media:
- Character Portrait/Image
- Reference Images (multiple)
- Voice/Inspiration Notes

Metadata:
- Project/Story (can belong to multiple)
- Tags/Categories
- Created Date
- Last Modified
```

#### Character Editing
- Edit any field at any time
- Auto-save functionality
- Version history (optional stretch feature)

#### Character Deletion
- Soft delete with confirmation
- Archive instead of delete option

### 2. Organization & Navigation

#### Projects/Stories
- Create multiple projects/stories
- Assign characters to one or more projects
- Filter view by project

#### Search & Filter
- Full-text search across all character fields
- Filter by:
  - Project
  - Role (protagonist, antagonist, etc.)
  - Tags
  - Character type
- Sort by: name, created date, modified date, role

#### Tags & Categories
- Custom tagging system
- Color-coded tags
- Tag management (create, edit, delete tags)

#### Views
- **Grid View:** Card-based layout with character portraits and key info
- **List View:** Compact table view with sortable columns
- **Detail View:** Full character profile

### 3. Relationships Mapping

- Visual relationship graph (optional advanced feature)
- Define relationship types: family, friend, enemy, rival, mentor, romantic, etc.
- Bidirectional relationships (if A is B's friend, B shows in A's relationships)
- Relationship strength/intensity indicator

### 4. Data Management

#### Import/Export
- Export single character to JSON
- Export all characters to JSON
- Export project to JSON
- Import from JSON
- Backup entire database

#### File Storage
- Local SQLite database or structured JSON files
- Store in user documents folder
- Support for custom storage location

### 5. User Interface Requirements

#### Main Window Layout
```
+--------------------------------------------------+
|  [Menu Bar]                                      |
+--------------------------------------------------+
|  [Sidebar]  |  [Main Content Area]              |
|             |                                    |
|  Projects   |  +-----------------------------+  |
|  - All      |  | Search/Filter Bar          |  |
|  - Story 1  |  +-----------------------------+  |
|  - Story 2  |  |                             |  |
|             |  | [Character Grid/List]       |  |
|  Tags       |  |                             |  |
|  - Hero     |  |  [Character Cards...]       |  |
|  - Villain  |  |                             |  |
|             |  +-----------------------------+  |
+--------------------------------------------------+
```

#### Character Detail View
- Modal or side panel
- Tabbed sections for different categories
- Rich text editor for longer fields
- Image upload/display
- Quick navigation to related characters

#### Theme
- Light and dark mode support
- Clean, minimal design
- Focus on readability and quick access to information

### 6. Quality of Life Features

- Keyboard shortcuts for common actions
- Quick-add character button always accessible
- Recently viewed characters
- Favorites/Pinning system
- Character templates (save a character structure as a template)
- Duplicate character feature
- Character notes/scratchpad area

---

## Data Architecture

### Database Schema (SQLite Option)

```sql
-- Projects/Stories
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Characters
CREATE TABLE characters (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    age TEXT,
    gender TEXT,
    species TEXT,
    occupation TEXT,
    
    -- Physical
    height TEXT,
    build TEXT,
    hair TEXT,
    eyes TEXT,
    distinguishing_features TEXT,
    appearance_notes TEXT,
    
    -- Personality
    personality_traits TEXT, -- JSON array
    strengths TEXT,
    weaknesses TEXT,
    fears TEXT,
    desires TEXT,
    quirks TEXT,
    
    -- Background
    origin TEXT,
    family TEXT,
    education TEXT,
    backstory TEXT, -- Rich text/HTML
    
    -- Story
    character_arc TEXT,
    first_appearance TEXT,
    last_appearance TEXT,
    story_notes TEXT,
    
    -- Media
    portrait_path TEXT,
    reference_images TEXT, -- JSON array
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character-Project relationship (many-to-many)
CREATE TABLE character_projects (
    character_id INTEGER,
    project_id INTEGER,
    PRIMARY KEY (character_id, project_id),
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tags
CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT
);

-- Character-Tag relationship
CREATE TABLE character_tags (
    character_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (character_id, tag_id),
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Relationships
CREATE TABLE relationships (
    id INTEGER PRIMARY KEY,
    character_a_id INTEGER,
    character_b_id INTEGER,
    relationship_type TEXT, -- 'friend', 'enemy', 'family', etc.
    notes TEXT,
    FOREIGN KEY (character_a_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (character_b_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

### File Structure (JSON Option Alternative)

```
user-data/
├── projects/
│   ├── project-1.json
│   └── project-2.json
├── characters/
│   ├── char-001.json
│   ├── char-002.json
│   └── ...
├── images/
│   ├── portraits/
│   └── references/
├── tags.json
└── settings.json
```

---

## Implementation Priority

### Phase 1: MVP (Minimum Viable Product)
1. Basic Tauri setup with React frontend
2. Create character with core fields (name, role, basic info)
3. List view of all characters
4. Character detail view/editing
5. Local data persistence (SQLite or JSON)
6. Search by name

### Phase 2: Organization
1. Projects/stories feature
2. Assign characters to projects
3. Filter by project
4. Tags system
5. Enhanced search (full-text across all fields)

### Phase 3: Polish
1. Grid view with character portraits
2. Image upload for portraits
3. Relationship mapping
4. Rich text editor for longer fields
5. Import/export functionality

### Phase 4: Advanced
1. Character templates
2. Relationship graph visualization
3. Version history
4. Cloud sync option (optional)
5. Character comparison view

---

## Non-Functional Requirements

### Performance
- App should launch in under 3 seconds
- Character list should render 100+ characters smoothly
- Search results should appear within 500ms

### Usability
- Intuitive UI requiring minimal learning curve
- Accessible via keyboard navigation
- Responsive design (resize window gracefully)

### Data Safety
- Auto-save to prevent data loss
- Backup/restore functionality
- Clear user feedback for all actions

### Cross-Platform
- Support Windows, macOS, and Linux
- Consistent UI across platforms
- Platform-appropriate file storage locations

---

## Development Setup Instructions

```bash
# Create new Tauri project
npm create tauri-app@latest

# Project name: character-database
# Choose: React + TypeScript
# Choose: npm/pnpm

cd character-database

# Install dependencies
npm install

# Add Tauri SQL plugin
npm install @tauri-apps/plugin-sql

# Add UI dependencies
npm install @tanstack/react-query zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Development
npm run tauri dev

# Build
npm run tauri build
```

---

## Future Enhancement Ideas

- Export characters to various formats (PDF, Markdown, CSV)
- Character questionnaire/interview mode to help develop depth
- Timeline view showing when characters appear in story
- Character name generator
- Integration with writing apps (Scrivener, etc.)
- Mobile companion app for quick reference
- Collaborative features (share character databases)
- AI-assisted character development suggestions
- Character stat tracking for RPG campaigns
- World-building database integration

---

## Success Criteria

The application will be considered successful if:
1. Users can create and manage 100+ characters without performance issues
2. Data is never lost (auto-save works reliably)
3. Users can find any character within 3 clicks
4. The app remains under 50MB installed size
5. Export/backup functionality works flawlessly
6. UI is intuitive for new users (minimal tutorial needed)

---

## Notes for Implementation

- Start with SQLite for easier querying and relationships
- Use Tauri's built-in dialog system for file operations
- Leverage Tauri's store plugin for app settings
- Consider using TipTap or Quill for rich text editing
- Use react-window or similar for virtualizing large character lists
- Implement debounced search to avoid excessive queries
- Add loading states and error handling throughout
- Consider using React Hook Form for form validation
