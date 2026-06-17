/** WebSocket URL for Django Channels signaling. */
export function getSignalingUrl(roomId) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  if (import.meta.env.DEV) {
    return `${protocol}//${window.location.host}/ws/call/${roomId}/`;
  }

  return `${protocol}//${window.location.hostname}:8000/ws/call/${roomId}/`;
}

export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];
