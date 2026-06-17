import json
from collections import Counter, deque

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf


MODEL_PATH = "models/asl_landmark_model.keras"
LABELS_PATH = "models/asl_labels.json"
CONFIDENCE_THRESHOLD = 0.75
SMOOTHING_WINDOW = 12
STABLE_COUNT = 7


def extract_landmarks(hand_landmarks):
    wrist = hand_landmarks.landmark[0]
    points = []

    for landmark in hand_landmarks.landmark:
        points.extend([
            landmark.x - wrist.x,
            landmark.y - wrist.y,
            landmark.z - wrist.z,
        ])

    features = np.array(points, dtype=np.float32)

    max_value = np.max(np.abs(features))
    if max_value > 0:
        features = features / max_value

    return features


def main():
    print("Loading ASL model...")
    model = tf.keras.models.load_model(MODEL_PATH)

    with open(LABELS_PATH, "r", encoding="utf-8") as file:
        labels = json.load(file)

    print("Model loaded.")
    print("Labels:", labels)

    recent_predictions = deque(maxlen=SMOOTHING_WINDOW)

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("Camera not opened.")
        return

    with mp_hands.Hands(
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7,
    ) as hands:
        while True:
            success, frame = camera.read()

            if not success:
                print("Frame not received.")
                break

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)

            display_text = "No hand detected"

            if results.multi_hand_landmarks:
                hand_landmarks = results.multi_hand_landmarks[0]

                mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                )

                features = extract_landmarks(hand_landmarks)

                prediction = model.predict(
                    np.expand_dims(features, axis=0),
                    verbose=0,
                )[0]

                best_index = int(np.argmax(prediction))
                confidence = float(prediction[best_index])
                sign = labels[best_index]

                if confidence >= CONFIDENCE_THRESHOLD:
                    recent_predictions.append(sign)

                    most_common_sign, count = Counter(
                        recent_predictions
                    ).most_common(1)[0]

                    if count >= STABLE_COUNT:
                        display_text = f"{most_common_sign} ({confidence:.2f})"
                    else:
                        display_text = "Detecting..."
                else:
                    recent_predictions.clear()
                    display_text = f"Unknown ({confidence:.2f})"
            else:
                recent_predictions.clear()

            cv2.putText(
                frame,
                display_text,
                (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.2,
                (0, 255, 0),
                3,
            )

            cv2.imshow("ASL Live Prediction", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()