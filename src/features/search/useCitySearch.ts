import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchCities } from "../../api/openMeteo";
import { retryDelay, shouldRetryRequest } from "../../api/queryRetry";

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
    retry: shouldRetryRequest,
    retryDelay,
  });

  return {
    ...query,
    // Hide results for the previous term while the user is still typing.
    results: isDebouncing ? [] : (query.data?.results ?? []),
    isDebouncing,
  };
}
