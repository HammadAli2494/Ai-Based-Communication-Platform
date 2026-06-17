import argparse
import os
import time

import cv2

DATASET_DIR = "asl_dataset"
DEFAULT_SAMPLES = 250
DEFAULT_COOLDOWN_SEC = 0.8

def main():
    parser = argparse.ArgumentParser(description="Collect ASL images from webcam")
    parser.add_argument("--label", required=True, help="Sign label, e.g. A, S, L, D")
    parser.add_argument("--samples", type=int, default=DEFAULT_SAMPLES)
    parser.add_argument("--camera", type=int, default=0)
    parser.add_argument("--dataset-dir", default=DATASET_DIR)
    parser.add_argument(
        "--cooldown",
        type=float,
        default=DEFAULT_COOLDOWN_SEC,
        help="Minimum seconds between captures (default: 0.8)",
    )
    args = parser.parse_args()

    label = args.label.strip().upper()
    output_dir = os.path.join(args.dataset_dir, label)
    os.makedirs(output_dir, exist_ok=True)

    existing = len(
        [
            name
            for name in os.listdir(output_dir)
            if name.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
    )

    camera = cv2.VideoCapture(args.camera)

    if not camera.isOpened():
        print("Camera not opened.")
        print("Close Chrome/Edge call tabs, then try --camera 1")
        return

    print(f"Collecting sign: {label}")
    print(f"Saving to: {output_dir}")
    print(f"Target samples: {args.samples}")
    print(f"Already in folder: {existing}")
    print()
    cooldown_sec = max(args.cooldown, 0.1)
    print(f"Capture cooldown: {cooldown_sec}s")
    print("SPACE = capture once | A = auto on/off | Q = quit")

    captured = existing
    auto_mode = False
    last_capture_time = 0
    space_pressed = False

    while captured < args.samples:
        success, frame = camera.read()

        if not success:
            print("Failed to read frame.")
            break

        frame = cv2.flip(frame, 1)
        display = frame.copy()

        cv2.putText(
            display,
            f"Label: {label}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.1,
            (0, 255, 0),
            2,
        )

        cv2.putText(
            display,
            f"Captured: {captured}/{args.samples}",
            (20, 85),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2,
        )

        mode_text = "AUTO ON" if auto_mode else "MANUAL"
        cv2.putText(
            display,
            f"Mode: {mode_text} | SPACE=capture | A=auto | Q=quit",
            (20, 125),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2,
        )

        now = time.time()
        time_since_capture = now - last_capture_time
        if time_since_capture < cooldown_sec:
            remaining = cooldown_sec - time_since_capture
            cv2.putText(
                display,
                f"Wait {remaining:.1f}s",
                (20, 165),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (0, 165, 255),
                2,
            )

        cv2.imshow("Collect ASL Samples", display)

        key = cv2.waitKey(1) & 0xFF
        should_capture = False

        if key == ord("q"):
            break

        if key == ord(" "):
            if not space_pressed:
                should_capture = True
            space_pressed = True
        else:
            space_pressed = False

        if key == ord("a"):
            auto_mode = not auto_mode
            print(f"Auto mode: {'ON' if auto_mode else 'OFF'}")

        if auto_mode and time_since_capture >= cooldown_sec:
            should_capture = True

        if should_capture and time_since_capture >= cooldown_sec:
            filename = f"{label}_{captured + 1:04d}.jpg"
            filepath = os.path.join(output_dir, filename)
            cv2.imwrite(filepath, frame)
            captured += 1
            last_capture_time = now
            print(f"Saved {filepath}")

    camera.release()
    cv2.destroyAllWindows()
    print(f"Done. Total images in {output_dir}: {captured}")

if __name__ == "__main__":
    main()