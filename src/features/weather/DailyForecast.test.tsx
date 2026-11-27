import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ForecastResponse } from "../../api/types";
import { DailyForecast } from "./DailyForecast";

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
    time: ["2024-07-11", "2024-07-12", "2024-07-13"],
    weather_code: [0, 61, null],
    temperature_2m_max: [70, 75, null],
    temperature_2m_min: [55, 60, 0],
    precipitation_sum: [0, 0.1, null],
    precipitation_probability_max: [0, 80, null],
    sunrise: ["", "", ""],
    sunset: ["", "", ""],
  },
};

describe("DailyForecast", () => {
  describe("forecast display", () => {
    it("shows future daily data without including past days", () => {
      render(
        <DailyForecast forecast={forecast} temperatureUnit="fahrenheit" />,
      );

      expect(screen.queryByText("2024-07-11")).not.toBeInTheDocument();
      const today = screen.getByRole("row", { name: /2024-07-12/ });
      expect(within(today).getByText("Rain")).toBeInTheDocument();
      expect(within(today).getByText("75 °F")).toBeInTheDocument();
      expect(within(today).getByText("60 °F")).toBeInTheDocument();
      expect(within(today).getByText("80 %")).toBeInTheDocument();

      const tomorrow = screen.getByRole("row", { name: /2024-07-13/ });
      expect(
        within(tomorrow).getByText("Unknown conditions"),
      ).toBeInTheDocument();
      expect(within(tomorrow).getByText("0 °F")).toBeInTheDocument();
      expect(within(tomorrow).getAllByText("Unavailable")).toHaveLength(2);
    });
    it("uses the chosen temperature unit", () => {
      render(<DailyForecast forecast={forecast} temperatureUnit="celsius" />);

      expect(screen.getByText("75 °C")).toBeInTheDocument();
    });
  });

  it("explains when there are no forecast days", () => {
    render(
      <DailyForecast
        forecast={{
          ...forecast,
          current: { ...forecast.current, time: "2024-07-14T08:00" },
        }}
        temperatureUnit="fahrenheit"
      />,
    );

    expect(screen.getByText("No daily forecast available.")).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
