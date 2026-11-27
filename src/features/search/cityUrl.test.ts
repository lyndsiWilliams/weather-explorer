import { describe, expect, it } from "vitest";
import type { GeocodingResult } from "../../api/types";
import { readCityFromUrl, urlWithCity } from "./cityUrl";

const city: GeocodingResult = {
  id: 123,
  name: "São Tomé & Príncipe",
  latitude: 0,
  longitude: 6.7,
  admin1: "São Tomé",
  country: "São Tomé & Príncipe",
};

describe("city URL", () => {
  it("round-trips a city without changing other parameters or the hash", () => {
    const original = new URL("https://example.com/?view=today#weather");
    const url = urlWithCity(original, city);

    expect(readCityFromUrl(url)).toEqual({ city, error: null });
    expect(url.searchParams.get("view")).toBe("today");
    expect(url.hash).toBe("#weather");
    expect(original.searchParams.has("city")).toBe(false);
  });
  it("removes old optional fields when the next city doesn't have them", () => {
    const first = urlWithCity(new URL("https://example.com/"), city);
    const nextCity: GeocodingResult = {
      id: 0,
      name: "Origin",
      latitude: 0,
      longitude: 0,
    };
    const next = urlWithCity(first, nextCity);

    expect(next.searchParams.has("region")).toBe(false);
    expect(next.searchParams.has("country")).toBe(false);
    expect(readCityFromUrl(next)).toEqual({ city: nextCity, error: null });
  });
  it("treats a URL without city parameters as an empty selection", () => {
    expect(readCityFromUrl(new URL("https://example.com/?view=today"))).toEqual(
      {
        city: null,
        error: null,
      },
    );
  });
  it.each([
    ["partial location", "?city=Boston"],
    [
      "duplicate field",
      "?city=Boston&city=London&cityId=1&latitude=1&longitude=1",
    ],
    ["empty name", "?city=%20&cityId=1&latitude=1&longitude=1"],
    ["missing id", "?city=Boston&latitude=1&longitude=1"],
    ["non-numeric id", "?city=Boston&cityId=x&latitude=1&longitude=1"],
    [
      "unsafe id",
      "?city=Boston&cityId=9007199254740992&latitude=1&longitude=1",
    ],
    ["missing latitude", "?city=Boston&cityId=1&longitude=1"],
    ["invalid latitude", "?city=Boston&cityId=1&latitude=x&longitude=1"],
    ["infinite latitude", "?city=Boston&cityId=1&latitude=1e999&longitude=1"],
    ["out-of-range latitude", "?city=Boston&cityId=1&latitude=91&longitude=1"],
    ["missing longitude", "?city=Boston&cityId=1&latitude=1"],
    ["invalid longitude", "?city=Boston&cityId=1&latitude=1&longitude=x"],
    ["infinite longitude", "?city=Boston&cityId=1&latitude=1&longitude=1e999"],
    [
      "out-of-range longitude",
      "?city=Boston&cityId=1&latitude=1&longitude=-181",
    ],
  ])("rejects a URL with %s", (_, search) => {
    expect(readCityFromUrl(new URL(search, "https://example.com/"))).toEqual({
      city: null,
      error: "The city in this link is invalid. Search for a city to continue.",
    });
  });
});
