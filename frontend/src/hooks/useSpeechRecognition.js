import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/** Browser speech-to-text (Web Speech API). Best in Chrome/Edge on HTTPS or localhost. */
export function useSpeechRecognition({
  lang = "en-US",
  continuous = true,
  interimResults = true,
} = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [draftTranscript, setDraftTranscript] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognitionCtor());
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const resetDraft = useCallback(() => {
    setDraftTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionCtor();

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported. Use Chrome or Edge on desktop.",
      );
      return;
    }

    if (recognitionRef.current && isListening) return;

    setError(null);

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event) => {
      let interim = "";
      let finals = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finals += piece;
        } else {
          interim += piece;
        }
      }

      if (finals) {
        setDraftTranscript((prev) => `${prev} ${finals}`.trim());
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed":
          "Microphone blocked. Allow mic access for this site and try again.",
        "no-speech": "No speech detected. Try speaking closer to the microphone.",
        network: "Network error during speech recognition.",
        aborted: "Speech recognition stopped.",
      };
      setError(messages[event.error] || `Speech error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Could not start speech recognition.",
      );
    }
  }, [continuous, interimResults, isListening, lang]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    [],
  );

  const displayTranscript = [draftTranscript, interimTranscript]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    isSupported,
    isListening,
    draftTranscript,
    interimTranscript,
    displayTranscript,
    error,
    start,
    stop,
    toggle,
    resetDraft,
    setDraftTranscript,
  };
}
