import argparse
import os

import cv2
import mediapipe as mp
import numpy as np


DATASET_DIR = "asl_dataset"
OUTPUT_DIR = "asl_landmarks"
FEATURE_SIZE = 63


def clean_label(label):
    label = label.strip().upper()

    if len(label) == 2 and label.endswith("S"):
        return label[0]

    label = label.replace("_SAMPLE", "")
    label = label.replace("-SAMPLE", "")
    label = label.replace(" SAMPLE", "")
    label = label.replace("SAMPLE", "")

    label = label.replace("_", "")
    label = label.replace("-", "")
    label = label.replace(" ", "")

    return label


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
    parser = argparse.ArgumentParser(description="Extract hand landmarks from dataset images")
    parser.add_argument(
        "--dataset-dir",
        default=DATASET_DIR,
        help="Folder with one subfolder per class (default: asl_dataset)",
    )
    parser.add_argument(
        "--output-dir",
        default=OUTPUT_DIR,
        help="Where to save x.npy, y.npy, labels.npy",
    )
    args = parser.parse_args()

    dataset_dir = args.dataset_dir
    output_dir = args.output_dir

    if not os.path.exists(dataset_dir):
        print(f"Dataset folder not found: {dataset_dir}")
        print("Collect words first, e.g.:")
        print("  python collect_words.py --word HELLO")
        return

    os.makedirs(output_dir, exist_ok=True)

    mp_hands = mp.solutions.hands

    folder_names = sorted([
        folder
        for folder in os.listdir(dataset_dir)
        if os.path.isdir(os.path.join(dataset_dir, folder))
    ])

    labels = [clean_label(folder) for folder in folder_names]

    print("Detected folders and cleaned labels:")
    for folder_name, label in zip(folder_names, labels):
        print(f"{folder_name} -> {label}")

    x_data = []
    y_data = []

    with mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5,
    ) as hands:
        for label_index, folder_name in enumerate(folder_names):
            label = labels[label_index]
            folder_path = os.path.join(dataset_dir, folder_name)
            image_names = os.listdir(folder_path)

            print(f"Processing {label}: {len(image_names)} images")

            for image_name in image_names:
                image_path = os.path.join(folder_path, image_name)
                image = cv2.imread(image_path)

                if image is None:
                    continue

                rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = hands.process(rgb)

                if not results.multi_hand_landmarks:
                    continue

                features = extract_landmarks(results.multi_hand_landmarks[0])

                if features.shape[0] == FEATURE_SIZE:
                    x_data.append(features)
                    y_data.append(label_index)

    if not x_data:
        print("No landmarks extracted. Check dataset images and folder path.")
        return

    x = np.array(x_data, dtype=np.float32)
    y = np.array(y_data, dtype=np.int64)

    np.save(os.path.join(output_dir, "x.npy"), x)
    np.save(os.path.join(output_dir, "y.npy"), y)
    np.save(os.path.join(output_dir, "labels.npy"), np.array(labels))

    print("Saved landmark dataset:")
    print("x:", x.shape)
    print("y:", y.shape)
    print("labels:", labels)


if __name__ == "__main__":
    main()