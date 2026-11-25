import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

beforeAll(() => {
  // Fail tests that make network requests without a matching mock handler.
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  // Keep DOM, request handlers, globals, and timers isolated between tests.
  cleanup();
  server.resetHandlers();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

afterAll(() => {
  server.close();
});
