import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CallHeader from "../components/call/CallHeader";
import SignPlayer from "../components/call/SignPlayer";
import TranscriptPanel from "../components/call/TranscriptPanel";
import VideoGrid from "../components/call/VideoGrid";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { normalizeSentence } from "../lib/nlp";
import { getUserMediaErrorMessage } from "../lib/media";
import { getSignalingUrl, ICE_SERVERS } from "../lib/signaling";
import { textToSignQueue } from "../lib/textToSign";

const handConnections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

const CONFIDENCE_THRESHOLD = 0.85;
const STABLE_COUNT = 6;
const SEND_COOLDOWN_MS = 3000;
const AUTO_SPACE_DELAY_MS = 2000;
const MIN_AUTO_SPACE_WORD_LENGTH = 2;
const BOTH_HANDS_HOLD_MS = 1500;

function getVideoCoverTransform(video, displayWidth, displayHeight) {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (!videoWidth || !videoHeight) return null;

  const scale = Math.max(displayWidth / videoWidth, displayHeight / videoHeight);

  return {
    scale,
    offsetX: (displayWidth - videoWidth * scale) / 2,
    offsetY: (displayHeight - videoHeight * scale) / 2,
    videoWidth,
    videoHeight,
  };
}

function mirrorHandForDisplay(hand) {
  return hand.map((point) => ({ ...point, x: 1 - point.x }));
}

function landmarkToCanvas(point, transform) {
  return {
    x: point.x * transform.videoWidth * transform.scale + transform.offsetX,
    y: point.y * transform.videoHeight * transform.scale + transform.offsetY,
  };
}

export default function CallRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const lastHandSeenAtRef = useRef(Date.now());
  const pauseCommittedRef = useRef(false);
  const currentWordRef = useRef("");
  const sentenceRef = useRef("");

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const roleRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const handLandmarkerRef = useRef(null);
  const aslModelRef = useRef(null);
  const labelsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const recentPredictionsRef = useRef([]);
  const lastAcceptedSignRef = useRef("");
  const lastAcceptedTimeRef = useRef(0);
  const bothHandsSinceRef = useRef(0);
  const bothHandsTriggeredRef = useRef(false);

  const [status, setStatus] = useState("Starting...");
  const [handStatus, setHandStatus] = useState("Loading hand detector...");
  const [modelStatus, setModelStatus] = useState("Loading ASL model...");
  const [detectedSign, setDetectedSign] = useState("Waiting for hand...");
  const [currentWord, setCurrentWord] = useState("");
  const [sentence, setSentence] = useState("");
  const [messages, setMessages] = useState([]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [modelInfo, setModelInfo] = useState(null);
  const [spacingStatus, setSpacingStatus] = useState(
    "Sign letters to build a word.",
  );
  const [signPlayback, setSignPlayback] = useState({ text: "", queue: [] });
  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  useEffect(() => {
    sentenceRef.current = sentence;
  }, [sentence]);

  const sendSpokenMessage = useCallback((rawText) => {
    const finalSentence = normalizeSentence(rawText);

    if (!finalSentence) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "sign-text",
          message: finalSentence,
          source: "speech",
        }),
      );
    }

    setMessages((prev) => [...prev, `You (speech): ${finalSentence}`]);
  }, []);

  const speech = useSpeechRecognition({ lang: "en-US", continuous: true });

  const handleSendSpeech = useCallback(() => {
    if (!speech.displayTranscript) return;

    sendSpokenMessage(speech.displayTranscript);
    speech.resetDraft();
    speech.stop();
  }, [sendSpokenMessage, speech]);

  const handleClearSpeechDraft = useCallback(() => {
    speech.resetDraft();
    speech.stop();
  }, [speech]);

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        await setupModels();

        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;

        localStreamRef.current = localStream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        setupPeerConnection(localStream);
        setupWebSocket();
        detectHandsLoop();
      } catch (error) {
        console.error("Start error:", error);
        setStatus(`Camera error: ${getUserMediaErrorMessage(error)}`);
      }
    }

    async function setupModels() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      handLandmarkerRef.current = handLandmarker;
      setHandStatus("Hand detector ready");

      const modelResponse = await fetch("/models/asl_browser_model.json");
      const browserModel = await modelResponse.json();

      aslModelRef.current = browserModel;
      labelsRef.current = browserModel.labels || [];
      setModelStatus("ASL model ready");

      const infoResponse = await fetch("/models/asl_model_info.json");
      const info = await infoResponse.json();
      setModelInfo(info);
    }

    function setupPeerConnection(localStream) {
      const peer = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
      });

      peerRef.current = peer;

      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
      });

      peer.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(() => {});
        }

        setStatus("Remote video connected");
      };

      peer.onicecandidate = (event) => {
        if (
          event.candidate &&
          socketRef.current?.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
            }),
          );
        }
      };

      peer.onconnectionstatechange = () => {
        setStatus(`WebRTC: ${peer.connectionState}`);
      };

      peer.oniceconnectionstatechange = () => {
        if (peer.iceConnectionState === "failed") {
          setStatus("WebRTC failed — check firewall or same Wi‑Fi");
        }
      };
    }

    function setupWebSocket() {
      const socket = new WebSocket(getSignalingUrl(roomId));

      socketRef.current = socket;

      socket.onopen = () => {
        setStatus("Connected to signaling server");
      };

      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const peer = peerRef.current;

        if (!peer) return;

        if (data.type === "room-full") {
          setStatus("Room is full. Use another room ID.");
          return;
        }

        if (data.type === "role") {
          roleRef.current = data.role;
          setStatus(`Joined as ${data.role}`);
          return;
        }

        if (data.type === "peer-ready") {
          if (roleRef.current === "caller") {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: "offer", offer }));
          }

          return;
        }

        if (data.type === "offer") {
          await peer.setRemoteDescription(
            new RTCSessionDescription(data.offer),
          );

          await addPendingCandidates();

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.send(JSON.stringify({ type: "answer", answer }));
          return;
        }

        if (data.type === "answer") {
          await peer.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );

          await addPendingCandidates();
          return;
        }

        if (data.type === "ice-candidate") {
          const candidate = new RTCIceCandidate(data.candidate);

          if (peer.remoteDescription) {
            await peer.addIceCandidate(candidate);
          } else {
            pendingCandidatesRef.current.push(candidate);
          }

          return;
        }

        if (data.type === "peer-left") {
          setStatus("Other user left the call");

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }

          return;
        }

        if (data.type === "sign-text") {
          const fromSpeech = data.source === "speech";
          const label = fromSpeech ? "Other (speech)" : "Other (sign)";
          setMessages((prev) => [...prev, `${label}: ${data.message}`]);

          if (fromSpeech) {
            const queue = textToSignQueue(data.message);
            setSignPlayback({ text: data.message, queue });
          } else {
            speakText(data.message);
          }
        }
      };

      socket.onerror = () => {
        setStatus("WebSocket error");
      };

      socket.onclose = () => {
        setStatus("Signaling disconnected");
      };
    }

    async function addPendingCandidates() {
      const peer = peerRef.current;

      while (pendingCandidatesRef.current.length > 0 && peer) {
        const candidate = pendingCandidatesRef.current.shift();
        await peer.addIceCandidate(candidate);
      }
    }

    start();

    return () => {
      mounted = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      socketRef.current?.close();
      peerRef.current?.close();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [roomId]);

  function toggleCamera() {
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()
      .find((track) => track.kind === "video");

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOn(videoTrack.enabled);
  }

  function detectHandsLoop() {
    const video = localVideoRef.current;
    const canvas = overlayCanvasRef.current;
    const handLandmarker = handLandmarkerRef.current;

    if (!video || !canvas || !handLandmarker || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectHandsLoop);
      return;
    }

    const results = handLandmarker.detectForVideo(video, performance.now());
    const hands = results.landmarks || [];

    drawHandLandmarks(hands);

    if (hands.length >= 2) {
      handleBothHandsSend();
      animationFrameRef.current = requestAnimationFrame(detectHandsLoop);
      return;
    }

    bothHandsSinceRef.current = 0;
    bothHandsTriggeredRef.current = false;

    if (hands.length === 1) {
      lastHandSeenAtRef.current = Date.now();
      pauseCommittedRef.current = false;
      setSpacingStatus("Signing...");
      predictAslSign(hands[0]);
    } else {
      recentPredictionsRef.current = [];
      setDetectedSign("No hand detected");
      handleNoHandPause();
    }

    animationFrameRef.current = requestAnimationFrame(detectHandsLoop);
  }

  function extractFeatures(hand) {
    const mirroredHand = mirrorHandForDisplay(hand);
    const wrist = mirroredHand[0];
    const features = [];

    mirroredHand.forEach((point) => {
      features.push(point.x - wrist.x);
      features.push(point.y - wrist.y);
      features.push(point.z - wrist.z);
    });

    const maxValue = Math.max(...features.map((value) => Math.abs(value)));

    if (maxValue > 0) {
      return features.map((value) => value / maxValue);
    }

    return features;
  }

  function runDenseLayer(input, layer) {
    const output = layer.bias.map((biasValue, outputIndex) => {
      let sum = biasValue;

      for (let inputIndex = 0; inputIndex < input.length; inputIndex += 1) {
        sum += input[inputIndex] * layer.kernel[inputIndex][outputIndex];
      }

      if (layer.activation === "relu") {
        return Math.max(0, sum);
      }

      return sum;
    });

    if (layer.activation === "softmax") {
      const maxValue = Math.max(...output);
      const expValues = output.map((value) => Math.exp(value - maxValue));
      const expSum = expValues.reduce((sum, value) => sum + value, 0);

      return expValues.map((value) => value / expSum);
    }

    return output;
  }

  function predictAslSign(hand) {
    const model = aslModelRef.current;
    const labels = labelsRef.current;

    if (!model || labels.length === 0) return;

    let output = extractFeatures(hand);

    model.layers.forEach((layer) => {
      output = runDenseLayer(output, layer);
    });

    let bestIndex = 0;
    let bestConfidence = output[0];

    for (let i = 1; i < output.length; i += 1) {
      if (output[i] > bestConfidence) {
        bestConfidence = output[i];
        bestIndex = i;
      }
    }

    const sign = labels[bestIndex];

    if (bestConfidence < CONFIDENCE_THRESHOLD) {
      recentPredictionsRef.current = [];
      setDetectedSign(`Unknown (${Math.round(bestConfidence * 100)}%)`);
      return;
    }

    recentPredictionsRef.current.push(sign);

    if (recentPredictionsRef.current.length > STABLE_COUNT) {
      recentPredictionsRef.current.shift();
    }

    const stableCount = recentPredictionsRef.current.filter(
      (item) => item === sign,
    ).length;

    setDetectedSign(`${sign} (${Math.round(bestConfidence * 100)}%)`);

    if (stableCount >= STABLE_COUNT) {
      acceptStableSign(sign);
      recentPredictionsRef.current = [];
    }
  }

  function acceptStableSign(sign) {
    const normalizedSign = sign.toLowerCase();
    const now = Date.now();

    if (
      sign === lastAcceptedSignRef.current &&
      now - lastAcceptedTimeRef.current < SEND_COOLDOWN_MS
    ) {
      return;
    }

    lastAcceptedSignRef.current = sign;
    lastAcceptedTimeRef.current = now;

    if (normalizedSign === "nothing") return;

    if (normalizedSign === "space") {
      commitCurrentWordToSentence();
      return;
    }

    if (normalizedSign === "del" || normalizedSign === "delete") {
      setCurrentWord((prev) => {
        const next = prev.slice(0, -1);
        currentWordRef.current = next;
        return next;
      });
      return;
    }

    setCurrentWord((prev) => {
      const next = prev + sign;
      currentWordRef.current = next;
      return next;
    });
  }

  function clearSignPlayback() {
    setSignPlayback({ text: "", queue: [] });
  }

  function commitCurrentWordToSentence() {
    const trimmedWord = currentWordRef.current.trim().toUpperCase();

    if (!trimmedWord) return;

    setSentence((prevSentence) => {
      const nextSentence = `${prevSentence} ${trimmedWord}`.trim();
      sentenceRef.current = nextSentence;
      return nextSentence;
    });

    setCurrentWord("");
    currentWordRef.current = "";
    lastAcceptedSignRef.current = "";
  }

  function handleNoHandPause() {
    const idleTime = Date.now() - lastHandSeenAtRef.current;

    if (pauseCommittedRef.current) return;

    if (idleTime < AUTO_SPACE_DELAY_MS) {
      const remaining = Math.ceil((AUTO_SPACE_DELAY_MS - idleTime) / 1000);
      setSpacingStatus(`Pause detected. Auto-space in ${remaining}s...`);
      return;
    }

    const word = currentWordRef.current.trim();

    if (word.length < MIN_AUTO_SPACE_WORD_LENGTH) {
      setSpacingStatus("No word to add.");
      pauseCommittedRef.current = true;
      return;
    }

    commitCurrentWordToSentence();
    pauseCommittedRef.current = true;
    setSpacingStatus("Word added automatically.");
  }

  function handleBothHandsSend() {
    lastHandSeenAtRef.current = Date.now();
    pauseCommittedRef.current = false;
    recentPredictionsRef.current = [];

    if (!bothHandsSinceRef.current) {
      bothHandsSinceRef.current = Date.now();
    }

    const elapsed = Date.now() - bothHandsSinceRef.current;
    const remainingMs = BOTH_HANDS_HOLD_MS - elapsed;

    if (remainingMs > 0) {
      const seconds = Math.ceil(remainingMs / 1000);
      setSpacingStatus(`Both hands detected — sending in ${seconds}s...`);
      setDetectedSign("Hold both hands to send");
      return;
    }

    if (bothHandsTriggeredRef.current) {
      setDetectedSign("Message sent");
      return;
    }

    const rawSentence = `${sentenceRef.current} ${currentWordRef.current}`.trim();
    if (!rawSentence) {
      setSpacingStatus("Type a message first, then show both hands.");
      setDetectedSign("Nothing to send");
      return;
    }

    bothHandsTriggeredRef.current = true;
    sendSentence();
    setSpacingStatus("Message sent automatically (both hands).");
    setDetectedSign("Sent!");
  }

  function sendSentence() {
    const rawSentence = `${sentenceRef.current} ${currentWordRef.current}`
      .trim();

    if (!rawSentence) return;

    const finalSentence = normalizeSentence(rawSentence);

    socketRef.current?.send(
      JSON.stringify({
        type: "sign-text",
        message: finalSentence,
        source: "sign",
      }),
    );

    setMessages((prev) => [...prev, `You (sign): ${finalSentence}`]);
    speakText(finalSentence);
    setSentence("");
    setCurrentWord("");
    sentenceRef.current = "";
    currentWordRef.current = "";
    lastAcceptedSignRef.current = "";
  }

  function speakText(text) {
    if (!window.speechSynthesis || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;

    window.speechSynthesis.speak(utterance);
  }

  function removeLastLetter() {
    setCurrentWord((prev) => {
      const next = prev.slice(0, -1);
      currentWordRef.current = next;
      return next;
    });
    lastAcceptedSignRef.current = "";
  }

  function clearSentence() {
    setSentence("");
    setCurrentWord("");
    sentenceRef.current = "";
    currentWordRef.current = "";
    lastAcceptedSignRef.current = "";
  }

  function drawHandLandmarks(hands) {
    const video = localVideoRef.current;
    const canvas = overlayCanvasRef.current;

    if (!video || !canvas) return;

    const rect = video.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const transform = getVideoCoverTransform(video, displayWidth, displayHeight);

    if (!transform) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);

    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, displayWidth, displayHeight);

    hands.forEach((hand) => {
      const mirroredHand = mirrorHandForDisplay(hand);

      context.strokeStyle = "#22c55e";
      context.lineWidth = 3;

      handConnections.forEach(([start, end]) => {
        const startPoint = landmarkToCanvas(mirroredHand[start], transform);
        const endPoint = landmarkToCanvas(mirroredHand[end], transform);

        if (!startPoint || !endPoint) return;

        context.beginPath();
        context.moveTo(startPoint.x, startPoint.y);
        context.lineTo(endPoint.x, endPoint.y);
        context.stroke();
      });

      context.fillStyle = "#ef4444";

      mirroredHand.forEach((point) => {
        const { x, y } = landmarkToCanvas(point, transform);

        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
      });
    });
  }

  function addManualLetter(letter) {
    setCurrentWord((prev) => {
      const next = prev + letter;
      currentWordRef.current = next;
      return next;
    });
  }

  function addSpace() {
    commitCurrentWordToSentence();
  }

  function leaveCall() {
    navigate("/");
  }

  return (
    <main className="call-page">
      <CallHeader
        roomId={roomId}
        status={status}
        handStatus={handStatus}
        modelStatus={modelStatus}
        detectedSign={detectedSign}
        isCameraOn={isCameraOn}
        onToggleCamera={toggleCamera}
        onLeaveCall={leaveCall}
      />

      <div className="call-workspace">
        <div className="call-media-column">
          <VideoGrid
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            overlayCanvasRef={overlayCanvasRef}
          />

          <SignPlayer
            sourceText={signPlayback?.text || ""}
            queue={signPlayback?.queue || []}
            onFinished={clearSignPlayback}
          />
        </div>

        <TranscriptPanel
          currentWord={currentWord}
          sentence={sentence}
          spacingStatus={spacingStatus}
          messages={messages}
          onRemoveLastLetter={removeLastLetter}
          onAddSpace={addSpace}
          onSendSentence={sendSentence}
          onClearSentence={clearSentence}
          speechProps={{
            isSupported: speech.isSupported,
            isListening: speech.isListening,
            displayTranscript: speech.displayTranscript,
            error: speech.error,
            onToggleListen: speech.toggle,
            onSendSpeech: handleSendSpeech,
            onClearDraft: handleClearSpeechDraft,
          }}
        />
      </div>
    </main>
  );
}