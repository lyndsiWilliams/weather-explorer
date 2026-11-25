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
    );

    render(<App />, { wrapper: createQueryWrapper() });

    const input = screen.getByRole("combobox", { name: "Search city" });
    fireEvent.change(input, { target: { value: "Boston" } });
    await screen.findByRole("option", {
      name: "Boston, United States",
    });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Selected city: Boston",
      );
    });
  });
});
