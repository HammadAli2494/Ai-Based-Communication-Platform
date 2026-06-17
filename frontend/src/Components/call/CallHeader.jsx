export default function CallHeader({
  roomId,
  status,
  handStatus,
  modelStatus,
  detectedSign,
  isCameraOn,
  onToggleCamera,
  onLeaveCall,
}) {
  return (
    <header className="call-header">
      <div className="call-header-main">
        <h1>SignBridge</h1>
        <span className="call-header-room">Room {roomId}</span>
      </div>

      <div className="call-header-status">
        <span className="status-chip">{status}</span>
        <span className="status-chip">{handStatus}</span>
        <span className="status-chip">{modelStatus}</span>
        <span className="status-chip status-chip-detect">{detectedSign}</span>
      </div>

      <div className="call-actions">
        <button type="button" onClick={onToggleCamera} className="secondary">
          {isCameraOn ? "Camera Off" : "Camera On"}
        </button>
        <button type="button" onClick={onLeaveCall} className="danger">
          Leave
        </button>
      </div>
    </header>
  );
}
