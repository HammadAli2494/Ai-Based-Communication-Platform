import argparse
import os

import cv2
import mediapipe as mp
import numpy as np


DATA_DIR = "data"
FEATURE_SIZE = 126


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", required=True, help="Sign label, example: hello")
    parser.add_argument("--samples", type=int, default=100)
    args = parser.parse_args()

    os.makedirs(DATA_DIR, exist_ok=True)

    output_path = os.path.join(DATA_DIR, f"{args.label}.npy")
    collected = []

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    camera = cv2.VideoCapture(0)

    with mp_hands.Hands(
        max_num_hands=2,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7,
    ) as hands:
        while camera.isOpened():
            success, frame = camera.read()

            if not success:
                print("Camera not found.")
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(
                        frame,
                        hand_landmarks,
                        mp_hands.HAND_CONNECTIONS,
                    )

            cv2.putText(
                frame,
                f"Label: {args.label}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )

            cv2.putText(
                frame,
                f"Samples: {len(collected)}/{args.samples}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )

            cv2.putText(
                frame,
                "Press SPACE to capture, Q to quit",
                (20, 120),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2,
            )

            cv2.imshow("PSL Data Collection", frame)

            key = cv2.waitKey(1) & 0xFF

            if key == ord(" "):
                features = extract_landmarks(results)

                if features.shape[0] == FEATURE_SIZE:
                    collected.append(features)
                    print(f"Captured {len(collected)}/{args.samples}")

            if key == ord("q"):
                break

            if len(collected) >= args.samples:
                break

    camera.release()
    cv2.destroyAllWindows()

    if collected:
        collected_array = np.array(collected, dtype=np.float32)

        if os.path.exists(output_path):
            old_data = np.load(output_path)
            collected_array = np.concatenate([old_data, collected_array], axis=0)

        np.save(output_path, collected_array)
        print(f"Saved {collected_array.shape[0]} samples to {output_path}")
    else:
        print("No samples collected.")


if __name__ == "__main__":
    main()