import type { GeocodingResult } from "../../api/types";

const CITY_PARAMS = [
  "city",
  "cityId",
  "latitude",
  "longitude",
  "region",
  "country",
] as const;
const INVALID_CITY_MESSAGE =
  "The city in this link is invalid. Search for a city to continue.";
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

interface CityUrlState {
  city: GeocodingResult | null;
  error: string | null;
}

export function readCityFromUrl(url: URL): CityUrlState {
  const params = url.searchParams;
  if (!CITY_PARAMS.some((name) => params.has(name))) {
    return { city: null, error: null };
  }

  const name = params.get("city");
  const id = params.get("cityId");
  const latitude = params.get("latitude");
  const longitude = params.get("longitude");

  // URL parameters are untrusted; reject incomplete, duplicate, or invalid locations.
  if (
    CITY_PARAMS.some((key) => params.getAll(key).length > 1) ||
    !name?.trim() ||
    !id ||
    !/^\d+$/.test(id) ||
    !Number.isSafeInteger(Number(id)) ||
    !latitude ||
    !DECIMAL.test(latitude) ||
    !Number.isFinite(Number(latitude)) ||
    Math.abs(Number(latitude)) > 90 ||
    !longitude ||
    !DECIMAL.test(longitude) ||
    !Number.isFinite(Number(longitude)) ||
    Math.abs(Number(longitude)) > 180
  ) {
    return { city: null, error: INVALID_CITY_MESSAGE };
  }

  const city: GeocodingResult = {
    id: Number(id),
    name,
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
  const region = params.get("region");
  const country = params.get("country");
  if (region) city.admin1 = region;
  if (country) city.country = country;
  return { city, error: null };
}

export function urlWithCity(url: URL, city: GeocodingResult): URL {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set("city", city.name);
  nextUrl.searchParams.set("cityId", String(city.id));
  nextUrl.searchParams.set("latitude", String(city.latitude));
  nextUrl.searchParams.set("longitude", String(city.longitude));
  if (city.admin1) {
    nextUrl.searchParams.set("region", city.admin1);
  } else {
    nextUrl.searchParams.delete("region");
  }
  if (city.country) {
    nextUrl.searchParams.set("country", city.country);
  } else {
    nextUrl.searchParams.delete("country");
  }
  return nextUrl;
}
