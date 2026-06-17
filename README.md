# SignBridge

SignBridge is a real-time video communication platform designed to support deaf and hard-of-hearing users through ASL sign recognition, text conversion, speech input, and text-to-sign video playback.

## Features

- Real-time two-person video calling (WebRTC)
- Django Channels WebSocket signaling
- Browser-based MediaPipe hand tracking
- ASL alphabet recognition (A–Y)
- Automatic pause-based word spacing
- Word and sentence builder with manual letter buttons
- Speech-to-text for the hearing participant
- Text-to-sign video playback for spoken messages
- Text-to-speech for received sign messages
- Rule-based NLP sentence cleanup

## Tech Stack

**Frontend:** React, Vite, MediaPipe Tasks Vision, WebRTC  
**Backend:** Django, Django Channels, Daphne  
**ML:** Python, TensorFlow, MediaPipe, OpenCV, NumPy

## How to Run (Demo)

### 1. Backend

```powershell
cd backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

Or use `run_server.bat`.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173` in Chrome or Edge.

### 3. Two-laptop demo (same Wi‑Fi)

On the **host laptop** (runs both servers):

```powershell
# Terminal 1
cd backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

# Terminal 2
cd frontend
npm run dev
```

Find the host LAN IP (e.g. `192.168.1.10`):

```powershell
ipconfig
```

**On the host laptop (same PC):** open `http://localhost:5173` — camera works, no certificate warning.

**On the second laptop:**

1. Edit `frontend/open-second-laptop.bat` and set `HOST_IP` to the host laptop IP.
2. Double-click the `.bat` file — it opens Chrome/Edge in LAN demo mode so the camera works.
3. Do **not** open `https://IP:5173` in a normal browser tab (you will see “Your connection is not private”).

Optional: `npm run dev:https` uses mkcert for trusted HTTPS (first run may ask for Windows admin once).

1. Join the **same room ID** on both laptops.
2. Allow camera + microphone on both.
3. Status should show `Connected to signaling server` then `WebRTC: connected`.

**If video does not connect:** allow Python and Node through Windows Firewall (Private network), and ensure both laptops use the same Wi‑Fi.

### 4. Two-tab demo (same PC)

1. Open two browser tabs.
2. Join the **same room ID** in both.
3. Allow camera and microphone.
4. **Sign user:** sign letters in front of the camera → build words → send sentence.
5. **Hearing user:** use speech input → send speech as text.
6. The deaf user sees **ASL sign videos** for supported spoken words.

## Sign Videos

Place word videos in:

```
frontend/public/signs/Words/
```

Current supported words: hello, yes, no, stop, please, sorry, help, welcome, thank you, goodbye, how are you.

## ML Training (Alphabet Model)

```powershell
cd ml
.\venv\Scripts\python.exe extract_asl_landmarks.py --dataset-dir asl_dataset --output-dir asl_landmarks
.\venv\Scripts\python.exe train_asl_browser_model.py --data-dir asl_landmarks
copy models\asl_browser_model.json ..\frontend\public\models\asl_browser_model.json
copy models\asl_model_info.json ..\frontend\public\models\asl_model_info.json
```

Collect more samples for a letter:

```powershell
.\venv\Scripts\python.exe collect_samples_cv2.py --label A --samples 300 --cooldown 0.8
```

## How It Works

1. Users join the same call room.
2. Django Channels handles WebRTC signaling.
3. MediaPipe detects hand landmarks in the browser.
4. The trained ASL model predicts alphabet signs from landmark points.
5. Detected letters build words and sentences.
6. Sign text is sent to the other caller and spoken aloud (TTS).
7. Speech text is sent to the other caller and shown as ASL sign videos.

## Limitations

- Alphabet model covers A–Y only (J and Z require motion signs).
- Live webcam accuracy depends on lighting and hand position.
- Text-to-sign only works for words with videos in `public/signs/Words/`.
- WebRTC demo works best on the same network (no TURN server yet).

## Future Work

- Add alphabet letter videos for spelling unknown words
- Increase dataset size for all letters
- Add HTTPS and TURN server for production deployment
- Sequence-based models for dynamic signs (J, Z, full words)
