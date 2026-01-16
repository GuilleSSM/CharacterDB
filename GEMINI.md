# Character Database Project Context

## Project Overview

This project is a **Character Database Application**, a cross-platform desktop app designed for writers to organize, manage, and reference character information. It is built using **Tauri** (Rust backend) and **React** (Frontend).

### Key Technologies
*   **Core Framework:** Tauri v2
*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand
*   **Database:** SQLite (via `@tauri-apps/plugin-sql`)
*   **Navigation/Routing:** (Implicit single-page application structure)

## Architecture

The application follows a standard Tauri architecture:

1.  **Frontend (UI):** Located in `src/`. Built with React and TypeScript.
    *   **Components:** UI building blocks in `src/components/`.
    *   **Stores:** State management using Zustand in `src/stores/`.
    *   **Lib:** Utility functions and database logic in `src/lib/`.
2.  **Backend (Core):** Located in `src-tauri/`.
    *   `src-tauri/src/lib.rs` and `main.rs`: Entry points for the Rust backend.
    *   `src-tauri/tauri.conf.json`: Configuration for the Tauri app (permissions, windows, bundle settings).

### Database
Data is persisted locally using SQLite.
*   **Schema:** The database schema is defined and initialized programmatically in `src/lib/database.ts`.
*   **Tables:** `projects`, `characters`, `tags`, `character_projects`, `character_tags`, `relationships`.
*   **Access:** All database operations (CRUD) are encapsulated in `src/lib/database.ts`.

## Building and Running

### Prerequisites
*   Node.js (npm or pnpm)
*   Rust (cargo)

### Commands
*   **Development:**
    ```bash
    npm run tauri dev
    ```
    This starts the Vite dev server and the Tauri application window.

*   **Build:**
    ```bash
    npm run tauri build
    ```
    This compiles the React frontend and the Rust backend into a production-ready application.

## Development Conventions

*   **Database Changes:** If modifying the database schema, update the `initializeSchema` function in `src/lib/database.ts`.
*   **Styling:** Use Tailwind CSS utility classes.
*   **Type Safety:** Maintain strict TypeScript types in `src/types/index.ts` (implied) to match the database schema.
*   **State:** Use Zustand stores for global application state (e.g., currently selected project, loading states).

## Key Documentation
*   `character-database-specs.md`: Detailed functional specifications and feature roadmap.
*   `README.md`: General project info.
