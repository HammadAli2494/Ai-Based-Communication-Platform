import argparse
import json
import os

import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight


DATA_DIR = "asl_landmarks"
KERAS_MODEL_PATH = "models/asl_browser_model.keras"
JSON_MODEL_PATH = "models/asl_browser_model.json"


def build_model(input_size, num_classes):
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(input_size,)),
        tf.keras.layers.Dense(256, activation="relu"),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.1),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model


def export_json_model(model, labels):
    layers = []

    for layer in model.layers:
        if isinstance(layer, tf.keras.layers.Dense):
            kernel, bias = layer.get_weights()

            layers.append({
                "kernel": kernel.tolist(),
                "bias": bias.tolist(),
                "activation": layer.activation.__name__,
            })

    with open(JSON_MODEL_PATH, "w", encoding="utf-8") as file:
        json.dump({
            "labels": labels,
            "layers": layers,
        }, file)

    print(f"Saved browser model to {JSON_MODEL_PATH}")


def main():
    parser = argparse.ArgumentParser(description="Train ASL landmark model and export browser JSON")
    parser.add_argument(
        "--data-dir",
        default=DATA_DIR,
        help="Folder with x.npy, y.npy, labels.npy (default: asl_landmarks)",
    )
    args = parser.parse_args()
    data_dir = args.data_dir

    os.makedirs("models", exist_ok=True)

    x = np.load(os.path.join(data_dir, "x.npy"))
    y = np.load(os.path.join(data_dir, "y.npy"))
    labels = np.load(os.path.join(data_dir, "labels.npy")).tolist()

    print(f"Training classes ({len(labels)}): {labels}")
    print(f"Samples: {x.shape[0]}")

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    class_weights = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(y_train),
        y=y_train,
    )
    class_weight_dict = {
        int(class_id): float(weight)
        for class_id, weight in zip(np.unique(y_train), class_weights)
    }

    model = build_model(x.shape[1], len(labels))

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=12,
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-5,
        ),
    ]

    model.fit(
        x_train,
        y_train,
        validation_data=(x_test, y_test),
        epochs=80,
        batch_size=32,
        class_weight=class_weight_dict,
        callbacks=callbacks,
    )

    loss, accuracy = model.evaluate(x_test, y_test)
    print(f"Test accuracy: {accuracy:.4f}")

    model.save(KERAS_MODEL_PATH)
    export_json_model(model, labels)

    info_path = "models/asl_model_info.json"
    with open(info_path, "w", encoding="utf-8") as file:
        json.dump(
            {
                "num_classes": len(labels),
                "labels": labels,
                "accuracy": float(accuracy),
                "samples": int(x.shape[0]),
                "type": "alphabet",
            },
            file,
            indent=2,
        )
    print(f"Saved model info to {info_path}")


if __name__ == "__main__":
    main()