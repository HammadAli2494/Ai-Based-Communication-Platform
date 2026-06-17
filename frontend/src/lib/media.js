export function isSecureMediaContext() {
  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function getUserMediaErrorMessage(error) {
  const name = error?.name || "";
  const message = error?.message || "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera/microphone blocked. Click the lock icon in the address bar and allow access.";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera or microphone found on this device.";
  }

  if (
    name === "SecurityError" ||
    name === "NotSupportedError" ||
    message.toLowerCase().includes("secure") ||
    !isSecureMediaContext()
  ) {
    const host = window.location.hostname;
    return `Camera blocked on http://${host}:5173. On this PC use http://localhost:5173. On another laptop run frontend/open-second-laptop.bat (set host IP first) or use npm run dev:https on the host.`;
  }

  return message || name || "Could not access camera/microphone.";
}
