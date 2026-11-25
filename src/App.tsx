import { useEffect, useState } from "react";
import type { GeocodingResult } from "./api/types";
import { CitySearch } from "./features/search/CitySearch";
import { readCityFromUrl, urlWithCity } from "./features/search/cityUrl";
import { UnitSettings } from "./features/settings/UnitSettings";
import { TodayWeather } from "./features/weather/TodayWeather";

function App() {
  const [location, setLocation] = useState(() =>
    readCityFromUrl(new URL(window.location.href)),
  );

  useEffect(() => {
    // pushState doesn't fire popstate; back and forward do.
    function handleNavigation() {
      setLocation(readCityFromUrl(new URL(window.location.href)));
    }
    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  function selectCity(city: GeocodingResult) {
    const url = urlWithCity(new URL(window.location.href), city);
    try {
      if (url.href !== window.location.href) {
        window.history.pushState(null, "", url);
      }
      setLocation({ city, error: null });
    } catch (error) {
      console.error("Could not update the city URL:", error);
      setLocation({
        city,
        error: "The city could not be saved in the address bar.",
      });
    }
  }

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
            <CitySearch onSelect={selectCity} selectedCity={location.city} />
          </div>
        </header>
        <UnitSettings />
        {location.error && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {location.error}
          </p>
        )}
        {location.city && <TodayWeather city={location.city} />}
      </div>
    </main>
  );
}

export default App;
