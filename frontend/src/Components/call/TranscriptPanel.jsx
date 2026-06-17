import GuidePanel from "./GuidePanel";
import LiveTextPanel from "./LiveTextPanel";
import MessageLog from "./MessageLog";
import SpeechInput from "./SpeechInput";

export default function TranscriptPanel({
  currentWord,
  sentence,
  spacingStatus,
  messages,
  onRemoveLastLetter,
  onAddSpace,
  onSendSentence,
  onClearSentence,
  speechProps,
}) {
  return (
    <aside className="call-side-panel">
      <LiveTextPanel
        currentWord={currentWord}
        sentence={sentence}
        spacingStatus={spacingStatus}
        onRemoveLastLetter={onRemoveLastLetter}
        onAddSpace={onAddSpace}
        onSendSentence={onSendSentence}
        onClearSentence={onClearSentence}
      />

      <MessageLog messages={messages} />

      <details className="speech-details">
        <summary>Speech input (hearing user)</summary>
        <SpeechInput {...speechProps} />
      </details>

      <details className="guide-details">
        <summary>How to use</summary>
        <GuidePanel />
      </details>
    </aside>
  );
}
