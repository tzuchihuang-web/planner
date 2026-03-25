"use client";

import dynamic from "next/dynamic";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { KeyboardHandler } from "@/components/KeyboardHandler";

// Dynamic import for ApartmentScene to avoid SSR issues with Three.js
const ApartmentScene = dynamic(
  () => import("@/components/3d/ApartmentScene").then((mod) => mod.ApartmentScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-muted-foreground">Loading 3D Scene...</div>
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Keyboard shortcuts */}
      <KeyboardHandler />

      {/* Left sidebar */}
      <ToolPanel />

      {/* Main 3D viewport */}
      <div className="flex-1 relative">
        <ApartmentScene />
      </div>
    </main>
  );
}
