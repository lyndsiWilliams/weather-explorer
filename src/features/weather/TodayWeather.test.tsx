import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import type { ForecastResponse, GeocodingResult } from "../../api/types";
import { createQueryWrapper } from "../../test/queryWrapper";
import { server } from "../../test/server";
import { UnitSettings } from "../settings/UnitSettings";
import { useUnitSettings } from "../settings/unitSettingsStore";
import { TodayWeather } from "./TodayWeather";

const city: GeocodingResult = {
  id: 1,
  name: "Boston",
  admin1: "Massachusetts",
  country: "United States",
  latitude: 42.36,
  longitude: -71.06,
};

const forecast: ForecastResponse = {
  timezone: "America/New_York",
  utc_offset_seconds: -14400,
  current: {
    time: "2024-07-12T08:00",
    temperature_2m: 72,
    apparent_temperature: 74,
    relative_humidity_2m: 50,
    precipitation: 0.1,
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
    time: [],
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    precipitation_sum: [],
    precipitation_probability_max: [],
    sunrise: [],
    sunset: [],
  },
};

describe("TodayWeather", () => {
  beforeEach(() => {
    localStorage.clear();
    useUnitSettings.setState({ unitSystem: "imperial", storageError: null });
  });
  it("requests and displays the selected city's weather in the chosen units", async () => {
    const requests: URL[] = [];
    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        const metric = url.searchParams.get("temperature_unit") === "celsius";
        return HttpResponse.json({
          ...forecast,
          current: {
            ...forecast.current,
            temperature_2m: metric ? 22.2 : 72,
            apparent_temperature: metric ? 23.3 : 74,
            wind_speed_10m: metric ? 8 : 5,
            precipitation: metric ? 2.5 : 0.1,
          },
        });
      }),
    );

    const { rerender } = render(
      <>
        <UnitSettings />
        <TodayWeather city={city} />
      </>,
      { wrapper: createQueryWrapper() },
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading weather...");
    expect(await screen.findByText("72 °F")).toBeInTheDocument();
    expect(screen.getByText("74 °F")).toBeInTheDocument();
    expect(screen.getByText("50 %")).toBeInTheDocument();
    expect(screen.getByText("5 mph")).toBeInTheDocument();
    expect(screen.getByText("0.1 in")).toBeInTheDocument();
    expect(screen.getByText("Clear sky")).toBeInTheDocument();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const observed = new Date("2024-07-12T12:00:00Z");
    const format = (timeZone: string) =>
      new Intl.DateTimeFormat(undefined, {
        timeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(observed);
    expect(screen.getByText(/Observed \(city time\):/)).toHaveTextContent(
      `${format("America/New_York")} (America/New_York)`,
    );
    expect(screen.getByText(/Observed \(your time\):/)).toHaveTextContent(
      `${format(userTimezone)} (${userTimezone})`,
    );
    expect(requests[0]?.searchParams.get("latitude")).toBe("42.36");
    expect(requests[0]?.searchParams.get("longitude")).toBe("-71.06");

    fireEvent.click(screen.getByRole("radio", { name: /metric/i }));
    expect(await screen.findByText("22.2 °C")).toBeInTheDocument();
    expect(screen.getByText("23.3 °C")).toBeInTheDocument();
    expect(screen.getByText("8 km/h")).toBeInTheDocument();
    expect(screen.getByText("2.5 mm")).toBeInTheDocument();
    expect(requests[1]?.searchParams.get("wind_speed_unit")).toBe("kmh");
    expect(requests[1]?.searchParams.get("precipitation_unit")).toBe("mm");

    rerender(
      <>
        <UnitSettings />
        <TodayWeather city={{ ...city, name: "London", latitude: 51.5 }} />
      </>,
    );
    await waitFor(() =>
      expect(requests[2]?.searchParams.get("latitude")).toBe("51.5"),
    );
    expect(
      screen.getByRole("heading", { name: /current weather in london/i }),
    ).toBeInTheDocument();
  });
  it("shows unavailable measurements and unknown conditions", async () => {
    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", () =>
        HttpResponse.json({
          ...forecast,
          current: {
            ...forecast.current,
            temperature_2m: null,
            apparent_temperature: null,
            relative_humidity_2m: null,
            precipitation: null,
            weather_code: null,
            wind_speed_10m: null,
          },
        }),
      ),
    );
    render(<TodayWeather city={city} />, { wrapper: createQueryWrapper() });

    expect(await screen.findByText("Unknown conditions")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable")).toHaveLength(5);
  });
  it("reports when the observation time cannot be displayed", async () => {
    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", () =>
        HttpResponse.json({ ...forecast, utc_offset_seconds: null }),
      ),
    );
    render(<TodayWeather city={city} />, { wrapper: createQueryWrapper() });

    expect(
      await screen.findByText("Observation time unavailable."),
    ).toBeVisible();
  });
  it("updates the daily forecast along with current weather when units change", async () => {
    let requestCount = 0;
    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
        requestCount += 1;
        const metric =
          new URL(request.url).searchParams.get("temperature_unit") ===
          "celsius";
        return HttpResponse.json({
          ...forecast,
          daily: {
            time: ["2024-07-12"],
            weather_code: [61],
            temperature_2m_max: [metric ? 24 : 75],
            temperature_2m_min: [metric ? 15 : 59],
            precipitation_sum: [0],
            precipitation_probability_max: [40],
            sunrise: [""],
            sunset: [""],
          },
        });
      }),
    );
    render(
      <>
        <UnitSettings />
        <TodayWeather city={city} />
      </>,
      { wrapper: createQueryWrapper() },
    );

    expect(await screen.findByText("75 °F")).toBeVisible();
    expect(requestCount).toBe(1);
    fireEvent.click(screen.getByRole("radio", { name: /metric/i }));
    expect(await screen.findByText("24 °C")).toBeVisible();
    expect(requestCount).toBe(2);
  });
  it("shows a request error and lets the user retry", async () => {
    let requestCount = 0;
    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json({ error: true }, { status: 400 })
          : HttpResponse.json(forecast);
      }),
    );
    render(<TodayWeather city={city} />, { wrapper: createQueryWrapper() });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Weather could not be loaded.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("72 °F")).toBeInTheDocument();
    expect(requestCount).toBe(2);
  });
});
