import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  fetchArchive,
  fetchForecast,
  OpenMeteoApiError,
  searchCities,
} from "./openMeteo";
import type { ArchiveRequest, ForecastRequest, WeatherUnits } from "./types";
import { server } from "../test/server";

const units: WeatherUnits = {
  temperature: "fahrenheit",
  windSpeed: "mph",
  precipitation: "inch",
};

const signal = new AbortController().signal;

describe("searchCities", () => {
  it("requests eight English-language matches and accepts an empty result", async () => {
    server.use(
      http.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        ({ request }) => {
          const url = new URL(request.url);

          expect(url.searchParams.get("name")).toBe("Springfield");
          expect(url.searchParams.get("count")).toBe("8");
          expect(url.searchParams.get("language")).toBe("en");

          return HttpResponse.json({});
        },
      ),
    );

    await expect(searchCities("Springfield", signal)).resolves.toEqual({});
  });
});

describe("fetchForecast", () => {
  it("requests the configured current, hourly, daily, and unit values", async () => {
    const request: ForecastRequest = {
      latitude: 42.36,
      longitude: -71.06,
      units,
    };

    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get("latitude")).toBe("42.36");
        expect(url.searchParams.get("longitude")).toBe("-71.06");
        expect(url.searchParams.get("current")).toBe(
          "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
        );
        expect(url.searchParams.get("hourly")).toBe(
          "temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m",
        );
        expect(url.searchParams.get("daily")).toBe(
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset",
        );
        expect(url.searchParams.get("past_days")).toBe("30");
        expect(url.searchParams.get("forecast_days")).toBe("16");
        expect(url.searchParams.get("timezone")).toBe("auto");
        expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
        expect(url.searchParams.get("wind_speed_unit")).toBe("mph");
        expect(url.searchParams.get("precipitation_unit")).toBe("inch");

        return HttpResponse.json({
          timezone: "America/New_York",
          utc_offset_seconds: -14400,
          current: {},
          hourly: {},
          daily: {},
        });
      }),
    );

    const result = await fetchForecast(request, signal);

    expect(result.timezone).toBe("America/New_York");
    expect(result.utc_offset_seconds).toBe(-14400);
  });
  describe("error paths", () => {
    it("rejects unsuccessful responses with a typed API error", async () => {
      server.use(
        http.get("https://api.open-meteo.com/v1/forecast", () =>
          HttpResponse.json(
            { error: true, reason: "Invalid request" },
            { status: 400, statusText: "Bad Request" },
          ),
        ),
      );

      await expect(
        fetchForecast({ latitude: 0, longitude: 0, units }, signal),
      ).rejects.toMatchObject<Partial<OpenMeteoApiError>>({
        name: "OpenMeteoApiError",
        status: 400,
        message: "Bad Request",
      });
    });
    it("uses the status code when an error response has no status text", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response(null, { status: 500, statusText: "" }),
          ),
      );

      await expect(
        fetchForecast({ latitude: 0, longitude: 0, units }, signal),
      ).rejects.toMatchObject({
        status: 500,
        message: "Request failed with status 500",
      });
    });
  });
});

describe("fetchArchive", () => {
  it("requests daily historical data for the requested date range and units", async () => {
    const request: ArchiveRequest = {
      latitude: 42.36,
      longitude: -71.06,
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      units,
    };

    server.use(
      http.get(
        "https://archive-api.open-meteo.com/v1/archive",
        ({ request }) => {
          const url = new URL(request.url);

          expect(url.searchParams.get("latitude")).toBe("42.36");
          expect(url.searchParams.get("longitude")).toBe("-71.06");
          expect(url.searchParams.get("start_date")).toBe("2020-01-01");
          expect(url.searchParams.get("end_date")).toBe("2020-12-31");
          expect(url.searchParams.get("daily")).toBe(
            "temperature_2m_max,temperature_2m_min,precipitation_sum",
          );
          expect(url.searchParams.get("timezone")).toBe("auto");
          expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
          expect(url.searchParams.get("wind_speed_unit")).toBe("mph");
          expect(url.searchParams.get("precipitation_unit")).toBe("inch");

          return HttpResponse.json({
            timezone: "America/New_York",
            daily: {
              time: ["2020-01-01"],
              temperature_2m_max: [32],
              temperature_2m_min: [21],
              precipitation_sum: [0.2],
            },
          });
        },
      ),
    );

    const result = await fetchArchive(request, signal);

    expect(result.daily.time).toEqual(["2020-01-01"]);
  });
});
