import { OpenMeteoApiError } from "./openMeteo";

export function shouldRetryRequest(
  failureCount: number,
  error: Error,
): boolean {
  // Repeating a client error won't fix the request.
  if (
    error instanceof OpenMeteoApiError &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false;
  }

  return failureCount < 2;
}

// Back off between retries rather than immediately repeating a failed request.
export function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30_000);
}
