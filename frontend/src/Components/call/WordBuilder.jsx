export default function WordBuilder({
  currentWord,
  sentence,
  spacingStatus,
  onRemoveLastLetter,
  onAddSpace,
  onSpeakPreview,
  onSendSentence,
  onClearSentence,
}) {
  const sentencePreview = `${sentence} ${currentWord}`.trim();

  return (
    <div className="word-builder">
      <p>Current Word: {currentWord || "-"}</p>
      <p>Sentence: {sentencePreview || "-"}</p>
      <p>Spacing: {spacingStatus}</p>

      <div className="word-builder-actions">
        <button onClick={onRemoveLastLetter}>Remove Last Letter</button>
        <button onClick={onAddSpace}>Add Space</button>
        <button onClick={() => onSpeakPreview(sentencePreview)}>
          Speak Preview
        </button>
        <button onClick={onSendSentence}>Send Sentence</button>
        <button onClick={onClearSentence}>Clear</button>
      </div>
    </div>
  );
}