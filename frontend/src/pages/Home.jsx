import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isSecureMediaContext } from "../lib/media";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const host = window.location.hostname;
  const onLanHttp = host !== "localhost" && host !== "127.0.0.1" && window.location.protocol === "http:";

  function joinRoom(event) {
    event.preventDefault();

    if (!roomId.trim()) return;

    navigate(`/call/${roomId.trim()}`);
  }

  return (
    <main className="home-page">
      <section className="hero-card">
        <div className="hero-content">
          <p className="eyebrow">Final Year Project</p>

          <h1>SignBridge</h1>

          <p className="hero-text">
            Real-time video communication with ASL sign recognition, hand
            tracking, and live text conversation.
          </p>

          <form className="join-form" onSubmit={joinRoom}>
            <input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
            />

            <button type="submit">Join Call</button>
          </form>

          <div className="connection-guide">
            <h3>How to open (no certificate warning)</h3>
            <ul>
              <li>
                <strong>Same laptop (recommended):</strong> use{" "}
                <code>http://localhost:5173</code>
              </li>
              <li>
                <strong>Host + second laptop:</strong> run backend and{" "}
                <code>npm run dev</code> on the host, then on the second laptop
                edit and run <code>frontend/open-second-laptop.bat</code>
              </li>
              <li>
                <strong>Do not use</strong> a normal browser tab with{" "}
                <code>https://IP:5173</code> unless you run{" "}
                <code>npm run dev:https</code> and trust the mkcert certificate
              </li>
            </ul>
            {onLanHttp && !isSecureMediaContext() ? (
              <p className="connection-warning">
                You opened <code>{window.location.href}</code>. Camera may be
                blocked. Use <code>open-second-laptop.bat</code> or{" "}
                <code>localhost</code> on the host PC.
              </p>
            ) : null}
          </div>
        </div>

        <div className="hero-panel">
          <div className="status-pill">WebRTC</div>
          <div className="status-pill">ASL Detection</div>
          <div className="status-pill">MediaPipe</div>
          <div className="status-pill">Django Channels</div>
        </div>
      </section>
    </main>
  );
}
