import { describe, expect, it, vi } from "vitest";
import { formatObservationTimes } from "./observationTime";

function expectedTime(instant: string, timeZone: string): string {
  return `${new Intl.DateTimeFormat(undefined, {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(instant))} (${timeZone})`;
}

describe("formatObservationTimes", () => {
  it("shows one observation in the city and user's timezones", () => {
    const instant = "2024-07-12T12:00:00Z";
    expect(
      formatObservationTimes(
        "2024-07-12T08:00",
        -14400,
        "America/New_York",
        "Asia/Tokyo",
      ),
    ).toEqual({
      cityTime: expectedTime(instant, "America/New_York"),
      userTime: expectedTime(instant, "Asia/Tokyo"),
    });
  });
  it("distinguishes the repeated hour when daylight saving time ends", () => {
    const first = formatObservationTimes(
      "2024-11-03T01:30",
      -14400,
      "America/New_York",
      "America/Los_Angeles",
    );
    const second = formatObservationTimes(
      "2024-11-03T01:30",
      -18000,
      "America/New_York",
      "America/Los_Angeles",
    );

    expect(first?.userTime).toBe(
      expectedTime("2024-11-03T05:30:00Z", "America/Los_Angeles"),
    );
    expect(second?.userTime).toBe(
      expectedTime("2024-11-03T06:30:00Z", "America/Los_Angeles"),
    );
    expect(first?.cityTime).not.toBe(second?.cityTime);
  });
  describe("error paths", () => {
    it("reports invalid timestamps, offsets, and timezones", () => {
      expect(formatObservationTimes("invalid", 0, "UTC", "UTC")).toBeNull();
      expect(
        formatObservationTimes("2024-07-12T08:00", NaN, "UTC", "UTC"),
      ).toBeNull();
      expect(
        formatObservationTimes("2024-07-12T08:00", 0, "invalid", "UTC"),
      ).toBeNull();
      expect(
        formatObservationTimes("2024-07-12T08:00", 0, "", "UTC"),
      ).toBeNull();
      expect(
        formatObservationTimes("2024-07-12T08:00", 0, "UTC", ""),
      ).toBeNull();
    });
    it("does not hide unexpected formatting errors", () => {
      const format = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
        throw new Error("Unexpected formatting failure");
      });

      expect(() =>
        formatObservationTimes("2024-07-12T08:00", 0, "UTC", "UTC"),
      ).toThrow("Unexpected formatting failure");
      format.mockRestore();
    });
  });
});
