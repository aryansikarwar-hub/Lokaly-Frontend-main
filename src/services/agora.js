import AgoraRTC from "agora-rtc-sdk-ng";

export const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

if (!APP_ID) {
  console.error("❌ Agora APP_ID missing. Check your .env file");
}

export const createClient = () => {
  return AgoraRTC.createClient({
    mode: "live",
    codec: "vp8",
  });
};

export const createTracks = async () => {
  try {
    return await AgoraRTC.createMicrophoneAndCameraTracks();
  } catch (err) {
    console.error("❌ Camera/Mic access error:", err);
    throw err;
  }
};
