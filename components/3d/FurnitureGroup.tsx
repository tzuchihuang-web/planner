"use client";

import { useStudioStore } from "@/lib/store";
import { FurnitureItem } from "./FurnitureItem";

export function FurnitureGroup() {
  const furniture = useStudioStore((state) => state.furniture);

  return (
    <group>
      {furniture.map((item) => (
        <FurnitureItem key={item.id} furniture={item} />
      ))}
    </group>
  );
}
