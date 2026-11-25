import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../test/server";
import { useCitySearch } from "./useCitySearch";

function createWrapper() {
  // Isolate the query cache; the hook's explicit retry policy still applies.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

async function advanceTimersBy(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

describe("useCitySearch", () => {
  it("waits 300 ms before requesting results", async () => {
    vi.useFakeTimers();
    let requestCount = 0;

    server.use(
      http.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        ({ request }) => {
          requestCount += 1;
          expect(new URL(request.url).searchParams.get("name")).toBe("Boston");

          return HttpResponse.json({
            results: [
              {
                id: 1,
                name: "Boston",
                latitude: 42.36,
                longitude: -71.06,
              },
            ],
          });
        },
      ),
    );

    const { result } = renderHook(() => useCitySearch("Boston"), {
      wrapper: createWrapper(),
    });

    await advanceTimersBy(299);
    expect(requestCount).toBe(0);
    expect(result.current.isDebouncing).toBe(true);

    await advanceTimersBy(1);
    expect(requestCount).toBe(1);
    expect(result.current.isDebouncing).toBe(false);
  });

  it("returns matching cities after the search completes", async () => {
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
        HttpResponse.json({
          results: [
            {
              id: 1,
              name: "Boston",
              latitude: 42.36,
              longitude: -71.06,
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useCitySearch("Boston"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.results).toHaveLength(1));
    expect(result.current.results[0]?.name).toBe("Boston");
  });

  it("returns an empty result list when the API omits results", async () => {
    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () =>
        HttpResponse.json({}),
      ),
    );

    const { result } = renderHook(() => useCitySearch("Nowhere"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isDebouncing).toBe(false));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.results).toEqual([]);
  });

  it("does not request results for a term shorter than two characters", async () => {
    let requestCount = 0;

    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () => {
        requestCount += 1;
        return HttpResponse.json({});
      }),
    );

    const { result } = renderHook(() => useCitySearch("B"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isDebouncing).toBe(false));

    expect(requestCount).toBe(0);
  });

  it("cancels the request when the debounced term becomes too short", async () => {
    let requestSignal: AbortSignal | undefined;

    server.use(
      http.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        ({ request }) => {
          requestSignal = request.signal;
          // Keep the request pending so the test can observe its cancellation.
          return new Promise<Response>(() => {});
        },
      ),
    );

    const { result, rerender } = renderHook(
      ({ term }: { term: string }) => useCitySearch(term),
      {
        initialProps: { term: "Boston" },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(requestSignal).toBeDefined());

    rerender({ term: "B" });
    await waitFor(() => expect(result.current.isDebouncing).toBe(false));

    expect(requestSignal?.aborted).toBe(true);
  });

  it("does not retry a client error", async () => {
    let requestCount = 0;

    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () => {
        requestCount += 1;
        return HttpResponse.json(
          { error: true, reason: "Invalid request" },
          { status: 400 },
        );
      }),
    );

    const { result } = renderHook(() => useCitySearch("Boston"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(requestCount).toBe(1);
  });

  it("retries a server error twice", async () => {
    let requestCount = 0;

    server.use(
      http.get("https://geocoding-api.open-meteo.com/v1/search", () => {
        requestCount += 1;
        return HttpResponse.json(
          { error: true, reason: "Server error" },
          { status: 500 },
        );
      }),
    );

    const { result } = renderHook(() => useCitySearch("Boston"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    expect(requestCount).toBe(3);
  });
});
