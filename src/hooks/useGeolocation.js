import { useEffect, useState, useCallback, useRef } from 'react';

 
export function useGeolocation({ autoRequest = false } = {}) {
  const [status, setStatus] = useState('idle');
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const request = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return Promise.resolve(null);
    }
    setStatus('prompt');
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lng: pos.coords.longitude, lat: pos.coords.latitude };
          if (mountedRef.current) {
            setCoords(next);
            setAccuracy(pos.coords.accuracy);
            setStatus("granted");
          }
          resolve(next);
        },
        (err) => {
          if (mountedRef.current) {
            setError(err);
            setStatus(err.code === 1 ? "denied" : "error");
          }
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 10 * 60 * 1000,
        },
      );
    });
  }, []);

  useEffect(() => {
    if (autoRequest) request();
  }, [autoRequest, request]);

  // Soft check — skip prompt if already granted previously.
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.permissions) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((res) => {
        if (cancelled) return;
        if (res.state === 'granted' && status === 'idle') request();
        if (res.state === 'denied') setStatus('denied');
      })
      .catch(() => { /* older browsers */ });
    return () => { cancelled = true; };
  }, [request, status]);

  return { status, coords, accuracy, error, request };
}