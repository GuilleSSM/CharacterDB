# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Development (runs both Vite dev server and Tauri window)
npm run tauri dev

# Production build (creates native binary)
npm run tauri build

# Frontend-only development (Vite on port 1420)
npm run dev

# TypeScript check + Vite build (frontend only)
npm run build
```

## Architecture Overview

CharacterDB is a Tauri 2 desktop application for managing fictional characters. It uses React/TypeScript for the frontend and Rust for the native shell, with SQLite for local data persistence.

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **State**: Zustand (single store in `src/stores/useStore.ts`)
- **Backend**: Tauri 2 (Rust), SQLite via `@tauri-apps/plugin-sql`
- **Plugins**: dialog, fs, sql, store (all Tauri v2 plugins)

### Key Directories

```
src/
├── components/     # React components (CharacterModal is the main editor)
├── stores/         # Zustand store - all app state lives here
├── lib/            # database.ts (SQLite CRUD), images.ts (portrait handling)
├── types/          # TypeScript interfaces (Character, Project, Tag, etc.)
src-tauri/
├── src/            # Minimal Rust code (lib.rs initializes plugins)
├── capabilities/   # Tauri security permissions
├── tauri.conf.json # App config, window settings, plugin setup
```

### Data Flow Pattern

1. User interaction triggers Zustand action
2. Action calls function from `src/lib/database.ts`
3. Database function executes SQL via Tauri's sql plugin
4. Action refreshes relevant state (characters, projects, tags)
5. Components re-render from store

### Database Layer (`src/lib/database.ts`)

- **Lazy init**: `getDb()` loads SQLite once, caches connection
- **Schema**: Auto-creates tables on first load via `initializeSchema()`
- **Array fields**: `personality_traits`, `powers`, `reference_images` stored as JSON strings
- **Migrations**: Use try-catch `ALTER TABLE` for backward compatibility

### Character Modal

The main editor (`src/components/CharacterModal.tsx`) has 7 tabs:
- Basic, Appearance, Personality, Powers, Background, Story, Relationships

Uses debounced auto-save (500ms) - changes are tracked in `pendingChanges` object and merged incrementally.

### Image Handling

Portraits stored in `$APPDATA/portraits/` with unique filenames. Accessed via Tauri's asset protocol (`asset://`). See `src/lib/images.ts` for upload logic.

### Platform Detection

`src/lib/platform.ts` detects macOS vs Windows/Linux for keyboard shortcut display (⌘ vs Ctrl).

## Design System

Dark Academia theme with two modes:
- **Light**: Parchment/cream tones
- **Dark**: Ink/dark tones
- **Accent**: Gold (#c9a227), burgundy, forest green, navy
- **Fonts**: Cormorant Garamond (display), Source Serif 4 (body), JetBrains Mono (code)
