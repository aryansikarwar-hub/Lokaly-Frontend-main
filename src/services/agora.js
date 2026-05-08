// src/services/agora.js
import AgoraRTC from "agora-rtc-sdk-ng";

export const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

if (!APP_ID) {
  console.error("❌ Agora APP_ID missing. Check your .env file (VITE_AGORA_APP_ID)");
}

export const createClient = () => {
  return AgoraRTC.createClient({
    mode: "live",
    codec: "vp8",
  });
};

export const createTracks = async () => {
  try {
    const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
      // Audio config
      {
        encoderConfig: "music_standard",
      },
      // Video config
      {
        encoderConfig: "720p_2",
      }
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
