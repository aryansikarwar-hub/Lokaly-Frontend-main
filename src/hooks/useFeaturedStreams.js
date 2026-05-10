import { useState, useEffect, useCallback } from "react";
import { liveService } from "../services/liveService";

/**
 * Hook to fetch featured streams + auto-refresh every 30s
 * Used by homepage card carousel
 */
export function useFeaturedStreams({
  limit = 8,
  pollInterval = 30000,
} = {}) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStreams = useCallback(async () => {
    try {
      const response = await liveService.getFeatured(limit);
      if (response.success && Array.isArray(response.streams)) {
        setStreams(response.streams);
        setError(null);
      }
    } catch (err) {
      console.error("[useFeaturedStreams] fetch failed:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchStreams();
    const intervalId = setInterval(fetchStreams, pollInterval);
    return () => clearInterval(intervalId);
  }, [fetchStreams, pollInterval]);

  return { streams, loading, error, refetch: fetchStreams };
}