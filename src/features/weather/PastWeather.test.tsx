import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ForecastResponse } from "../../api/types";
import { unitSystems } from "../settings/unitSettingsStore";
import { PastWeather } from "./PastWeather";

const forecast: ForecastResponse = {
  timezone: "America/New_York",
  utc_offset_seconds: -14400,
  current: {
    time: "2024-07-12T08:00",
    temperature_2m: 72,
    apparent_temperature: 74,
    relative_humidity_2m: 50,
    precipitation: 0,
    weather_code: 0,
    wind_speed_10m: 5,
    is_day: 1,
  },
  hourly: {
    time: [],
    temperature_2m: [],
    relative_humidity_2m: [],
    precipitation: [],
    precipitation_probability: [],
    weather_code: [],
    wind_speed_10m: [],
  },
  daily: {
    time: ["2024-07-10", "2024-07-11", "2024-07-12", "2024-07-13"],
    weather_code: [0, null, 61, 61],
    temperature_2m_max: [70, null, 75, 75],
    temperature_2m_min: [55, 0, 60, 60],
    precipitation_sum: [0.1, null, 0.1, 0.1],
    precipitation_probability_max: [0, null, 80, 80],
    sunrise: ["", "", "", ""],
    sunset: ["", "", "", ""],
  },
};

describe("PastWeather", () => {
  describe("past weather display", () => {
    it("shows previous days newest first, with missing values and units", () => {
      render(<PastWeather forecast={forecast} units={unitSystems.imperial} />);

      expect(screen.getByText(/historical forecast data/i)).toBeVisible();
      fireEvent.click(screen.getByText("Show past daily weather"));
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(3);
      expect(rows[1]).toHaveTextContent("2024-07-11");
      expect(rows[2]).toHaveTextContent("2024-07-10");
      expect(screen.queryByText("2024-07-12")).not.toBeInTheDocument();
      expect(screen.queryByText("2024-07-13")).not.toBeInTheDocument();
      expect(within(rows[1]).getByText("Unknown conditions")).toBeVisible();
      expect(within(rows[1]).getByText("0 °F")).toBeVisible();
      expect(within(rows[1]).getAllByText("Unavailable")).toHaveLength(2);
      expect(within(rows[2]).getByText("0.1 in")).toBeVisible();
    });

    it("limits the history to the most recent 30 days", () => {
      // Include more than 30 past dates to check the boundary, not just the label.
      const dates = Array.from({ length: 46 }, (_, index) =>
        new Date(Date.UTC(2024, 0, 1 + index)).toISOString().slice(0, 10),
      );
      const manyDays: ForecastResponse = {
        ...forecast,
        current: { ...forecast.current, time: "2024-02-15T08:00" },
        daily: {
          time: dates,
          weather_code: dates.map(() => 0),
          temperature_2m_max: dates.map(() => 10),
          temperature_2m_min: dates.map(() => 0),
          precipitation_sum: dates.map(() => 0),
          precipitation_probability_max: dates.map(() => 0),
          sunrise: dates.map(() => ""),
          sunset: dates.map(() => ""),
        },
      };
      render(<PastWeather forecast={manyDays} units={unitSystems.metric} />);

      fireEvent.click(screen.getByText("Show past daily weather"));
      expect(screen.getAllByRole("row")).toHaveLength(31);
      expect(screen.getByText("2024-02-14")).toBeVisible();
      expect(screen.getByText("2024-01-16")).toBeVisible();
      expect(screen.queryByText("2024-01-15")).not.toBeInTheDocument();
      expect(screen.getAllByText("10 °C")).toHaveLength(30);
      expect(screen.getAllByText("0 mm")).toHaveLength(30);
    });
  });

  it("explains when no past data is available", () => {
    render(
      <PastWeather
        forecast={{
          ...forecast,
          current: { ...forecast.current, time: "2024-07-10T08:00" },
        }}
        units={unitSystems.imperial}
      />,
    );

    expect(screen.getByText("No past weather data available.")).toBeVisible();
    expect(
      screen.queryByText("Show past daily weather"),
    ).not.toBeInTheDocument();
  });
});
