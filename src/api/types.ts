export type TemperatureUnit = "fahrenheit" | "celsius";
export type WindSpeedUnit = "mph" | "kmh";
export type PrecipitationUnit = "inch" | "mm";

export interface WeatherUnits {
  temperature: TemperatureUnit;
  windSpeed: WindSpeedUnit;
  precipitation: PrecipitationUnit;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface ForecastRequest extends LocationCoordinates {
  units: WeatherUnits;
}

export interface ArchiveRequest extends ForecastRequest {
  startDate: string;
  endDate: string;
}

export interface GeocodingResult extends LocationCoordinates {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

type NullableNumber = number | null;

export interface CurrentWeather {
  time: string;
  temperature_2m: NullableNumber;
  relative_humidity_2m: NullableNumber;
  apparent_temperature: NullableNumber;
  precipitation: NullableNumber;
  weather_code: NullableNumber;
  wind_speed_10m: NullableNumber;
  is_day: NullableNumber;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: NullableNumber[];
  relative_humidity_2m: NullableNumber[];
  precipitation: NullableNumber[];
  precipitation_probability: NullableNumber[];
  weather_code: NullableNumber[];
  wind_speed_10m: NullableNumber[];
}

export interface DailyForecast {
  time: string[];
  weather_code: NullableNumber[];
  temperature_2m_max: NullableNumber[];
  temperature_2m_min: NullableNumber[];
  precipitation_sum: NullableNumber[];
  precipitation_probability_max: NullableNumber[];
  sunrise: string[];
  sunset: string[];
}

export interface ForecastResponse {
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
}

export interface ArchiveDailyData {
  time: string[];
  temperature_2m_max: NullableNumber[];
  temperature_2m_min: NullableNumber[];
  precipitation_sum: NullableNumber[];
}

export interface ArchiveResponse {
  timezone: string;
  daily: ArchiveDailyData;
}
