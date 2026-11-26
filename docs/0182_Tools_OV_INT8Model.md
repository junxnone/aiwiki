---
Title | Tools OV INT8Model
-- | --
Created @ | `2020-03-18T08:44:15Z`
Updated @| `2026-11-26T10:24:01Z`
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

图中：该图为原文档附带的 OpenVINO INT8 量化流程示意图，对应上面的两种量化方法。

INT8 量化把浮点值映射成 8 位整数：

$$
q=\mathrm{clip}\big(\mathrm{round}(x/s)+z,\ -128,\ 127\big)
$$

其中：$x$ 为浮点值；$s$ 为 scale；$z$ 为 zero point；$q$ 为量化后的整数。INT8 的存储只有 FP32 的 $1/4$，并能使用硬件的 INT8 指令加速，因此「增加性能、减少模型大小」。量化的详细原理见 [POT](https://github.com/junxnone/aiwiki/issues/177)、[NNCF](https://github.com/junxnone/aiwiki/issues/451)。

| 方法 | 数据需求 | 精度损失 |
| --- | --- | --- |
| Default Quantization | 只需未标注的校准数据 | 不可控 |
| Accuracy-aware Quantization | 需要标注数据，用来评估精度 | 可控，超过阈值时把敏感层回退为浮点 |

表中：对比结论：先用 Default；精度不达标再用 Accuracy-aware。


## Default Quantization
- POT Python API/POT cmd-line

<img width=800 src="https://user-images.githubusercontent.com/2216970/168195305-aaebb76e-d783-462b-b178-b4fbfe3fee8a.png">



## Reference
- [Optimizing models post-training](https://docs.openvino.ai/latest/pot_introduction.html#doxid-pot-introduction)
- [calibration_tool](https://docs.openvinotoolkit.org/2019_R3.1/_inference_engine_tools_calibration_tool_README.html)
- [NNCF](https://github.com/openvinotoolkit/nncf)
- [Intel® Neural Compressor](https://github.com/intel/neural-compressor)
- [Post-Training Quantization with TensorFlow Classification Model](https://github.com/openvinotoolkit/openvino_notebooks/blob/173645d14740b0ceba9d9785552823bf8330ce67/notebooks/301-tensorflow-training-openvino/301-tensorflow-training-openvino-pot.ipynb)


