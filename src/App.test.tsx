import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { createQueryWrapper } from "./test/queryWrapper";
import { server } from "./test/server";

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });
  describe("successful navigation", () => {
    it("renders the dashboard heading and introduction", () => {
      render(<App />, { wrapper: createQueryWrapper() });

      expect(
        screen.getByRole("heading", { level: 1, name: "Weather Explorer" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("The weather dashboard is coming together."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: "Search city" }),
      ).toBeVisible();
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
            daily: { time: [] },
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
      expect(new URL(window.location.href).searchParams.get("city")).toBe(
        "Boston",
      );

      // Choosing the same city again shouldn't add a duplicate history entry.
      const pushState = vi.spyOn(window.history, "pushState");
      fireEvent.change(input, { target: { value: "Boston" } });
      fireEvent.click(
        await screen.findByRole("option", { name: "Boston, United States" }),
      );
      expect(pushState).not.toHaveBeenCalled();
      pushState.mockRestore();
    });
    it("restores a shared city and follows browser back and forward", async () => {
      const cityUrl =
        "/?city=Boston&cityId=1&latitude=42.36&longitude=-71.06&country=United+States";
      window.history.replaceState(null, "", "/?view=today#weather");
      window.history.pushState(null, "", cityUrl);
      server.use(
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
            daily: { time: [] },
          }),
        ),
      );

      render(<App />, { wrapper: createQueryWrapper() });
      const input = screen.getByRole("combobox", { name: "Search city" });
      expect(input).toHaveValue("Boston, United States");
      expect(await screen.findByText("Clear sky")).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "New" } });
      window.history.back();
      await waitFor(() => expect(input).toHaveValue(""));
      expect(screen.queryByText("Clear sky")).not.toBeInTheDocument();
      expect(window.location.hash).toBe("#weather");

      window.history.forward();
      await waitFor(() => expect(input).toHaveValue("Boston, United States"));
      expect(await screen.findByText("Clear sky")).toBeInTheDocument();
    });
  });

  describe("error paths", () => {
    it("reports invalid city links without requesting weather", () => {
      window.history.replaceState(null, "", "/?city=Boston");
      render(<App />, { wrapper: createQueryWrapper() });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "The city in this link is invalid.",
      );
      expect(screen.getByRole("combobox", { name: "Search city" })).toHaveValue(
        "",
      );
      expect(
        screen.queryByRole("region", { name: /current weather/i }),
      ).toBeNull();
    });
    it("keeps the selection usable if updating the address bar fails", async () => {
      const logError = vi.spyOn(console, "error").mockImplementation(() => {});
      const pushState = vi
        .spyOn(window.history, "pushState")
        .mockImplementation(() => {
          throw new Error("History unavailable");
        });
      server.use(
        http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
          HttpResponse.json({
            results: [{ id: 1, name: "Boston", latitude: 42, longitude: -71 }],
          }),
        ),
        http.get("https://api.open-meteo.com/v1/forecast", () =>
          HttpResponse.json({
            timezone: "UTC",
            utc_offset_seconds: 0,
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
            daily: { time: [] },
          }),
        ),
      );
      render(<App />, { wrapper: createQueryWrapper() });
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Boston" },
      });
      fireEvent.click(await screen.findByRole("option", { name: "Boston" }));

      expect(screen.getByRole("alert")).toHaveTextContent(
        "The city could not be saved in the address bar.",
      );
      expect(await screen.findByText("Clear sky")).toBeInTheDocument();
      expect(logError).toHaveBeenCalled();
      pushState.mockRestore();
      logError.mockRestore();
    });
  });
});
