import tensorflow as tf
import numpy as np

print("Loading model...")
model = tf.keras.models.load_model("livestock_resnet50_final.h5")
print(f"Model loaded successfully. Input shape: {model.input_shape}")

# Create representative dataset (100 random samples)
def representative_data_gen():
    print("Generating representative dataset...")
    for i in range(100):
        if i % 20 == 0:
            print(f"  Generated {i}/100 samples")
        data = np.random.rand(1, 224, 224, 3).astype(np.float32)
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        data = ((data - mean) / std).astype(np.float32)
        yield [data]

print("\nStarting TFLite conversion with dynamic range quantization...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data_gen

print("Converting model...")
tflite_model = converter.convert()

print(f"\nModel converted! Size: {len(tflite_model) / (1024*1024):.2f}MB")

# Save quantized model
with open("livestock_resnet50_dynamic.tflite", "wb") as f:
    f.write(tflite_model)

print(f"\u2705 Dynamic quantized model saved as 'livestock_resnet50_dynamic.tflite'")
print(f"File size: {len(tflite_model) / (1024*1024):.2f}MB")
if len(tflite_model) < 1024*1024:  # Less than 1MB
    print("\u26a0\ufe0f WARNING: Model is suspiciously small! Check for errors.")
elif len(tflite_model) > 20*1024*1024:  # More than 20MB
    print("\u26a0\ufe0f WARNING: Model is still large. May cause memory issues.")
else:
    print("\u2705 Model size looks good!")
