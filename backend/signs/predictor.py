import base64
import json
import os
import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "psl_sign_model.keras")
LABELS_PATH = os.path.join(BASE_DIR, "models", "label_keys.json")
CONFIDENCE_THRESHOLD = 0.75


model = tf.keras.models.load_model(MODEL_PATH)

with open(LABELS_PATH, "r", encoding="utf-8") as file:
    label_keys = json.load(file)


mp_hands = mp.solutions.hands
hands_detector = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7,
)


def extract_landmarks(results):
    hands = []

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks[:2]:
            points = []
            wrist = hand_landmarks.landmark[0]

            for landmark in hand_landmarks.landmark:
                points.extend([
                    landmark.x - wrist.x,
                    landmark.y - wrist.y,
                    landmark.z - wrist.z,
                ])

            hands.append(points)

    while len(hands) < 2:
        hands.append([0.0] * 63)

    features = np.array(hands[0] + hands[1], dtype=np.float32)

    max_value = np.max(np.abs(features))
    if max_value > 0:
        features = features / max_value

    return features

def landmarks_to_points(results):
    hands = []

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks[:2]:
            points = []

            for landmark in hand_landmarks.landmark:
                points.append({
                    "x": landmark.x,
                    "y": landmark.y,
                })

            hands.append(points)

    return hands    
def predict_from_base64(image_base64):
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    image_bytes = base64.b64decode(image_base64)
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    frame = cv2.flip(frame, 1)

    if frame is None:
        return {
            "sign": "unknown",
            "confidence": 0,
        }

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands_detector.process(rgb)

    if not results.multi_hand_landmarks:
        return {
            "sign": "no_hand",
            "confidence": 0,
        }

    features = extract_landmarks(results)
    prediction = model.predict(np.expand_dims(features, axis=0), verbose=0)[0]

    best_index = int(np.argmax(prediction))
    confidence = float(prediction[best_index])

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "sign": "unknown",
            "confidence": confidence,
        }

    return{
    "sign": label_keys[best_index],
    "confidence": confidence,
    "hands": landmarks_to_points(results),
}