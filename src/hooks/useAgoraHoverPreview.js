import { useState, useRef, useCallback, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import api from "../services/api";
import { APP_ID } from "../services/agora";

const HOVER_DELAY_MS = 400;

/**
 * Hook: starts Agora preview on hover, cleans up on leave
 * Cost-optimized: only joins channel when user actually hovers
 */
export function useAgoraHoverPreview() {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const clientRef = useRef(null);
  const containerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const currentChannelRef = useRef(null);

  const cleanup = useCallback(async () => {
    try {
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
    } catch (e) {
      console.error("[AgoraPreview] cleanup error:", e);
    }
  }, []);

  const startPreview = useCallback(
    async ({ channelName }) => {
      if (!channelName) return;
      if (currentChannelRef.current === channelName) return;

      try {
        await cleanup();

        // Get token from backend
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

        // Subscribe to remote stream
        client.on("user-published", async (user, mediaType) => {
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
            // We DO NOT play audio — preview is muted by design
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
    cleanup();
  }, [cleanup]);

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
    onHoverStart,
    onHoverEnd,
  };
}