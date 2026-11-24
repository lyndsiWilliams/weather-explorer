import type {
  ArchiveRequest,
  ArchiveResponse,
  ForecastRequest,
  ForecastResponse,
  GeocodingResponse,
} from "./types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

const CURRENT_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
  "is_day",
];

const HOURLY_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "precipitation_probability",
  "weather_code",
  "wind_speed_10m",
];

const DAILY_VARIABLES = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "sunrise",
  "sunset",
];

const ARCHIVE_DAILY_VARIABLES = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
];

export class OpenMeteoApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "OpenMeteoApiError";
  }
}

async function requestJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    const message =
      response.statusText || `Request failed with status ${response.status}`;
    throw new OpenMeteoApiError(response.status, message);
  }

  const data: unknown = await response.json();
  return data as T;
}

export function searchCities(
  term: string,
  signal: AbortSignal,
): Promise<GeocodingResponse> {
  const params = new URLSearchParams({
    name: term,
    count: "8",
    language: "en",
  });

  return requestJson(`${GEOCODING_URL}?${params}`, signal);
}

export function fetchForecast(
  request: ForecastRequest,
  signal: AbortSignal,
): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude: String(request.latitude),
    longitude: String(request.longitude),
    current: CURRENT_VARIABLES.join(","),
    hourly: HOURLY_VARIABLES.join(","),
    daily: DAILY_VARIABLES.join(","),
    past_days: "30",
    forecast_days: "16",
    timezone: "auto",
    temperature_unit: request.units.temperature,
    wind_speed_unit: request.units.windSpeed,
    precipitation_unit: request.units.precipitation,
  });

  return requestJson(`${FORECAST_URL}?${params}`, signal);
}

export function fetchArchive(
  request: ArchiveRequest,
  signal: AbortSignal,
): Promise<ArchiveResponse> {
  const params = new URLSearchParams({
    latitude: String(request.latitude),
    longitude: String(request.longitude),
    start_date: request.startDate,
    end_date: request.endDate,
    daily: ARCHIVE_DAILY_VARIABLES.join(","),
    timezone: "auto",
    temperature_unit: request.units.temperature,
    wind_speed_unit: request.units.windSpeed,
    precipitation_unit: request.units.precipitation,
  });

  return requestJson(`${ARCHIVE_URL}?${params}`, signal);
}
