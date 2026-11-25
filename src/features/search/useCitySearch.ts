import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OpenMeteoApiError, searchCities } from "../../api/openMeteo";

const DEBOUNCE_MS = 300;

function useDebouncedTerm(term: string): string {
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedTerm(term), DEBOUNCE_MS);

    // Restart the wait when the term changes, and clean up on unmount.
    return () => clearTimeout(timeout);
  }, [term]);

  return debouncedTerm;
}

export function useCitySearch(term: string) {
  const normalizedTerm = term.trim();
  const debouncedTerm = useDebouncedTerm(normalizedTerm);
  const isDebouncing = normalizedTerm !== debouncedTerm;

  const query = useQuery({
    // A separate cache entry and abort signal belong to each debounced term.
    queryKey: ["geocode", debouncedTerm],
    queryFn: ({ signal }) => searchCities(debouncedTerm, signal),
    enabled: debouncedTerm.length >= 2,
    retry: (failureCount, error) => {
      // Repeating a client error won't fix the request.
      if (
        error instanceof OpenMeteoApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        return false;
      }

      return failureCount < 2;
    },
    // Back off between retries rather than immediately repeating a failed request.
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  return {
    ...query,
    // Hide results for the previous term while the user is still typing.
    results: isDebouncing ? [] : (query.data?.results ?? []),
    isDebouncing,
  };
}
