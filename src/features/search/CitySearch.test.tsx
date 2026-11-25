import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import type { GeocodingResult } from "../../api/types";
import { createQueryWrapper } from "../../test/queryWrapper";
import { server } from "../../test/server";
import { CitySearch } from "./CitySearch";

const cities: GeocodingResult[] = [
  {
    id: 1,
    name: "Springfield",
    admin1: "Illinois",
    country: "United States",
    latitude: 39.8,
    longitude: -89.6,
  },
  {
    id: 2,
    name: "Springfield",
    admin1: "Massachusetts",
    country: "United States",
    latitude: 42.1,
    longitude: -72.6,
  },
];

describe("CitySearch", () => {
  it("renders a labeled combobox", () => {
    render(<CitySearch onSelect={vi.fn()} />, {
      wrapper: createQueryWrapper(),
    });

    expect(
      screen.getByRole("combobox", { name: "Search city" }),
    ).toHaveAttribute("aria-autocomplete", "list");
    expect(
      screen.getByRole("combobox", { name: "Search city" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("supports arrow-key navigation and selecting a result with Enter", async () => {
    const onSelect = vi.fn();
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
        HttpResponse.json({ results: cities }),
      ),
    );

    render(<CitySearch onSelect={onSelect} />, {
      wrapper: createQueryWrapper(),
    });

    const input = screen.getByRole("combobox", { name: "Search city" });
    input.focus();
    fireEvent.change(input, { target: { value: "Springfield" } });

    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", options[0]?.id);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith(cities[0]);
    expect(input).toHaveValue("Springfield, Illinois, United States");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects a result with a pointer click", async () => {
    const onSelect = vi.fn();
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
        HttpResponse.json({ results: cities }),
      ),
    );

    render(<CitySearch onSelect={onSelect} />, {
      wrapper: createQueryWrapper(),
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Search city" }), {
      target: { value: "Springfield" },
    });

    const option = await screen.findByRole("option", {
      name: "Springfield, Illinois, United States",
    });
    fireEvent.mouseDown(option);
    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith(cities[0]);
  });

  it("keeps the active option visible when navigating a scrollable list", async () => {
    const results = [
      ...cities,
      ...cities.map((city) => ({ ...city, id: city.id + 2 })),
    ];
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
        HttpResponse.json({ results }),
      ),
    );

    render(<CitySearch onSelect={vi.fn()} />, {
      wrapper: createQueryWrapper(),
    });

    const input = screen.getByRole("combobox", { name: "Search city" });
    fireEvent.change(input, { target: { value: "Springfield" } });
    const options = await screen.findAllByRole("option");
    const listbox = screen.getByRole("listbox");

    // JSDOM has no layout, so model option positions relative to the scroll offset.
    Object.defineProperty(listbox, "clientHeight", { value: 80 });
    vi.spyOn(listbox, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 200, 80),
    );
    options.forEach((option, index) => {
      vi.spyOn(option, "getBoundingClientRect").mockImplementation(
        () => new DOMRect(0, index * 40 - listbox.scrollTop, 200, 40),
      );
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(listbox.scrollTop).toBe(0);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[2]).toHaveAttribute("aria-selected", "true");
    expect(listbox.scrollTop).toBe(40);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(listbox.scrollTop).toBe(0);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(options[3]).toHaveAttribute("aria-selected", "true");
    expect(listbox.scrollTop).toBe(80);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(listbox.scrollTop).toBe(0);
  });

  it("shows a no-results status and closes it with Escape", async () => {
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
        HttpResponse.json({}),
      ),
    );

    render(<CitySearch onSelect={vi.fn()} />, {
      wrapper: createQueryWrapper(),
    });

    const input = screen.getByRole("combobox", { name: "Search city" });
    input.focus();
    fireEvent.change(input, { target: { value: "Nowhere" } });

    expect(await screen.findByText("No cities found.")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(input).toHaveAttribute("aria-expanded", "false");
    });
    expect(screen.queryByText("No cities found.")).not.toBeInTheDocument();
  });

  it("closes the popup when focus leaves the combobox", async () => {
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
        HttpResponse.json({}),
      ),
    );

    render(<CitySearch onSelect={vi.fn()} />, {
      wrapper: createQueryWrapper(),
    });

    const input = screen.getByRole("combobox", { name: "Search city" });
    input.focus();
    fireEvent.change(input, { target: { value: "Nowhere" } });
    expect(await screen.findByText("No cities found.")).toBeInTheDocument();

    fireEvent.blur(input);

    await waitFor(() => {
      expect(input).toHaveAttribute("aria-expanded", "false");
    });
    expect(screen.queryByText("No cities found.")).not.toBeInTheDocument();
  });

  it("shows an error and retries when requested", async () => {
    let requestCount = 0;
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () => {
        requestCount += 1;
        return HttpResponse.json(
          { error: true, reason: "Invalid request" },
          { status: 400 },
        );
      }),
    );

    render(<CitySearch onSelect={vi.fn()} />, {
      wrapper: createQueryWrapper(),
    });

    const input = screen.getByRole("combobox", { name: "Search city" });
    fireEvent.change(input, {
      target: { value: "Boston" },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "City search failed.",
    );
    const retryButton = screen.getByRole("button", { name: "Retry" });
    input.focus();
    retryButton.focus();
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveFocus();
    fireEvent.click(retryButton);

    await waitFor(() => expect(requestCount).toBe(2));
  });
});
