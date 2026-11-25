import { create } from "zustand";
import type { WeatherUnits } from "../../api/types";

type UnitSystem = "imperial" | "metric";

export const unitSystems = {
  imperial: {
    temperature: "fahrenheit",
    windSpeed: "mph",
    precipitation: "inch",
  },
  metric: {
    temperature: "celsius",
    windSpeed: "kmh",
    precipitation: "mm",
  },
} satisfies Record<UnitSystem, WeatherUnits>;

const STORAGE_KEY = "weather-explorer-units";
const STORAGE_ERROR = "Unit preferences could not be saved or restored.";

interface UnitSettings {
  unitSystem: UnitSystem;
  storageError: string | null;
  setUnitSystem: (unitSystem: UnitSystem) => void;
}

function readUnitSystem(): Pick<UnitSettings, "unitSystem" | "storageError"> {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null || stored === "imperial") {
      return { unitSystem: "imperial", storageError: null };
    }
    if (stored === "metric") {
      return { unitSystem: stored, storageError: null };
    }
    throw new Error("Unrecognized saved unit preference");
  } catch (error) {
    // Keep settings usable in memory if browser storage is unavailable or invalid.
    console.error("Could not restore unit preferences:", error);
    return { unitSystem: "imperial", storageError: STORAGE_ERROR };
  }
}

export function createUnitSettingsStore() {
  return create<UnitSettings>((set) => ({
    ...readUnitSystem(),
    setUnitSystem: (unitSystem) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, unitSystem);
        set({ unitSystem, storageError: null });
      } catch (error) {
        console.error("Could not save unit preferences:", error);
        set({ unitSystem, storageError: STORAGE_ERROR });
      }
    },
  }));
}

// One shared store keeps settings consistent across the dashboard.
export const useUnitSettings = createUnitSettingsStore();
