import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OpenMeteoApiError, searchCities } from "../../api/openMeteo";

const DEBOUNCE_MS = 300;

function useDebouncedTerm(term: string): string {
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedTerm(term), DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [term]);

  return debouncedTerm;
}

export function useCitySearch(term: string) {
  const normalizedTerm = term.trim();
  const debouncedTerm = useDebouncedTerm(normalizedTerm);
  const isDebouncing = normalizedTerm !== debouncedTerm;

  const query = useQuery({
    queryKey: ["geocode", debouncedTerm],
    queryFn: ({ signal }) => searchCities(debouncedTerm, signal),
    enabled: debouncedTerm.length >= 2,
    retry: (failureCount, error) => {
      if (
        error instanceof OpenMeteoApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        return false;
      }

      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  return {
    ...query,
    results: isDebouncing ? [] : (query.data?.results ?? []),
    isDebouncing,
  };
}
