import { useUnitSettings } from "./unitSettingsStore";

export function UnitSettings() {
  const unitSystem = useUnitSettings((state) => state.unitSystem);
  const setUnitSystem = useUnitSettings((state) => state.setUnitSystem);
  const storageError = useUnitSettings((state) => state.storageError);

  return (
    <fieldset className="mt-6 rounded-md border border-slate-200 bg-white px-4 pb-4">
      <legend className="px-1 text-sm font-medium text-slate-700">Units</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            checked={unitSystem === "imperial"}
            className="accent-sky-700"
            name="unit-system"
            type="radio"
            value="imperial"
            onChange={() => setUnitSystem("imperial")}
          />
          Imperial (&deg;F, mph, in)
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            checked={unitSystem === "metric"}
            className="accent-sky-700"
            name="unit-system"
            type="radio"
            value="metric"
            onChange={() => setUnitSystem("metric")}
          />
          Metric (&deg;C, km/h, mm)
        </label>
      </div>
      {storageError && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {storageError} Your selection will still work until you reload.
        </p>
      )}
    </fieldset>
  );
}
