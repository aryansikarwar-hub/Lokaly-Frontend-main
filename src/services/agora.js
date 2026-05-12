// src/services/agora.js
//
// Agora SDK is ~1.5MB. We never import it eagerly — every consumer awaits
// loadAgora() so the chunk only ships on routes that actually use it.

export const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

if (!APP_ID) {
  console.error("❌ Agora APP_ID missing. Check your .env file (VITE_AGORA_APP_ID)");
}

let _agoraPromise = null;
export function loadAgora() {
  if (!_agoraPromise) {
    _agoraPromise = import("agora-rtc-sdk-ng").then((m) => m.default || m);
  }
  return _agoraPromise;
}

export const createClient = async () => {
  const AgoraRTC = await loadAgora();
  return AgoraRTC.createClient({
    mode: "live",
    codec: "vp8",
  });
};

export const createTracks = async () => {
  try {
    const AgoraRTC = await loadAgora();
    const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
      // Audio config
      {
        encoderConfig: "music_standard",
      },
      // Video config
      {
        encoderConfig: "720p_2",
      },
    );
    console.log("✅ Camera & Mic tracks created");
    return tracks;
  } catch (err) {
    console.error("❌ Camera/Mic access error:", err);
    if (err.code === "PERMISSION_DENIED") {
      alert("Please allow camera and microphone access to start streaming.");
    }
    throw err;
  }
};
