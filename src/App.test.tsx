import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import App from "./App";
import { createQueryWrapper } from "./test/queryWrapper";
import { server } from "./test/server";

describe("App", () => {
  it("renders the dashboard heading and introduction", () => {
    render(<App />, { wrapper: createQueryWrapper() });

    expect(
      screen.getByRole("heading", { level: 1, name: "Weather Explorer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The weather dashboard is coming together."),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Search city" })).toBeVisible();
  });

  it("shows the selected city after a search result is chosen", async () => {
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
        HttpResponse.json({
          results: [
            {
              id: 1,
              name: "Boston",
              latitude: 42.36,
              longitude: -71.06,
              country: "United States",
            },
          ],
        }),
      ),
      http.get("https://api.open-meteo.com/v1/forecast", () =>
        HttpResponse.json({
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
          hourly: {},
          daily: {},
        }),
      ),
    );

    render(<App />, { wrapper: createQueryWrapper() });

    const input = screen.getByRole("combobox", { name: "Search city" });
    fireEvent.change(input, { target: { value: "Boston" } });
    await screen.findByRole("option", {
      name: "Boston, United States",
    });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Current weather in Boston, United States",
        }),
      ).toBeInTheDocument(),
    );
    expect(await screen.findByText("Clear sky")).toBeInTheDocument();
  });
});
