"use client";

import { useStudioStore } from "@/lib/store";
import { SCENARIOS } from "@/lib/scenarios";

export function GoalsPanel() {
  const { scenario, setScenario } = useStudioStore();
  const currentScenario = SCENARIOS[scenario];

  return (
    <div className="space-y-3">
      {/* Scenario selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setScenario("A")}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
            scenario === "A"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Studio A
        </button>
        <button
          onClick={() => setScenario("B")}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
            scenario === "B"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Studio B
        </button>
      </div>

      {/* Goals display */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Goals
        </h3>
        <ul className="space-y-2">
          {currentScenario.goals.map((goal, index) => (
            <li
              key={index}
              className="text-sm text-foreground/90 pl-3 border-l-2 border-primary/30"
            >
              {goal}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
