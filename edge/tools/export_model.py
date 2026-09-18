import os
import sys
import argparse
import onnxruntime as ort

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

def quantize_model(input_model_path: str, output_model_path: str) -> bool:
    """
    Applies 8-bit dynamic integer quantization (INT8) to the ONNX model graph.
    Significantly reduces model footprint and accelerates CPU inference on Raspberry Pi / Edge nodes.
    """
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType

        print(f"Quantizing ONNX model: {input_model_path}")
        print(f"Output target        : {output_model_path}")

        quantize_dynamic(
            model_input=input_model_path,
            model_output=output_model_path,
            weight_type=QuantType.QUInt8
        )

        orig_size_mb = os.path.getsize(input_model_path) / (1024.0 * 1024.0)
        quant_size_mb = os.path.getsize(output_model_path) / (1024.0 * 1024.0)
        reduction_pct = (1.0 - quant_size_mb / orig_size_mb) * 100.0

        print(f"Original Model Size  : {orig_size_mb:.2f} MB")
        print(f"Quantized Model Size : {quant_size_mb:.2f} MB ({reduction_pct:.1f}% reduction)")
        print("Dynamic INT8 quantization completed successfully!")
        return True

    except ImportError:
        print("Notice: onnxruntime.quantization not installed in current environment.")
        return False
    except Exception as e:
        print(f"Quantization error: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KrishiVision ONNX INT8 Quantization Utility")
    parser.add_argument("--input", type=str, default="models/mobilenet_v2_plant_disease.onnx")
    parser.add_argument("--output", type=str, default="models/mobilenet_v2_plant_disease_int8.onnx")
    args = parser.parse_args()

    quantize_model(args.input, args.output)
