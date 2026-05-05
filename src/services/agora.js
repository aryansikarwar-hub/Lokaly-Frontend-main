// src/services/agora.js

import AgoraRTC from "agora-rtc-sdk-ng";

export const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export const createClient = () => {
  return AgoraRTC.createClient({ mode: "live", codec: "vp8" });
};

export const createTracks = async () => {
  const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  return tracks;
};