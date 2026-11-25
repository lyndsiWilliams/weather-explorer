import type {
  DailyForecast,
  HourlyForecast,
  NullableNumber,
} from "../api/types";

export interface HourlyRow {
  time: string;
  temperature: NullableNumber;
  humidity: NullableNumber;
  precipitation: NullableNumber;
  precipitationProbability: NullableNumber;
  weatherCode: NullableNumber;
  windSpeed: NullableNumber;
}

export interface DailyRow {
  time: string;
  weatherCode: NullableNumber;
  high: NullableNumber;
  low: NullableNumber;
  precipitation: NullableNumber;
  precipitationProbability: NullableNumber;
  sunrise: string;
  sunset: string;
}

export function toHourlyRows(hourly: HourlyForecast): HourlyRow[] {
  // Open-Meteo returns parallel arrays; group values by timestamp for the UI.
  return hourly.time.map((time, index) => ({
    time,
    temperature: hourly.temperature_2m[index],
    humidity: hourly.relative_humidity_2m[index],
    precipitation: hourly.precipitation[index],
    precipitationProbability: hourly.precipitation_probability[index],
    weatherCode: hourly.weather_code[index],
    windSpeed: hourly.wind_speed_10m[index],
  }));
}

export function toDailyRows(daily: DailyForecast): DailyRow[] {
  // The daily arrays use the same index-based alignment as hourly data.
  return daily.time.map((time, index) => ({
    time,
    weatherCode: daily.weather_code[index],
    high: daily.temperature_2m_max[index],
    low: daily.temperature_2m_min[index],
    precipitation: daily.precipitation_sum[index],
    precipitationProbability: daily.precipitation_probability_max[index],
    sunrise: daily.sunrise[index],
    sunset: daily.sunset[index],
  }));
}
