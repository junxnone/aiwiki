---
Title | Tools OV INT8Model
-- | --
Created @ | `2020-03-18T08:44:15Z`
Updated @| `2023-10-30T07:57:27Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/182)

---
# OpenVINO INT8 Model

- OpenVINO INT8 Model - 增加性能/减少模型大小
- POT - `Post-training Optimization Tool`
- API/CMD/Workbench 三种方式量化
- Quantization Methods
  - **Default Quantization** 
    - 仅需要未注释的数据集
    - `Accuracy Drop` 不可控
  - **Accuracy-aware Quantization** 
    - 需要标注的数据集
    - `Accuracy Drop` 可控

<img width=800 src="https://user-images.githubusercontent.com/2216970/168196362-17a40e1f-479e-48a8-9553-8681ed9faee3.png">

## Default Quantization
- POT Python API/POT cmd-line

<img width=800 src="https://user-images.githubusercontent.com/2216970/168195305-aaebb76e-d783-462b-b178-b4fbfe3fee8a.png">



## Reference
- [Optimizing models post-training](https://docs.openvino.ai/latest/pot_introduction.html#doxid-pot-introduction)
- [calibration_tool](https://docs.openvinotoolkit.org/2019_R3.1/_inference_engine_tools_calibration_tool_README.html)
- [NNCF](https://github.com/openvinotoolkit/nncf)
- [Intel® Neural Compressor](https://github.com/intel/neural-compressor)
- [Post-Training Quantization with TensorFlow Classification Model](https://github.com/openvinotoolkit/openvino_notebooks/blob/173645d14740b0ceba9d9785552823bf8330ce67/notebooks/301-tensorflow-training-openvino/301-tensorflow-training-openvino-pot.ipynb)

