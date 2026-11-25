interface ObservationTimes {
  cityTime: string;
  userTime: string;
}

export function formatObservationTimes(
  localTime: string,
  utcOffsetSeconds: number,
  cityTimezone: string,
  userTimezone: string,
): ObservationTimes | null {
  // Open-Meteo's ISO timestamp uses the response's fixed UTC offset.
  const timestamp = Date.parse(`${localTime}Z`) - utcOffsetSeconds * 1000;
  if (
    !cityTimezone ||
    !userTimezone ||
    !Number.isFinite(utcOffsetSeconds) ||
    !Number.isFinite(timestamp)
  ) {
    return null;
  }

  const instant = new Date(timestamp);
  const format = (timezone: string) =>
    `${new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(instant)} (${timezone})`;

  try {
    // Both displays use the same instant, with DST handled by the browser.
    return { cityTime: format(cityTimezone), userTime: format(userTimezone) };
  } catch (error) {
    if (error instanceof RangeError) {
      return null;
    }
    throw error;
  }
}
