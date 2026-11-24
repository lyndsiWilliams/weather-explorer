import type { NullableNumber } from "./types";

export type WeatherIconName =
  | "clear-sky"
  | "mainly-clear"
  | "partly-cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "rain-showers"
  | "snow-showers"
  | "thunderstorm"
  | "thunderstorm-hail"
  | "unknown";

export interface WeatherCondition {
  label: string;
  icon: WeatherIconName;
}

// Map each valid WMO code explicitly; several codes share a display condition.
const WEATHER_CONDITIONS: Partial<Record<number, WeatherCondition>> = {
  0: { label: "Clear sky", icon: "clear-sky" },
  1: { label: "Mainly clear", icon: "mainly-clear" },
  2: { label: "Partly cloudy", icon: "partly-cloudy" },
  3: { label: "Overcast", icon: "overcast" },
  45: { label: "Fog", icon: "fog" },
  48: { label: "Fog", icon: "fog" },
  51: { label: "Drizzle", icon: "drizzle" },
  53: { label: "Drizzle", icon: "drizzle" },
  55: { label: "Drizzle", icon: "drizzle" },
  56: { label: "Drizzle", icon: "drizzle" },
  57: { label: "Drizzle", icon: "drizzle" },
  61: { label: "Rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Rain", icon: "rain" },
  66: { label: "Rain", icon: "rain" },
  67: { label: "Rain", icon: "rain" },
  71: { label: "Snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Snow", icon: "snow" },
  77: { label: "Snow", icon: "snow" },
  80: { label: "Rain showers", icon: "rain-showers" },
  81: { label: "Rain showers", icon: "rain-showers" },
  82: { label: "Rain showers", icon: "rain-showers" },
  85: { label: "Snow showers", icon: "snow-showers" },
  86: { label: "Snow showers", icon: "snow-showers" },
  95: { label: "Thunderstorm", icon: "thunderstorm" },
  96: { label: "Thunderstorm with hail", icon: "thunderstorm-hail" },
  99: { label: "Thunderstorm with hail", icon: "thunderstorm-hail" },
};

const UNKNOWN_CONDITION: WeatherCondition = {
  label: "Unknown conditions",
  icon: "unknown",
};

export function getWeatherCondition(code: NullableNumber): WeatherCondition {
  return code === null
    ? UNKNOWN_CONDITION
    : (WEATHER_CONDITIONS[code] ?? UNKNOWN_CONDITION);
}
