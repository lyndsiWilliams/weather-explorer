import { describe, expect, it } from "vitest";
import { getWeatherCondition } from "./weatherCodes";

describe("getWeatherCondition", () => {
  it.each([
    { code: 0, label: "Clear sky", icon: "clear-sky" },
    { code: 1, label: "Mainly clear", icon: "mainly-clear" },
    { code: 2, label: "Partly cloudy", icon: "partly-cloudy" },
    { code: 3, label: "Overcast", icon: "overcast" },
    { code: 45, label: "Fog", icon: "fog" },
    { code: 48, label: "Fog", icon: "fog" },
    { code: 51, label: "Drizzle", icon: "drizzle" },
    { code: 53, label: "Drizzle", icon: "drizzle" },
    { code: 55, label: "Drizzle", icon: "drizzle" },
    { code: 56, label: "Drizzle", icon: "drizzle" },
    { code: 57, label: "Drizzle", icon: "drizzle" },
    { code: 61, label: "Rain", icon: "rain" },
    { code: 63, label: "Rain", icon: "rain" },
    { code: 65, label: "Rain", icon: "rain" },
    { code: 66, label: "Rain", icon: "rain" },
    { code: 67, label: "Rain", icon: "rain" },
    { code: 71, label: "Snow", icon: "snow" },
    { code: 73, label: "Snow", icon: "snow" },
    { code: 75, label: "Snow", icon: "snow" },
    { code: 77, label: "Snow", icon: "snow" },
    { code: 80, label: "Rain showers", icon: "rain-showers" },
    { code: 81, label: "Rain showers", icon: "rain-showers" },
    { code: 82, label: "Rain showers", icon: "rain-showers" },
    { code: 85, label: "Snow showers", icon: "snow-showers" },
    { code: 86, label: "Snow showers", icon: "snow-showers" },
    { code: 95, label: "Thunderstorm", icon: "thunderstorm" },
    { code: 96, label: "Thunderstorm with hail", icon: "thunderstorm-hail" },
    { code: 99, label: "Thunderstorm with hail", icon: "thunderstorm-hail" },
  ])("maps code $code to its condition", ({ code, label, icon }) => {
    expect(getWeatherCondition(code)).toEqual({ label, icon });
  });
  it.each([null, -1, 100])(
    "returns an unknown condition for unsupported code %s",
    (code) => {
      expect(getWeatherCondition(code)).toEqual({
        label: "Unknown conditions",
        icon: "unknown",
      });
    },
  );
});
