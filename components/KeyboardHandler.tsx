"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/lib/store";

export function KeyboardHandler() {
  const { selectedId, deleteFurniture, undo, redo, viewMode } = useStudioStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts in walkthrough mode (except ESC which is handled separately)
      if (viewMode === "walkthrough") return;

      // Delete selected furniture
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteFurniture(selectedId);
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, deleteFurniture, undo, redo, viewMode]);

  return null;
}
