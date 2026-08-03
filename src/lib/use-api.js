import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

// Small fetch-based replacement for react-query's useQuery, for simple
// GET-and-display flows. Returns the same shape components previously read
// off useQuery: { data, isLoading, isError, error, refetch }.
export function useApiGet(path, { enabled = true, token } = {}) {
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    apiGet(path, token)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path, enabled, token]);

  useEffect(() => {
    const cancel = refetch();
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, token]);

  return { data, isLoading, isError: !!error, error, refetch };
}
