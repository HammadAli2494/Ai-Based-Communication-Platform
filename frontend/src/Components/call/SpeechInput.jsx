export default function SpeechInput({
  isSupported,
  isListening,
  displayTranscript,
  error,
  onToggleListen,
  onSendSpeech,
  onClearDraft,
}) {
  return (
    <section className="speech-input-panel">
      <p className="speech-input-hint">
        For hearing participants: turn your voice into text and send it to the
        deaf/sign user.
      </p>

      {!isSupported ? (
        <p className="speech-input-warning">
          Speech-to-text needs Chrome or Edge (desktop). Use HTTPS or localhost
          for microphone access.
        </p>
      ) : (
        <>
          <div className="speech-input-actions">
            <button
              type="button"
              className={isListening ? "speech-btn-stop" : "speech-btn-start"}
              onClick={onToggleListen}
            >
              {isListening ? "Stop listening" : "Start microphone"}
            </button>
            <button
              type="button"
              className="speech-btn-send"
              onClick={onSendSpeech}
              disabled={!displayTranscript}
            >
              Send speech as text
            </button>
            <button
              type="button"
              className="speech-btn-clear"
              onClick={onClearDraft}
              disabled={!displayTranscript && !isListening}
            >
              Clear
            </button>
          </div>

          <div className="speech-transcript-box">
            <span className="speech-label">Your speech (draft)</span>
            <p
              className={
                displayTranscript ? "speech-draft" : "speech-draft speech-empty"
              }
            >
              {displayTranscript || "Press Start microphone and speak…"}
            </p>
            {isListening ? (
              <span className="speech-listening-badge">Listening…</span>
            ) : null}
          </div>

          {error ? <p className="speech-input-error">{error}</p> : null}
        </>
      )}
    </section>
  );
}
