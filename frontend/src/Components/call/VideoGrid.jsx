export default function VideoGrid({
  localVideoRef,
  remoteVideoRef,
  overlayCanvasRef,
}) {
  return (
    <section className="video-grid">
      <div className="video-card">
        <h2>Your Camera</h2>

        <div className="video-wrapper">
          <video
            ref={localVideoRef}
            className="local-video"
            autoPlay
            muted
            playsInline
          />
          <canvas ref={overlayCanvasRef} className="overlay-canvas" />
        </div>
      </div>

      <div className="video-card">
        <h2>Other Person</h2>

        <div className="video-wrapper">
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
          />
        </div>
      </div>
    </section>
  );
}