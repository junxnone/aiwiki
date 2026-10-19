---
Title | NNCF Post-training Quantization
-- | --
Created @ | `2026-10-19T08:26:04Z`
Updated @| `2026-10-19T08:26:04Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/561)

---
# NNCF Post-training Quantization

> 本文是 [NNCF](0451_Tools_OV_NNCF) 总览的深入篇，专门展开 Post-training Quantization（训练后全模型量化）——`nncf.quantize()`。

## 和 Weight Compression 的本质区别

NNCF Weight Compression（见总览 [NNCF](0451_Tools_OV_NNCF) 及其深入篇）只压缩权重、激活值保持浮点，主要解决 LLM 的**带宽瓶颈**；而本文讲的 PTQ（`nncf.quantize()`）会把**权重和激活值都量化为 INT8**，连计算本身也用整数运算，能吃到推理引擎（如 OpenVINO 的 CPU/GPU 插件）对 INT8 算子的原生加速，更适合 CNN、目标检测、传统 Transformer 这类计算密集、而不是访存密集的模型。代价是激活值的量化误差会直接参与计算、逐层传播，精度下降通常比纯权重压缩更明显。

## 基本流程

PTQ 需要一个小的校准数据集（官方建议约几百条样本）来统计激活值的分布范围，流程分三步：

```python
import nncf
import openvino as ov

model = ov.Core().read_model("model.xml")

# 1. 定义 transform_fn：把数据集里的一条样本转换成模型能直接推理的输入
def transform_fn(data_item):
    images, _ = data_item   # 校准阶段不需要标签，只要输入
    return images

# 2. 包装成 nncf.Dataset
calibration_dataset = nncf.Dataset(dataset_loader, transform_fn)

# 3. 调用 nncf.quantize()
quantized_model = nncf.quantize(model, calibration_dataset)

ov.save_model(quantized_model, "model_int8.xml")
```

`nncf.Dataset` 的意义在于把"任意框架的数据集/DataLoader"适配成 NNCF 能理解的统一接口，不需要为了量化去改造原有的数据读取代码，只需要写一个 `transform_fn` 做格式转换。

## 常用可调参数

| 参数 | 作用 |
|---|---|
| `preset` | 量化方案：`PERFORMANCE`（权重和激活都用对称量化，速度最快，适合 ResNet/YOLO 等 CNN）或 `MIXED`（激活用非对称量化，精度更好，适合 Transformer/LLM 这类对量化更敏感的模型）。不指定时，Transformer 类型模型默认用 `MIXED`，其余默认 `PERFORMANCE` |
| `model_type` | 传入 `ModelType.TRANSFORMER` 会自动识别并保护 Transformer 架构里对精度敏感的特定层（如部分保持 FP16），显著缓解量化掉点 |
| `target_device` | 指定目标推理设备（如 `TargetDevice.CPU`），量化策略会按该设备的量化算子支持情况做适配，获得该设备上的最佳性能 |
| `subset_size` | 从校准数据集里实际用多少条样本统计激活值分布，默认 128，显存/内存紧张时可以调小（如 100），样本太少会影响统计出的量化参数准确性 |
| `ignored_scope` | 指定不参与量化、保持原始精度的层——支持按名字（`names=`）、按类型（`types=`）、按正则（`patterns=`）、按子图（`subgraphs=`）几种匹配方式，常用于手动保护某些已知对量化特别敏感的层 |
| `fast_bias_correction` | 默认为 `True`，用更快但略粗糙的偏置修正算法；设为 `False` 会启用更精细但更慢的修正算法，只在 OpenVINO/ONNX 后端可用 |

## 带精度控制的量化：`quantize_with_accuracy_control()`

`nncf.quantize()` 量化完就结束了，不会检查精度是否满足要求；如果业务对精度下降有明确的容忍上限（比如"精度下降不能超过 1%"），应该用 `quantize_with_accuracy_control()`——除了模型和校准数据集，还需要额外传入一个验证数据集和精度评估函数，量化过程中持续监控精度，一旦发现精度跌破阈值，就把部分层自动回退到更高精度（FP16/FP32），直到精度重新达标。代价是整个量化过程需要反复跑验证、耗时比普通 PTQ 更长，而且回退的层不会被量化，最终压缩率/推理加速效果会比纯 `nncf.quantize()` 打折扣。

## 怎么选

| 场景 | 推荐 |
|---|---|
| CNN/目标检测等计算密集模型，对精度不是特别敏感 | `nncf.quantize()` + `preset=PERFORMANCE` |
| Transformer/LLM 类模型，用默认参数掉点明显 | `nncf.quantize()` + `model_type=ModelType.TRANSFORMER`，必要时配合 `preset=MIXED` |
| 已知某些层特别敏感、量化后明显出问题 | 用 `ignored_scope` 手动排除这些层 |
| 有明确的精度下限要求，不能"量化完才发现掉点太多" | `quantize_with_accuracy_control()` |
| 显存/内存紧张，跑不动默认的校准流程 | 调小 `subset_size` |

## Reference
- [Basic Quantization Flow - OpenVINO 官方文档](https://docs.openvino.ai/2025/openvino-workflow/model-optimization-guide/quantizing-models-post-training/basic-quantization-flow.html)
- [nncf.quantization.advanced_parameters API 文档](https://openvinotoolkit.github.io/nncf/autoapi/nncf/quantization/advanced_parameters/index.html)
- [NNCF GitHub](https://github.com/openvinotoolkit/nncf)
- [NNCF 总览](0451_Tools_OV_NNCF)

