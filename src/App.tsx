import { useState } from "react";
import type { GeocodingResult } from "./api/types";
import { CitySearch } from "./features/search/CitySearch";
import { UnitSettings } from "./features/settings/UnitSettings";

function App() {
  const [selectedCity, setSelectedCity] = useState<GeocodingResult | null>(
    null,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Weather Explorer</h1>
            <p className="mt-3 text-slate-600">
              The weather dashboard is coming together.
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <CitySearch onSelect={setSelectedCity} />
          </div>
        </header>
        <UnitSettings />
        {selectedCity && (
          <p className="mt-6 text-sm text-slate-700" role="status">
            Selected city: {selectedCity.name}
          </p>
        )}
      </div>
    </main>
  );
}

export default App;
