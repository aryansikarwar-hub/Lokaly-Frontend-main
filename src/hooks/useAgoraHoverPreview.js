import { useState, useRef, useCallback, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import api from "../services/api";
import { APP_ID } from "../services/agora";

const HOVER_DELAY_MS = 400;
const NO_HOST_TIMEOUT_MS = 5000;

export function useAgoraHoverPreview({ autoStart = null } = {}) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [noHost, setNoHost] = useState(false);

  const clientRef = useRef(null);
  const containerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const noHostTimerRef = useRef(null);
  const currentChannelRef = useRef(null);

  const cleanup = useCallback(async () => {
    try {
      if (noHostTimerRef.current) {
        clearTimeout(noHostTimerRef.current);
        noHostTimerRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      if (containerRef.current) {
        const players = containerRef.current.querySelectorAll(
          '[id^="agora-preview-"]',
        );
        players.forEach((p) => p.remove());
      }
      currentChannelRef.current = null;
      setIsPreviewing(false);
      setNoHost(false);
    } catch (e) {
      console.error("[AgoraPreview] cleanup error:", e);
    }
  }, []);

  const startPreview = useCallback(
    async ({ channelName }) => {
      if (!channelName) return;
      if (currentChannelRef.current === channelName) return;

      setNoHost(false);

      try {
        await cleanup();

        const { data } = await api.post("/agora/token", {
          channelName,
          role: "subscriber",
        });

        const resolvedAppId = data.appID || data.appId || APP_ID;
        if (!resolvedAppId) {
          console.warn("[AgoraPreview] APP_ID not configured");
          return;
        }

        const client = AgoraRTC.createClient({
          mode: "live",
          codec: "vp8",
          role: "audience",
        });
        clientRef.current = client;
        currentChannelRef.current = channelName;

        client.on("user-published", async (user, mediaType) => {
          // Host aa gaya — timeout cancel karo
          if (noHostTimerRef.current) {
            clearTimeout(noHostTimerRef.current);
            noHostTimerRef.current = null;
          }
          setNoHost(false);

          try {
            await client.subscribe(user, mediaType);
            if (mediaType === "video" && containerRef.current) {
              const playerId = `agora-preview-${user.uid}`;
              const existing = document.getElementById(playerId);
              if (existing) existing.remove();

              const player = document.createElement("div");
              player.id = playerId;
              player.style.width = "100%";
              player.style.height = "100%";
              player.style.position = "absolute";
              player.style.top = "0";
              player.style.left = "0";
              player.style.objectFit = "cover";

              containerRef.current.appendChild(player);
              user.videoTrack.play(player);
              setIsPreviewing(true);
            }
          } catch (err) {
            console.error("[AgoraPreview] subscribe error:", err);
          }
        });

        client.on("user-unpublished", () => {
          setIsPreviewing(false);
        });

        await client.join(
          resolvedAppId,
          channelName,
          data.token,
          data.uid || null,
        );

        // Join ke baad 5 sec mein koi host nahi aaya toh cleanup
        noHostTimerRef.current = setTimeout(() => {
          console.log("[AgoraPreview] No host found, cleaning up");
          setNoHost(true);
          cleanup();
        }, NO_HOST_TIMEOUT_MS);

      } catch (err) {
        console.error("[AgoraPreview] join failed:", err);
        setPreviewError(err);
        setIsPreviewing(false);
      }
    },
    [cleanup],
  );

  const onHoverStart = useCallback(
    (streamData) => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        startPreview(streamData);
      }, HOVER_DELAY_MS);
    },
    [startPreview],
  );

  const onHoverEnd = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!autoStart?.channelName) {
      cleanup();
    }
  }, [cleanup, autoStart]);

  useEffect(() => {
    if (autoStart?.channelName) {
      startPreview({ channelName: autoStart.channelName });
    } else if (currentChannelRef.current) {
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart?.channelName]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      cleanup();
    };
  }, [cleanup]);

  return {
    containerRef,
    isPreviewing,
    previewError,
    noHost,
    onHoverStart,
    onHoverEnd,
  };
}