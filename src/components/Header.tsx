import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { useStore } from "../stores/useStore";
import { getModifierKey } from "../lib/platform";
import { readImageAsArrayBuffer, saveImageFromBuffer } from "../lib/images";
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
import { save, open, message } from "@tauri-apps/plugin-dialog";
import {
  writeTextFile,
  readTextFile,
  writeFile,
  readFile,
} from "@tauri-apps/plugin-fs";

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
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
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
      // 1. Get raw data (no embedded images)
      const dataString = await exportData();
      const data = JSON.parse(dataString);

      const zip = new JSZip();

      // 2. Add data.json
      zip.file("data.json", JSON.stringify(data, null, 2));

      // 3. Find and add images
      const portraitsFolder = zip.folder("portraits");
      const processedCharacters = await Promise.all(
        data.characters.map(async (char: any) => {
          if (char.portrait_path) {
            try {
              const buffer = await readImageAsArrayBuffer(char.portrait_path);
              if (buffer) {
                // Generate a clean filename for the zip
                const ext = char.portrait_path.split(".").pop() || "png";
                // Use ID to ensure uniqueness in zip
                const filename = `${char.id}_${Date.now()}.${ext}`;
                portraitsFolder?.file(filename, buffer);

                // Update the path in the JSON to be relative
                return {
                  ...char,
                  portrait_path: `portraits/${filename}`,
                };
              }
            } catch (e) {
              console.error(`Failed to include image for char ${char.id}`, e);
            }
          }
          return char;
        }),
      );

      // 4. Update characters in the data.json we just wrote?
      // Actually we need to write the UPDATED data.json
      // Let's overwrite the data.json with the one containing relative paths
      const updatedData = { ...data, characters: processedCharacters };
      zip.file("data.json", JSON.stringify(updatedData, null, 2));

      // 5. Generate ZIP
      const zipContent = await zip.generateAsync({ type: "uint8array" });

      // 6. Save file
      const filePath = await save({
        filters: [{ name: "CharacterDB Backup", extensions: ["zip"] }],
        defaultPath: "characterdb-backup.zip",
      });

      if (filePath) {
        await writeFile(filePath, zipContent);
        await message("Export completed successfully!", {
          title: "Export",
          kind: "info",
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
      await message(`Export failed: ${error}`, {
        title: "Error",
        kind: "error",
      });
    }
  }, [exportData]);

  const handleImport = useCallback(async () => {
    try {
      const selected = await open({
        filters: [
          { name: "CharacterDB Files", extensions: ["json", "zip"] },
          { name: "All Files", extensions: ["*"] },
        ],
        multiple: false,
      });

      if (!selected) return;

      const filePath = selected as string;
      const isZip = filePath.toLowerCase().endsWith(".zip");

      let importResult;

      if (isZip) {
        // Handle ZIP import
        const fileContent = await readFile(filePath);
        const zip = await JSZip.loadAsync(fileContent);

        // Read data.json
        const dataJsonFile = zip.file("data.json");
        if (!dataJsonFile) {
          throw new Error("Invalid backup: data.json mismatch");
        }

        const jsonContent = await dataJsonFile.async("string");
        const data = JSON.parse(jsonContent);

        // Process images
        if (data.characters) {
          data.characters = await Promise.all(
            data.characters.map(async (char: any) => {
              // Check if it has a relative portrait path like "portraits/..."
              if (
                char.portrait_path &&
                !char.portrait_path.startsWith("asset://") &&
                !char.portrait_path.startsWith("/") &&
                !char.portrait_path.includes(":")
              ) {
                // Try to extract it
                const imageFile = zip.file(char.portrait_path);
                if (imageFile) {
                  const buffer = await imageFile.async("arraybuffer");
                  // Save to local portraits dir
                  const newPath = await saveImageFromBuffer(
                    buffer,
                    char.portrait_path,
                  );
                  return { ...char, portrait_path: newPath };
                }
              }
              return char;
            }),
          );
        }

        importResult = await importData(JSON.stringify(data));
      } else {
        // Handle JSON import (legacy/single)
        const content = await readTextFile(filePath);
        importResult = await importData(content);
      }

      const result = importResult;

      // Build feedback message
      const lines: string[] = [];
      const { characters, projects, tags } = result;

      if (
        characters.imported > 0 ||
        characters.duplicates > 0 ||
        characters.errors > 0
      ) {
        lines.push(
          `Characters: ${characters.imported} imported, ${characters.duplicates} duplicates skipped, ${characters.errors} errors`,
        );
      }
      if (
        projects.imported > 0 ||
        projects.duplicates > 0 ||
        projects.errors > 0
      ) {
        lines.push(
          `Projects: ${projects.imported} imported, ${projects.duplicates} duplicates skipped, ${projects.errors} errors`,
        );
      }
      if (tags.imported > 0 || tags.duplicates > 0 || tags.errors > 0) {
        lines.push(
          `Tags: ${tags.imported} imported, ${tags.duplicates} duplicates skipped, ${tags.errors} errors`,
        );
      }

      const totalImported =
        characters.imported + projects.imported + tags.imported;
      const totalDuplicates =
        characters.duplicates + projects.duplicates + tags.duplicates;
      const totalErrors = characters.errors + projects.errors + tags.errors;

      if (lines.length === 0) {
        await message("No data was found in the file.", {
          title: "Import Complete",
          kind: "info",
        });
      } else {
        const summary =
          totalErrors > 0
            ? `Import completed with ${totalErrors} error(s).`
            : totalDuplicates > 0
              ? `Import completed. ${totalImported} item(s) imported, ${totalDuplicates} duplicate(s) skipped.`
              : `Import completed. ${totalImported} item(s) imported successfully.`;

        await message(`${summary}\n\n${lines.join("\n")}`, {
          title: "Import Results",
          kind: "info",
        });
      }
    } catch (error) {
      console.error("Import failed:", error);
      await message("Failed to import data. Please check the file format.", {
        title: "Import Error",
        kind: "error",
      });
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
          className={`flex items-center gap-2 px-4 py-2.5 bg-parchment-100 dark:bg-ink-900 border rounded-xl
                      transition-all duration-200 ${
                        searchFocused
                          ? "border-accent-gold ring-2 ring-accent-gold/20"
                          : "border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600"
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
            className="flex-1 bg-transparent text-sm text-ink-900 dark:text-parchment-50 placeholder-ink-400 dark:placeholder-ink-500
                       focus:outline-none"
          />
          {filter.search ? (
            <button
              onClick={() => setFilter({ search: "" })}
              className="p-0.5 hover:bg-ink-200 dark:hover:bg-ink-700 rounded transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-ink-500 dark:text-ink-400" />
            </button>
          ) : (
            <kbd
              className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono
                           text-ink-400 dark:text-ink-500 bg-parchment-200 dark:bg-ink-800 rounded border border-ink-200 dark:border-ink-700"
            >
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
                       rounded-full bg-parchment-200 dark:bg-ink-800 text-ink-700 dark:text-parchment-300"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentProject.color || "#c9a227" }}
            />
            {currentProject.name}
            <button
              onClick={() => setFilter({ projectId: null })}
              className="ml-1 hover:text-ink-900 dark:hover:text-parchment-100"
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
              className="absolute right-0 top-full mt-2 w-48 bg-parchment-50 dark:bg-ink-900 rounded-xl
                         shadow-paper-hover border border-ink-100 dark:border-ink-700 overflow-hidden z-20"
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
                        ? "bg-parchment-200 dark:bg-ink-800 text-ink-900 dark:text-parchment-100"
                        : "text-ink-700 dark:text-parchment-300 hover:bg-parchment-100 dark:hover:bg-ink-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-ink-100 dark:border-ink-700 p-1">
                <button
                  onClick={() => {
                    setSort({
                      direction: sort.direction === "asc" ? "desc" : "asc",
                    });
                    setShowSortMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-ink-700 dark:text-parchment-300 rounded-lg
                             hover:bg-parchment-100 dark:hover:bg-ink-800 transition-colors"
                >
                  {sort.direction === "asc" ? "↑ Ascending" : "↓ Descending"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center bg-parchment-200 dark:bg-ink-800 rounded-lg p-1">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === "grid"
              ? "bg-parchment-50 dark:bg-ink-700 text-ink-900 dark:text-parchment-100 shadow-sm"
              : "text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-parchment-200"
          }`}
          aria-label="Grid view"
        >
          <Squares2X2Icon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-md transition-all duration-200 ${
            viewMode === "list"
              ? "bg-parchment-50 dark:bg-ink-700 text-ink-900 dark:text-parchment-100 shadow-sm"
              : "text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-parchment-200"
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
