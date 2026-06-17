import json
import os

import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split


DATA_DIR = "asl_landmarks"
MODEL_PATH = "models/asl_landmark_model.keras"
LABELS_PATH = "models/asl_labels.json"


def build_model(input_size, num_classes):
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(input_size,)),
        tf.keras.layers.Dense(256, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.35),

        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.25),

        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.15),

        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model


def main():
    os.makedirs("models", exist_ok=True)

    x = np.load(os.path.join(DATA_DIR, "x.npy"))
    y = np.load(os.path.join(DATA_DIR, "y.npy"))
    labels = np.load(os.path.join(DATA_DIR, "labels.npy")).tolist()

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = build_model(
        input_size=x.shape[1],
        num_classes=len(labels),
    )

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=8,
            restore_best_weights=True,
        )
    ]

    model.fit(
        x_train,
        y_train,
        validation_data=(x_test, y_test),
        epochs=50,
        batch_size=64,
        callbacks=callbacks,
    )

    loss, accuracy = model.evaluate(x_test, y_test)
    print(f"Test accuracy: {accuracy:.4f}")

    model.save(MODEL_PATH)

    with open(LABELS_PATH, "w", encoding="utf-8") as file:
        json.dump(labels, file, indent=2)

    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved labels to {LABELS_PATH}")


if __name__ == "__main__":
    main()