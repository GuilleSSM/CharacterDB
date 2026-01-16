import { useEffect, useCallback } from "react";
import { useStore } from "./stores/useStore";
import { isMac } from "./lib/platform";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { CharacterGrid } from "./components/CharacterGrid";
import { CharacterList } from "./components/CharacterList";
import { CharacterModal } from "./components/CharacterModal";
import { ProjectModal } from "./components/ProjectModal";
import { TagModal } from "./components/TagModal";
import { LoadingScreen } from "./components/LoadingScreen";
import { EmptyState } from "./components/EmptyState";

function App() {
  const {
    isLoading,
    loadInitialData,
    characters,
    viewMode,
    isSidebarCollapsed,
    isCharacterModalOpen,
    isProjectModalOpen,
    isTagModalOpen,
    theme,
    createCharacter,
    selectCharacter,
  } = useStore();

  // Handle Cmd/Ctrl+N to create a new character
  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      const modifier = isMac() ? event.metaKey : event.ctrlKey;

      if (modifier && event.key === "n") {
        event.preventDefault();
        const id = await createCharacter({ name: "New Character" });
        await selectCharacter(id);
      }
    },
    [createCharacter, selectCharacter]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-parchment-100 dark:bg-ink-950 text-ink-900 dark:text-parchment-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <Header />

        <div className="flex-1 overflow-auto p-6">
          {characters.length === 0 ? (
            <EmptyState />
          ) : viewMode === "grid" ? (
            <CharacterGrid />
          ) : (
            <CharacterList />
          )}
        </div>
      </main>

      {/* Modals */}
      {isCharacterModalOpen && <CharacterModal />}
      {isProjectModalOpen && <ProjectModal />}
      {isTagModalOpen && <TagModal />}
    </div>
  );
}

export default App;
