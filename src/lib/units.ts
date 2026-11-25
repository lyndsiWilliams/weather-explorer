import type {
  NullableNumber,
  PrecipitationUnit,
  TemperatureUnit,
  WindSpeedUnit,
} from "../api/types";

export function convertTemperature(
  value: NullableNumber,
  from: TemperatureUnit,
  to: TemperatureUnit,
): NullableNumber {
  if (value === null || from === to) {
    return value;
  }

  // Temperature conversion needs an offset as well as a scaling factor.
  return from === "celsius" ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
}

export function convertWindSpeed(
  value: NullableNumber,
  from: WindSpeedUnit,
  to: WindSpeedUnit,
): NullableNumber {
  if (value === null || from === to) {
    return value;
  }

  // One mile is exactly 1.609344 kilometres.
  return from === "mph" ? value * 1.609344 : value / 1.609344;
}

export function convertPrecipitation(
  value: NullableNumber,
  from: PrecipitationUnit,
  to: PrecipitationUnit,
): NullableNumber {
  if (value === null || from === to) {
    return value;
  }

  // One inch is exactly 25.4 millimetres.
  return from === "inch" ? value * 25.4 : value / 25.4;
}
