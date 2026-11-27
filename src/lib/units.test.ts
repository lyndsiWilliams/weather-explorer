import { describe, expect, it } from "vitest";
import {
  convertPrecipitation,
  convertTemperature,
  convertWindSpeed,
} from "./units";

describe("convertTemperature", () => {
  it("converts in both directions, including negative temperatures", () => {
    expect(convertTemperature(0, "celsius", "fahrenheit")).toBe(32);
    expect(convertTemperature(212, "fahrenheit", "celsius")).toBe(100);
    expect(convertTemperature(-40, "celsius", "fahrenheit")).toBe(-40);
    expect(convertTemperature(1, "fahrenheit", "celsius")).toBeCloseTo(
      -17.2222,
      4,
    );
  });
  it("preserves values in the same unit and missing values", () => {
    expect(convertTemperature(0, "fahrenheit", "fahrenheit")).toBe(0);
    expect(convertTemperature(null, "celsius", "fahrenheit")).toBeNull();
    expect(convertTemperature(null, "celsius", "celsius")).toBeNull();
  });
});

describe("convertWindSpeed", () => {
  it("converts between miles and kilometres per hour", () => {
    expect(convertWindSpeed(10, "mph", "kmh")).toBeCloseTo(16.09344);
    expect(convertWindSpeed(16.09344, "kmh", "mph")).toBeCloseTo(10);
  });
  it("preserves values in the same unit and missing values", () => {
    expect(convertWindSpeed(0, "kmh", "kmh")).toBe(0);
    expect(convertWindSpeed(null, "mph", "kmh")).toBeNull();
    expect(convertWindSpeed(null, "mph", "mph")).toBeNull();
  });
});

describe("convertPrecipitation", () => {
  it("converts between inches and millimetres", () => {
    expect(convertPrecipitation(2, "inch", "mm")).toBeCloseTo(50.8);
    expect(convertPrecipitation(50.8, "mm", "inch")).toBeCloseTo(2);
  });
  it("preserves values in the same unit and missing values", () => {
    expect(convertPrecipitation(0, "mm", "mm")).toBe(0);
    expect(convertPrecipitation(null, "inch", "mm")).toBeNull();
    expect(convertPrecipitation(null, "inch", "inch")).toBeNull();
  });
});
