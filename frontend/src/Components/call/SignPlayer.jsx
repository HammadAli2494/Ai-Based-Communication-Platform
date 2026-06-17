import { useEffect, useRef, useState } from "react";

export default function SignPlayer({ sourceText, queue, onFinished }) {
  const videoRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    setIndex(0);
    setStatus(queue.length > 0 ? "playing" : "empty");
  }, [sourceText, queue]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || queue.length === 0) return;

    const item = queue[index];
    if (!item) {
      setStatus("done");
      onFinished?.();
      return;
    }

    setStatus("playing");
    video.src = item.src;
    video.load();
    video.play().catch(() => {
      setStatus("error");
    });
  }, [index, queue, onFinished]);

  function handleEnded() {
    if (index + 1 < queue.length) {
      setIndex((prev) => prev + 1);
      return;
    }

    setStatus("done");
    onFinished?.();
  }

  const current = queue[index];
  const hasQueue = queue.length > 0;

  return (
    <section className="sign-player">
      <div className="sign-player-header">
        <h3>Text → Sign</h3>
        <span className="sign-player-progress">
          {sourceText
            ? hasQueue
              ? `${index + 1} / ${queue.length}`
              : "No video"
            : "Waiting"}
        </span>
      </div>

      {sourceText ? (
        <p className="sign-player-word">"{sourceText}"</p>
      ) : (
        <p className="sign-player-idle">Spoken messages play here as ASL videos.</p>
      )}

      {hasQueue ? (
        <>
          <p className="sign-player-label">{current.label}</p>
          <div className="sign-player-media">
            <video ref={videoRef} playsInline muted onEnded={handleEnded} />
          </div>
        </>
      ) : sourceText ? (
        <p className="sign-player-missing">No matching sign video for this message.</p>
      ) : null}

      {status === "error" ? (
        <p className="sign-player-error">Could not play sign video.</p>
      ) : null}
    </section>
  );
}
