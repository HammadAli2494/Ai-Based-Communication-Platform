import json
import os

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split


DATA_DIR = "asl_landmarks"
MODEL_PATH = "models/asl_browser_model.keras"
REPORT_PATH = "models/asl_evaluation_report.txt"


def main():
    x = np.load(os.path.join(DATA_DIR, "x.npy"))
    y = np.load(os.path.join(DATA_DIR, "y.npy"))
    labels = np.load(os.path.join(DATA_DIR, "labels.npy")).tolist()

    _, x_test, _, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = tf.keras.models.load_model(MODEL_PATH)

    predictions = model.predict(x_test)
    y_pred = np.argmax(predictions, axis=1)

    report = classification_report(
        y_test,
        y_pred,
        target_names=labels,
    )

    matrix = confusion_matrix(y_test, y_pred)

    with open(REPORT_PATH, "w", encoding="utf-8") as file:
        file.write("ASL Model Evaluation Report\n")
        file.write("===========================\n\n")
        file.write(report)
        file.write("\n\nConfusion Matrix:\n")
        file.write(str(matrix))

    print(report)
    print(f"Saved report to {REPORT_PATH}")


if __name__ == "__main__":
    main()