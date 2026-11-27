import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnitSettings } from "./UnitSettings";
import {
  createUnitSettingsStore,
  unitSystems,
  useUnitSettings,
} from "./unitSettingsStore";

describe("unit settings", () => {
  beforeEach(() => {
    localStorage.clear();
    useUnitSettings.setState({ unitSystem: "imperial", storageError: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });
  it("updates the shared units and restores the choice from storage", () => {
    render(<UnitSettings />);

    expect(screen.getByRole("radio", { name: /imperial/i })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /metric/i }));

    expect(screen.getByRole("radio", { name: /metric/i })).toBeChecked();
    expect(unitSystems[useUnitSettings.getState().unitSystem]).toEqual({
      temperature: "celsius",
      windSpeed: "kmh",
      precipitation: "mm",
    });
    expect(createUnitSettingsStore().getState().unitSystem).toBe("metric");

    fireEvent.click(screen.getByRole("radio", { name: /imperial/i }));
    expect(unitSystems[useUnitSettings.getState().unitSystem]).toEqual({
      temperature: "fahrenheit",
      windSpeed: "mph",
      precipitation: "inch",
    });
    expect(createUnitSettingsStore().getState().unitSystem).toBe("imperial");
  });
  describe("storage error paths", () => {
    it("warns about invalid saved preferences rather than trusting them", () => {
      localStorage.setItem("weather-explorer-units", "invalid");
      const logError = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = createUnitSettingsStore();

      expect(store.getState().unitSystem).toBe("imperial");
      expect(store.getState().storageError).not.toBeNull();
      expect(logError).toHaveBeenCalled();
    });
    it("reports storage read failures and remains usable", () => {
      const logError = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

      const store = createUnitSettingsStore();

      expect(store.getState().unitSystem).toBe("imperial");
      expect(store.getState().storageError).not.toBeNull();
      expect(logError).toHaveBeenCalled();
    });
    it("reports save failures while keeping the selection, and clears the warning on recovery", () => {
      const logError = vi.spyOn(console, "error").mockImplementation(() => {});
      const save = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage unavailable");
        });
      render(<UnitSettings />);

      fireEvent.click(screen.getByRole("radio", { name: /metric/i }));

      expect(screen.getByRole("radio", { name: /metric/i })).toBeChecked();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unit preferences could not be saved or restored.",
      );
      expect(logError).toHaveBeenCalled();

      save.mockRestore();
      fireEvent.click(screen.getByRole("radio", { name: /imperial/i }));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(createUnitSettingsStore().getState().unitSystem).toBe("imperial");
    });
  });
});
