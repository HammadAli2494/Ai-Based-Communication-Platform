import tensorflow as tf
import tf2onnx


MODEL_PATH = "models/asl_landmark_model.keras"
OUTPUT_PATH = "models/asl_landmark_model.onnx"


def main():
    model = tf.keras.models.load_model(MODEL_PATH)

    input_signature = [
        tf.TensorSpec(
            shape=(None, 63),
            dtype=tf.float32,
            name="landmarks",
        )
    ]

    tf2onnx.convert.from_keras(
        model,
        input_signature=input_signature,
        output_path=OUTPUT_PATH,
    )

    print(f"Saved ONNX model to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()