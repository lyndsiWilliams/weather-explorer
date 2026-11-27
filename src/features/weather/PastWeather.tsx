import type { ForecastResponse, WeatherUnits } from "../../api/types";
import { getWeatherCondition } from "../../api/weatherCodes";
import { toDailyRows } from "../../lib/transform";
import { formatWeatherValue } from "./formatWeatherValue";

interface PastWeatherProps {
  forecast: ForecastResponse;
  units: WeatherUnits;
}

export function PastWeather({ forecast, units }: PastWeatherProps) {
  const today = forecast.current.time.slice(0, 10);
  // Exclude the incomplete current day and show the most recent dates first.
  const days = toDailyRows(forecast.daily)
    .filter((day) => day.time < today)
    .slice(-30)
    .reverse();
  const temperatureUnit = units.temperature === "fahrenheit" ? "°F" : "°C";
  const precipitationUnit = units.precipitation === "inch" ? "in" : "mm";

  return (
    <section
      aria-labelledby="past-weather-heading"
      className="mt-6 rounded-md border border-slate-200 bg-white p-5"
    >
      <h2
        className="text-xl font-semibold text-slate-900"
        id="past-weather-heading"
      >
        Past 30 days
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Historical forecast data, not observed measurements.
      </p>
      {days.length === 0 ? (
        <p className="mt-3 text-slate-600">No past weather data available.</p>
      ) : (
        <details className="mt-4">
          <summary className="cursor-pointer font-medium text-sky-800 focus-visible:outline-2 focus-visible:outline-sky-700">
            Show past daily weather
          </summary>
          <div
            aria-label="Past daily weather table"
            className="mt-3 overflow-x-auto"
            role="region"
            tabIndex={0}
          >
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th scope="col" className="px-2 py-2">
                    Date
                  </th>
                  <th scope="col" className="px-2 py-2">
                    Conditions
                  </th>
                  <th scope="col" className="px-2 py-2">
                    High
                  </th>
                  <th scope="col" className="px-2 py-2">
                    Low
                  </th>
                  <th scope="col" className="px-2 py-2">
                    Precipitation
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr className="border-b border-slate-100" key={day.time}>
                    <th scope="row" className="px-2 py-2 font-medium">
                      <time dateTime={day.time}>{day.time}</time>
                    </th>
                    <td className="px-2 py-2">
                      {getWeatherCondition(day.weatherCode).label}
                    </td>
                    <td className="px-2 py-2">
                      {formatWeatherValue(day.high, temperatureUnit)}
                    </td>
                    <td className="px-2 py-2">
                      {formatWeatherValue(day.low, temperatureUnit)}
                    </td>
                    <td className="px-2 py-2">
                      {formatWeatherValue(day.precipitation, precipitationUnit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
