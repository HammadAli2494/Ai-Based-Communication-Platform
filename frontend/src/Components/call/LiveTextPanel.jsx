export default function LiveTextPanel({
  currentWord,
  sentence,
  spacingStatus,
  onRemoveLastLetter,
  onAddSpace,
  onSendSentence,
  onClearSentence,
}) {
  const sentencePreview = `${sentence} ${currentWord}`.trim();

  return (
    <section className="live-text-panel">
      <div className="live-text-header">
        <h2>Your Message</h2>
        <span className="live-text-hint">Show both hands to send automatically</span>
      </div>

      <div className="live-text-display">
        <p className="live-text-label">Current word</p>
        <p className="live-text-value">{currentWord || "—"}</p>
      </div>

      <div className="live-text-display live-text-sentence">
        <p className="live-text-label">Full message</p>
        <p className="live-text-value">{sentencePreview || "—"}</p>
      </div>

      <p className="live-text-status">{spacingStatus}</p>

      <div className="live-text-actions">
        <button type="button" onClick={onRemoveLastLetter}>
          Undo
        </button>
        <button type="button" onClick={onAddSpace}>
          Space
        </button>
        <button type="button" onClick={onSendSentence}>
          Send
        </button>
        <button type="button" className="btn-muted" onClick={onClearSentence}>
          Clear
        </button>
      </div>
    </section>
  );
}
