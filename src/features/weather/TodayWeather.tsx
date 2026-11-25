import { useQuery } from "@tanstack/react-query";
import { fetchForecast } from "../../api/openMeteo";
import { retryDelay, shouldRetryRequest } from "../../api/queryRetry";
import type { GeocodingResult, NullableNumber } from "../../api/types";
import { getWeatherCondition } from "../../api/weatherCodes";
import { formatObservationTimes } from "../../lib/observationTime";
import { unitSystems, useUnitSettings } from "../settings/unitSettingsStore";

interface TodayWeatherProps {
  city: GeocodingResult;
}

function formatValue(value: NullableNumber, unit: string): string {
  return value === null ? "Unavailable" : `${value} ${unit}`;
}

export function TodayWeather({ city }: TodayWeatherProps) {
  const unitSystem = useUnitSettings((state) => state.unitSystem);
  const units = unitSystems[unitSystem];
  const { data, isPending, isError, refetch } = useQuery({
    // Location and units are part of the cache key so changing either refetches.
    queryKey: ["forecast", city.latitude, city.longitude, units],
    queryFn: ({ signal }) =>
      fetchForecast(
        { latitude: city.latitude, longitude: city.longitude, units },
        signal,
      ),
    retry: shouldRetryRequest,
    retryDelay,
  });

  const cityLabel = [city.name, city.admin1, city.country]
    .filter(Boolean)
    .join(", ");
  const observationTimes = data
    ? formatObservationTimes(
        data.current.time,
        data.utc_offset_seconds,
        data.timezone,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      )
    : null;

  return (
    <section
      aria-labelledby="today-weather-heading"
      className="mt-6 rounded-md border border-slate-200 bg-white p-5"
    >
      <h2
        className="text-xl font-semibold text-slate-900"
        id="today-weather-heading"
      >
        Current weather in {cityLabel}
      </h2>
      {isPending ? (
        <p className="mt-3 text-slate-600" role="status">
          Loading weather...
        </p>
      ) : isError ? (
        <div className="mt-3">
          <p className="text-red-700" role="alert">
            Weather could not be loaded.
          </p>
          <button
            className="mt-2 rounded px-2 py-1 text-sm font-medium text-sky-800 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-700"
            type="button"
            onClick={() => {
              void refetch();
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-slate-600">
            {getWeatherCondition(data.current.weather_code).label}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-slate-600">Temperature</dt>
              <dd className="font-semibold">
                {formatValue(
                  data.current.temperature_2m,
                  unitSystem === "imperial" ? "°F" : "°C",
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Feels like</dt>
              <dd className="font-semibold">
                {formatValue(
                  data.current.apparent_temperature,
                  unitSystem === "imperial" ? "°F" : "°C",
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Humidity</dt>
              <dd className="font-semibold">
                {formatValue(data.current.relative_humidity_2m, "%")}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Wind speed</dt>
              <dd className="font-semibold">
                {formatValue(
                  data.current.wind_speed_10m,
                  unitSystem === "imperial" ? "mph" : "km/h",
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Precipitation</dt>
              <dd className="font-semibold">
                {formatValue(
                  data.current.precipitation,
                  unitSystem === "imperial" ? "in" : "mm",
                )}
              </dd>
            </div>
          </dl>
          {observationTimes ? (
            <div className="mt-4 text-sm text-slate-600">
              <p>Observed (city time): {observationTimes.cityTime}</p>
              <p>Observed (your time): {observationTimes.userTime}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-red-700" role="status">
              Observation time unavailable.
            </p>
          )}
        </>
      )}
    </section>
  );
}
