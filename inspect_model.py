import tensorflow as tf

# Load the TFLite model
interpreter = tf.lite.Interpreter(model_path="assets/models/livestock_mobile_vnet_final.tflite")
interpreter.allocate_tensors()

# Get input details
input_details = interpreter.get_input_details()
print("INPUT DETAILS:")
for i, detail in enumerate(input_details):
    print(f"  Input {i}:")
    print(f"    Shape: {detail['shape']}")
    print(f"    Type: {detail['dtype']}")
    print(f"    Name: {detail['name']}")

# Get output details
output_details = interpreter.get_output_details()
print("\nOUTPUT DETAILS:")
for i, detail in enumerate(output_details):
    print(f"  Output {i}:")
    print(f"    Shape: {detail['shape']}")
    print(f"    Type: {detail['dtype']}")
    print(f"    Name: {detail['name']}")
