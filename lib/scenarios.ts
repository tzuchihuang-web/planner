import type { ScenarioConfig } from "./types";

export const SCENARIOS: Record<string, ScenarioConfig> = {
  A: {
    id: "A",
    label: "Studio A",
    goals: [
      "You work from home at a desk. You need a comfortable workspace.",
      "You sometimes have a group of friends visit. Several people should be able to move around comfortably.",
    ],
  },
  B: {
    id: "B",
    label: "Studio B",
    goals: [
      "You often walk from bed to bathroom at night. The path should be easy and unobstructed.",
      "You move between your desk and shelves multiple times during the day. The circulation between these areas should feel smooth.",
    ],
  },
};
