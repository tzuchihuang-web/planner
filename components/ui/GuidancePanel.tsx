"use client";

import { useState } from "react";
import { useStudioStore } from "@/lib/store";

export function GuidancePanel() {
  const { 
    scenario, 
    togglePathReveal, 
    startGuidedWalkthrough,
    showPathReveal,
    viewMode,
  } = useStudioStore();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for Studio B
  if (scenario !== "B") {
    return null;
  }

  // Don't show when in walkthrough modes
  if (viewMode === "walkthrough" || viewMode === "guidedWalkthrough") {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
      >
        Guidance
      </button>

      {isOpen && (
        <div className="mt-2 bg-card border border-border rounded-lg p-2 space-y-2 shadow-lg">
          <button
            onClick={() => {
              startGuidedWalkthrough();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-muted transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Walkthrough (POV)</span>
          </button>

          <button
            onClick={() => {
              togglePathReveal();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-muted transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>{showPathReveal ? "Hide Paths" : "Path Reveal"}</span>
          </button>
        </div>
      )}

      {/* Legend when path reveal is active */}
      {showPathReveal && (
        <div className="mt-3 p-3 bg-muted rounded-lg text-xs space-y-1">
          <p className="font-medium mb-2">Path Legend:</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Clear path</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Tight path</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>Blocked path</span>
          </div>
        </div>
      )}
    </div>
  );
}
