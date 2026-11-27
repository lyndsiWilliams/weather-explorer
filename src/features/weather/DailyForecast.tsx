import type {
  ForecastResponse,
  NullableNumber,
  TemperatureUnit,
} from "../../api/types";
import { getWeatherCondition } from "../../api/weatherCodes";
import { toDailyRows } from "../../lib/transform";

interface DailyForecastProps {
  forecast: ForecastResponse;
  temperatureUnit: TemperatureUnit;
}

function formatTemperature(
  value: NullableNumber,
  unit: TemperatureUnit,
): string {
  return value === null
    ? "Unavailable"
    : `${value} ${unit === "fahrenheit" ? "°F" : "°C"}`;
}

export function DailyForecast({
  forecast,
  temperatureUnit,
}: DailyForecastProps) {
  // The API includes past days, so start at the observation's city-local date.
  const today = forecast.current.time.slice(0, 10);
  const days = toDailyRows(forecast.daily).filter((day) => day.time >= today);

  return (
    <section
      aria-labelledby="daily-forecast-heading"
      className="mt-6 rounded-md border border-slate-200 bg-white p-5"
    >
      <h2
        className="text-xl font-semibold text-slate-900"
        id="daily-forecast-heading"
      >
        Daily forecast
      </h2>
      {days.length === 0 ? (
        <p className="mt-3 text-slate-600">No daily forecast available.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
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
                  Precipitation chance
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
                    {formatTemperature(day.high, temperatureUnit)}
                  </td>
                  <td className="px-2 py-2">
                    {formatTemperature(day.low, temperatureUnit)}
                  </td>
                  <td className="px-2 py-2">
                    {day.precipitationProbability === null
                      ? "Unavailable"
                      : `${day.precipitationProbability} %`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
