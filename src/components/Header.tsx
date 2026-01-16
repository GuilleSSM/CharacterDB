import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../stores/useStore";
import { getModifierKey } from "../lib/platform";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from "./icons";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

export function Header() {
  const {
    viewMode,
    setViewMode,
    filter,
    setFilter,
    sort,
    setSort,
    projects,
    createCharacter,
    selectCharacter,
    exportData,
    importData,
    theme,
    toggleTheme,
  } = useStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNewCharacter = useCallback(async () => {
    const id = await createCharacter({ name: "New Character" });
    await selectCharacter(id);
  }, [createCharacter, selectCharacter]);

  const handleExport = useCallback(async () => {
    try {
      const data = await exportData();
      const filePath = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: "characters-export.json",
      });
      if (filePath) {
        await writeTextFile(filePath, data);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  }, [exportData]);

  const handleImport = useCallback(async () => {
    try {
      const filePath = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (filePath) {
        const content = await readTextFile(filePath as string);
        await importData(content);
      }
    } catch (error) {
      console.error("Import failed:", error);
    }
  }, [importData]);

  const sortOptions = [
    { field: "updated_at" as const, label: "Last Modified" },
    { field: "created_at" as const, label: "Date Created" },
    { field: "name" as const, label: "Name" },
    { field: "role" as const, label: "Role" },
  ];

  const currentProject = filter.projectId
    ? projects.find((p) => p.id === filter.projectId)
    : null;

  return (
    <header className="h-16 flex items-center gap-4 px-6 bg-parchment-50/80 dark:bg-ink-950/80 backdrop-blur-sm border-b border-ink-100 dark:border-ink-800 sticky top-0 z-10">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <div
          className={`flex items-center gap-2 px-4 py-2.5 bg-parchment-100 border rounded-xl
                      transition-all duration-200 ${
                        searchFocused
                          ? "border-accent-gold ring-2 ring-accent-gold/20"
                          : "border-ink-200 hover:border-ink-300"
                      }`}
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-ink-400 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search characters..."
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 bg-transparent text-sm text-ink-900 placeholder-ink-400
                       focus:outline-none"
          />
          {filter.search ? (
            <button
              onClick={() => setFilter({ search: "" })}
              className="p-0.5 hover:bg-ink-200 rounded transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-ink-500" />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono
                           text-ink-400 bg-parchment-200 rounded border border-ink-200">
              <span className="text-xs">{getModifierKey()}</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Active filters indicator */}
      {currentProject && (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       rounded-full bg-parchment-200 text-ink-700"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentProject.color || "#c9a227" }}
            />
            {currentProject.name}
            <button
              onClick={() => setFilter({ projectId: null })}
              className="ml-1 hover:text-ink-900"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sort dropdown */}
      <div className="relative" ref={sortMenuRef}>
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="btn-ghost text-xs"
        >
          <ArrowsUpDownIcon className="w-4 h-4" />
          <span className="hidden sm:inline">
            {sortOptions.find((o) => o.field === sort.field)?.label}
          </span>
        </button>

        <AnimatePresence>
          {showSortMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 bg-parchment-50 rounded-xl
                         shadow-paper-hover border border-ink-100 overflow-hidden z-20"
            >
              <div className="p-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.field}
                    onClick={() => {
                      setSort({ field: option.field });
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                      sort.field === option.field
                        ? "bg-parchment-200 text-ink-900"
                        : "text-ink-700 hover:bg-parchment-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-ink-100 p-1">
                <button
                  onClick={() => {
                    setSort({
                      direction: sort.direction === "asc" ? "desc" : "asc",
                    });
                    setShowSortMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-ink-700 rounded-lg
                             hover:bg-parchment-100 transition-colors"
                >
                  {sort.direction === "asc" ? "↑ Ascending" : "↓ Descending"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center bg-parchment-200 rounded-lg p-1">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === "grid"
              ? "bg-parchment-50 text-ink-900 shadow-sm"
              : "text-ink-500 hover:text-ink-700"
          }`}
          aria-label="Grid view"
        >
          <Squares2X2Icon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === "list"
              ? "bg-parchment-50 text-ink-900 shadow-sm"
              : "text-ink-500 hover:text-ink-700"
          }`}
          aria-label="List view"
        >
          <ListBulletIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="divider-vertical h-8" />

      {/* Import/Export */}
      <button onClick={handleImport} className="btn-ghost" title="Import">
        <ArrowUpTrayIcon className="w-4 h-4" />
      </button>
      <button onClick={handleExport} className="btn-ghost" title="Export">
        <ArrowDownTrayIcon className="w-4 h-4" />
      </button>

      {/* Theme Toggle */}
      <button onClick={toggleTheme} className="btn-ghost" title="Toggle Theme">
        {theme === "dark" ? (
          <SunIcon className="w-4 h-4" />
        ) : (
          <MoonIcon className="w-4 h-4" />
        )}
      </button>

      {/* Divider */}
      <div className="divider-vertical h-8" />

      {/* New character button */}
      <button onClick={handleNewCharacter} className="btn-primary">
        <PlusIcon className="w-4 h-4" />
        <span className="hidden sm:inline">New Character</span>
      </button>
    </header>
  );
}
