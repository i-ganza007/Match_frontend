import tensorflow as tf
import os

model_path = "assets/models/livestock_mobile_vnet_final.tflite"

if not os.path.exists(model_path):
    print(f"Error: Model file not found at {model_path}")
    exit(1)

try:
    interpreter = tf.lite.Interpreter(model_path=model_path, num_threads=1)
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    print("INPUT DETAILS:")
    for i, detail in enumerate(input_details):
        print(f"  Input {i}:")
        print(f"    Shape: {detail['shape']}")
        print(f"    Type: {detail['dtype']}")
        print(f"    Name: {detail['name']}")
    
    output_details = interpreter.get_output_details()
    print("\nOUTPUT DETAILS:")
    for i, detail in enumerate(output_details):
        print(f"  Output {i}:")
        print(f"    Shape: {detail['shape']}")
        print(f"    Type: {detail['dtype']}")
        print(f"    Name: {detail['name']}")
except Exception as e:
    print(f"Error loading model: {e}")
