import { describe, expect, it } from "vitest";
import type { DailyForecast, HourlyForecast } from "../api/types";
import { toDailyRows, toHourlyRows } from "./transform";

describe("toHourlyRows", () => {
  it("maps parallel arrays into rows and preserves nulls and local time strings", () => {
    const hourly: HourlyForecast = {
      time: ["2024-07-12T08:00", "2024-07-12T09:00"],
      temperature_2m: [72, null],
      relative_humidity_2m: [50, null],
      precipitation: [0, 0.2],
      precipitation_probability: [0, null],
      weather_code: [0, 61],
      wind_speed_10m: [3.2, null],
    };

    expect(toHourlyRows(hourly)).toEqual([
      {
        time: "2024-07-12T08:00",
        temperature: 72,
        humidity: 50,
        precipitation: 0,
        precipitationProbability: 0,
        weatherCode: 0,
        windSpeed: 3.2,
      },
      {
        time: "2024-07-12T09:00",
        temperature: null,
        humidity: null,
        precipitation: 0.2,
        precipitationProbability: null,
        weatherCode: 61,
        windSpeed: null,
      },
    ]);
  });
  it("returns no rows when the time array is empty", () => {
    const hourly: HourlyForecast = {
      time: [],
      temperature_2m: [],
      relative_humidity_2m: [],
      precipitation: [],
      precipitation_probability: [],
      weather_code: [],
      wind_speed_10m: [],
    };

    expect(toHourlyRows(hourly)).toEqual([]);
  });
});

describe("toDailyRows", () => {
  it("maps parallel arrays into daily rows and preserves nulls", () => {
    const daily: DailyForecast = {
      time: ["2024-07-12", "2024-07-13"],
      weather_code: [0, null],
      temperature_2m_max: [82, null],
      temperature_2m_min: [61, 58],
      precipitation_sum: [0.1, null],
      precipitation_probability_max: [20, null],
      sunrise: ["2024-07-12T05:30", "2024-07-13T05:31"],
      sunset: ["2024-07-12T20:20", "2024-07-13T20:19"],
    };

    expect(toDailyRows(daily)).toEqual([
      {
        time: "2024-07-12",
        weatherCode: 0,
        high: 82,
        low: 61,
        precipitation: 0.1,
        precipitationProbability: 20,
        sunrise: "2024-07-12T05:30",
        sunset: "2024-07-12T20:20",
      },
      {
        time: "2024-07-13",
        weatherCode: null,
        high: null,
        low: 58,
        precipitation: null,
        precipitationProbability: null,
        sunrise: "2024-07-13T05:31",
        sunset: "2024-07-13T20:19",
      },
    ]);
  });
  it("returns no rows when the time array is empty", () => {
    const daily: DailyForecast = {
      time: [],
      weather_code: [],
      temperature_2m_max: [],
      temperature_2m_min: [],
      precipitation_sum: [],
      precipitation_probability_max: [],
      sunrise: [],
      sunset: [],
    };

    expect(toDailyRows(daily)).toEqual([]);
  });
});
