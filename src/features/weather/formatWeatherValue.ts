import type { NullableNumber } from "../../api/types";

export function formatWeatherValue(
  value: NullableNumber,
  unit: string,
): string {
  return value === null ? "Unavailable" : `${value} ${unit}`;
}
