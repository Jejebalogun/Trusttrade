/**
 * useApi Hook
 * 
 * Provides a simple way to fetch data from the TrustTrade API with
 * loading and error states.
 * 
 * Example:
 * const { data, loading, error } = useApi(
 *   () => apiClient.getActiveTrades(),
 *   [],
 *   { refetchInterval: 30000 }
 * );
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseApiOptions {
  skip?: boolean;
  refetchInterval?: number;
  onError?: (error: Error) => void;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (options.skip) return;

    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, options]);

  useEffect(() => {
    if (options.skip) return;

    let isMounted = true;
    let interval: NodeJS.Timeout;

    const executeEffect = async () => {
      await fetchData();
    };

    executeEffect();

    // Set up refetch interval if specified
    if (options.refetchInterval && options.refetchInterval > 0) {
      interval = setInterval(executeEffect, options.refetchInterval);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

/**
 * useAsyncData Hook
 * 
 * Similar to useApi but with support for manual triggering and abort.
 */
export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> & { execute: () => Promise<T> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
      const result = await fetcher(controller.signal);
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        options.onError?.(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetcher, options]);

  useEffect(() => {
    if (options.skip) return;

    let isMounted = true;
    let interval: NodeJS.Timeout;

    const executeEffect = async () => {
      await execute();
    };

    executeEffect();

    if (options.refetchInterval && options.refetchInterval > 0) {
      interval = setInterval(executeEffect, options.refetchInterval);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, dependencies);

  return { data, loading, error, refetch: execute as any, execute };
}
