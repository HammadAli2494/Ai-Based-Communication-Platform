import tensorflow as tf


MODEL_PATH = "models/asl_landmark_model.keras"
OUTPUT_PATH = "models/asl_landmark_model.tflite"


def main():
    model = tf.keras.models.load_model(MODEL_PATH)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    tflite_model = converter.convert()

    with open(OUTPUT_PATH, "wb") as file:
        file.write(tflite_model)

    print(f"Saved TFLite model to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()