-----

| Title     | Tools OV NNCF                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-10-30T07:57:51Z`                                |
| Updated @ | `2026-10-19T08:32:59Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/451) |

-----

# NNCF - Neural Network Compression Framework

  - NNCF 是 Intel 开源的模型压缩框架，为 OpenVINO
    推理优化模型提供一整套**训练后压缩**和**训练时压缩**算法，目标是在尽量小的精度损失下减小模型体积、提升推理速度。
  - 支持的后端：OpenVINO IR（官方首选/支持最全）、PyTorch、ONNX，TensorFlow/TorchFX
    部分能力为实验性支持。
  - 核心 API
    很薄，常用的就三个函数：`nncf.quantize()`（训练后量化）、`nncf.compress_weights()`（仅权重压缩，LLM
    场景主力）、`nncf.quantize_with_accuracy_control()`（带精度控制的量化）。
  - 对 Hugging Face 上的 Transformer/LLM 模型，更推荐通过 [Optimum
    Intel](https://github.com/huggingface/optimum-intel) 的
    `.from_pretrained()`/`optimum-cli export openvino` 间接调用 NNCF，而不是直接写
    NNCF API。
  - 三个方向各有一篇深入篇：[NNCF Weight
    Compression](0560_NNCF_Weight_Compression)（AWQ/Scale
    Estimation/LoRA Correction）、[NNCF Post-training
    Quantization](0561_NNCF_Post_training_Quantization)（`nncf.quantize()`
    参数详解）、[NNCF Training-time
    Optimization](0562_NNCF_Training_time_Optimization)（QAT/`nncf.prune()`）。

## 模型压缩做了什么（本质原理）

不管具体用哪个算法，NNCF 的各类压缩方法本质上都是在"模型体积/推理速度"和"精度"之间做权衡，但压缩的**作用对象**和**手段**不同：

  - **量化（Quantization）在做什么**：把原本用浮点数（FP32/FP16）表示的数值，映射到一个更小位宽的整数网格上。核心公式是
    `q = round(x / scale) + zero_point`，反过来用 `x ≈ scale * (q -
    zero_point)` 还原近似值——`scale` 决定了整数网格的"刻度"有多粗，`zero_point` 决定浮点 0
    对应哪个整数（对称量化里 `zero_point` 固定为
    0，非对称量化允许它偏移，能更好适应本身分布不对称的数值，比如
    ReLU
    之后的激活值全是非负数）。量化精度损失的根源就是这个"取整"操作本身不可逆，位宽越小（INT8→INT4）网格越粗、损失越大；量化粒度（per-tensor
    整个张量共用一套 scale、还是 per-channel/per-group 更细粒度地各自算
    scale）则决定了这个网格能多大程度上贴合权重/激活的真实分布，粒度越细精度越好但计算和存储
    scale 本身的开销也越大；
  - **权重压缩在做什么**：和量化用的是同一套数学（取整到整数网格），区别只是**只对权重做，不对激活值做**，所以推理时计算仍然用浮点，省下的是存储权重和把权重从内存/显存搬到计算单元的带宽，而不是省计算量本身；
  - **剪枝（Pruning）在做什么**：和量化是完全不同的手段——不改变保留下来的数值的精度，而是直接判断哪些参数"不重要"（比如绝对值很小、对输出影响可忽略），把它们置零甚至物理删除，从根本上减少需要存储和参与计算的参数数量；它的加速效果能不能兑现，高度依赖目标硬件/推理引擎**是否支持稀疏张量的专门计算路径**——如果只是把权重置零但硬件仍按稠密矩阵计算，体积会变小，但推理速度不会提升。

## 推理阶段和不压缩相比有什么区别

压缩本身（跑
`nncf.quantize()`/`compress_weights()`/`prune()`）发生在**部署之前**，是一次性的离线处理；真正的差异体现在后续**推理引擎加载/编译模型、以及每次前向推理**的时候：

|               | 未压缩（FP32/FP16）   | 全模型量化（PTQ，权重+激活都是 INT8）                                                                                        | 权重压缩（Weight Compression，仅权重 INT8/INT4）                                                                    | 剪枝（Pruning）                                                                                                        |
| ------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 模型文件里存的是什么    | 浮点权重             | 整数权重 + 每层/每组的 `scale`/`zero_point`                                                                             | 整数权重 + `scale`/`zero_point`，激活相关信息不变                                                                      | 权重矩阵不变，但大量元素为 0（结构化剪枝下是按模式整块置零/移除）                                                                                 |
| 推理引擎加载/编译阶段   | 直接按浮点图编译         | 识别出量化节点，为对应层选择 INT8 专用计算核（kernel）、做算子融合优化——这一步是编译期一次性开销，不计入每次推理延迟                                              | 识别权重压缩节点，准备好"读取整数权重 + 反量化"的计算路径                                                                           | 若硬件/推理库支持稀疏计算，编译期会选择稀疏专用 kernel；否则按普通稠密模型编译                                                                        |
| 每次前向推理实际发生的计算 | 浮点乘加             | 激活值先按本层 `scale` 量化成 INT8 → 用 INT8 乘加（通常以 INT32 累加防溢出）→ 按输出 scale 反量化/重新量化，传给下一层——整条链路尽量都在整数域里跑，才能吃到硬件的 INT8 加速 | 权重从 INT8/INT4 存储读出后，先按 `scale`/`zero_point` **反量化成浮点**，再和浮点激活值做**浮点**乘加——多出来的只是"读取整数 + 反量化"这一步，核心计算仍是浮点运算 | 非结构化剪枝：没有专门稀疏 kernel 时，推理和未压缩完全一样逐元素计算（0 值也照常参与乘加，白白浪费算力，只是存储变小了）；结构化 2:4 剪枝 + 支持该模式的硬件：计算单元可以直接跳过已知为 0 的位置，拿到真实加速 |
| 直观效果          | 体积/带宽占用最大，计算全程浮点 | 体积小、**计算也加速**（真正用上 INT8 算力），精度下降相对最明显                                                                          | 体积小、**主要省带宽**（权重搬运量小），计算仍是浮点、单次乘加不会变快，更适合访存瓶颈的 LLM 解码阶段                                                   | 体积一定变小；推理是否变快取决于硬件是否认识这种稀疏模式，不是必然的                                                                                 |

一个容易误解的点：**权重压缩不等于"推理变快是因为算得快"**——它的加速收益主要来自"要从内存/显存搬运的数据量变小了"，计算本身（反量化之后）还是浮点乘加；而全模型量化（PTQ）才是连计算本身都换成了
INT8，这也是前面表格里为什么 PTQ 的"推理性能"栏写的是"提升明显"、而 Weight Compression
写的是"主要缓解带宽压力"的原因。

## 适用场景

  - 目标设备算力/带宽/显存有限（边缘设备、端侧 NPU、普通 CPU），需要用更小的模型体积和更低的推理延迟换取可接受的精度损失；
  - LLM 本地化部署——权重体积通常是带宽瓶颈，Weight Compression 几乎是刚需，不是可选项；
  - 模型在验证集上已经有足够的精度余量（比如比业务要求的精度阈值高出不少），能承受量化/剪枝带来的小幅精度下降；
  - 需要在同一套硬件上部署更多并发模型实例（如多模型服务场景），压缩后的模型能降低单实例的显存/内存占用，提高单机可承载的并发数。

## 不适用场景

  - **目标推理引擎/硬件不支持对应的量化或稀疏计算加速**：比如把模型剪枝成稀疏权重，但部署硬件只有稠密矩阵乘法单元，体积缩小了但推理速度不会提升，这种情况下压缩的收益很有限，甚至因为额外的反量化开销而变慢；
  - **精度余量本来就很小、或业务对精度极度敏感**（如医疗诊断、金融风控等关键决策链路），模型本身调教到了刚好卡在精度红线上，任何额外的量化/剪枝误差都可能导致不可接受的后果；
  - **没有可用的校准数据集，且数据分布又对量化参数（scale/zero-point）很敏感**：PTQ/Weight
    Compression 的 data-aware 算法（如 AWQ、Scale Estimation）、QAT
    都依赖校准或训练数据来估计合理的量化参数，如果拿不到有代表性的数据（比如隐私敏感场景无法拿到真实业务数据做校准），压缩效果没有保障，盲目量化可能比不压缩更差；
  - **模型架构本身对量化天然敏感**：比如包含大量
    Softmax/LayerNorm、数值动态范围差异很大的层，激活值量化误差容易被放大，默认参数下量化掉点明显，需要额外做
    `ignored_scope` 排除或改用混合精度，工程成本不一定划算；
  - **离线、无部署延迟/体积约束的场景**：比如用大算力集群做一次性批量推理，模型体积和速度都不是瓶颈，这时候引入压缩反而增加了流程复杂度和精度风险，没有必要。

## 和 POT 的关系

[POT（Post-Training Optimization Tool）](0177_Tools_OV_POT) 是 OpenVINO
更早期的训练后量化工具，从 OpenVINO 2023.0 起已被官方标记为弃用，其训练后量化能力已经并入 NNCF（即
`nncf.quantize()`）——**新项目应该直接用 NNCF，不要再用
POT**，[0182\_Tools\_OV\_INT8Model](0182_Tools_OV_INT8Model) 里提到的
Default/Accuracy-aware Quantization 两种模式在 NNCF 里分别对应 `nncf.quantize()` 和
`nncf.quantize_with_accuracy_control()`。

## 训练后压缩算法（Post-Training，不需要训练）

| 算法                              | API                                     | 说明                                                                                                                                                                       |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PTQ（Post-Training Quantization） | `nncf.quantize()`                       | 把权重和激活都量化为 INT8，需要一个小的校准数据集（官方建议约 300 条样本，用于统计激活值分布），适合 CNN/一般 Transformer 模型，详见 [NNCF Post-training Quantization](0561_NNCF_Post_training_Quantization)                 |
| 带精度控制的量化                        | `nncf.quantize_with_accuracy_control()` | 在 `nncf.quantize()` 基础上额外传入验证数据集和精度指标，量化过程中自动监控精度下降，超过设定阈值就回退部分层到 FP16/FP32                                                                                              |
| 权重压缩（Weight Compression）        | `nncf.compress_weights()`               | 只压缩权重到 INT8/INT4，**激活值保持浮点**，因此精度通常比全模型量化更好；**不需要校准数据集**（data-free），主要为 LLM 场景设计——LLM 推理瓶颈主要在访存带宽（权重体积），而不是计算，详见 [NNCF Weight Compression](0560_NNCF_Weight_Compression) |
| 激活稀疏化                           | —                                       | 实验性，仅 PyTorch 支持，OpenVINO 后端暂不支持                                                                                                                                         |

## 训练时压缩算法（Training-Time，仅 PyTorch，需要训练）

> 详见 [NNCF Training-time
> Optimization](0562_NNCF_Training_time_Optimization)。注意：NNCF 较新版本里，基于
> `NNCFConfig` + `create_compressed_model()`（`NNCFNetwork`）的旧版配置式 API
> 已被移除，连带被移除的还有一批挂在这套旧架构下的训练时算法——NAS、Structural
> Pruning、AutoML、Knowledge Distillation、Mixed-Precision
> Quantization、Movement Sparsity。下面是当前（新 API）仍在维护的训练时能力。

  - **QAT（Quantization Aware Training）**：现在的做法比旧版简单得多——直接用
    `nncf.quantize()` 对 PyTorch 模型做一次量化（此时模型仍是可训练的
    `torch.nn.Module`，内部插入了伪量化节点），然后用**完全标准的训练循环**正常微调几个
    epoch（建议用较小学习率，如 `1e-5`），让模型自己适应量化带来的精度损失，比训练后量化精度更高；注意模型要转换成
    OpenVINO IR 之后权重才会真正变成 INT8，微调期间仍是浮点计算（只是模拟了量化误差）；
  - **LLM 场景的权重专用 QAT**：结合 LoRA/NLS（Neural Low-rank Adapter
    Search）做权重量化感知训练，是上面 Weight Compression INT4
    压缩在"愿意为精度多花训练成本"场景下的进阶版本；
  - **剪枝**：当前统一走 `nncf.prune()` API（仅 PyTorch），支持 Magnitude Pruning
    的几种模式——`UNSTRUCTURED_MAGNITUDE_LOCAL`/`UNSTRUCTURED_MAGNITUDE_GLOBAL`（非结构化，按张量内部/全局重要性剪枝）、`STRUCTURED_MAGNITUDE_2_4`（结构化
    2:4 稀疏模式，部分硬件对这种规则稀疏有专门加速支持）；旧版基于其他重要性准则（L1/L2/geometric median）的
    Filter Pruning 和 Movement Sparsity 已随旧架构一起移除。

## 怎么选

| 场景                                                 | 推荐                                                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 常规 CPU/GPU 部署的 CNN 或中小型 Transformer，能接受小的精度损失，不想训练 | `nncf.quantize()`（PTQ）                                                                                |
| 同上，但对精度下降有明确容忍上限                                   | `nncf.quantize_with_accuracy_control()`                                                               |
| LLM 推理（本地部署、边缘设备），模型体积/显存是主要瓶颈                     | `nncf.compress_weights()`，INT8 优先保精度，INT4 优先省体积/带宽，一般配合 AWQ + Scale Estimation 提升 INT4 精度             |
| 对精度要求很高、能接受完整训练流程的开销                               | QAT：`nncf.quantize()` + 标准微调循环（仅 PyTorch）                                                             |
| 需要减少参数数量而不是降低数值精度，能接受训练开销                          | `nncf.prune()`（Magnitude Pruning，仅 PyTorch）                                                           |
| 来自 Hugging Face 的 Transformer/LLM 模型               | 优先用 Optimum Intel 的 `optimum-cli export openvino` 或 `OVModelForCausalLM.from_pretrained()`，内部会调用 NNCF |

权重压缩对模型体积的直观影响：FP32 → INT8 体积约降到 1/4，FP32 → INT4 约降到 1/8（例如 Zephyr-7B 从
FP32 的 28GB 压到 INT4 后约 4GB，精度基本保持）。

## 各算法对模型体积/性能/精度的影响

| 算法                                                             | 模型体积                               | 推理性能                                                                  | 精度                               | 备注                                                                                                                                             |
| -------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| PTQ `nncf.quantize()`（INT8，权重+激活都量化）                           | 降到约 1/4                            | 提升明显——计算本身也用 INT8，能吃到推理引擎的原生整数加速                                      | 小幅下降，一般可控                        | 激活值也被量化，精度下降通常比纯权重压缩更明显                                                                                                                        |
| `quantize_with_accuracy_control()`                             | 降到约 1/4，但敏感层会回退到更高精度，实际压缩率略低于纯 PTQ | 略低于纯 PTQ（部分层未量化）                                                      | 有精度监控和阈值兜底，比纯 PTQ 更有保障           | 适合有明确精度下限要求的场景                                                                                                                                 |
| Weight Compression INT8                                        | 降到约 1/4                            | 主要缓解内存/显存带宽压力，LLM 解码阶段提速明显；计算仍是浮点，提速幅度不如全 INT8 量化                     | 几乎不掉（激活值保持浮点，无量化误差传播）            | LLM 场景首选的"安全"压缩方式                                                                                                                              |
| Weight Compression INT4（基础，不开精度恢复）                             | 降到约 1/8                            | 同上，带宽压力进一步降低                                                          | 比 INT8 明显下降                      | 需要配合下面的精度恢复算法                                                                                                                                  |
| Weight Compression INT4 + AWQ/Scale Estimation/LoRA Correction | 同 INT4（LoRA adapter 带来的体积增量可忽略）    | 推理性能和基础 INT4 基本一致，但**压缩耗时更长**（三种算法都要跑校准数据）                            | 相比基础 INT4 明显改善，可以接近 INT8 水平      | 详见 [NNCF Weight Compression](0560_NNCF_Weight_Compression)                                                                                     |
| QAT：`nncf.quantize()` + 微调（训练时量化）                              | 取决于目标位宽，通常和对应 PTQ 位宽一致             | 和对应位宽的 PTQ/Weight Compression 推理性能一致（需转换为 OpenVINO IR 后才真正吃到 INT8 加速） | 这几种方法里**精度通常最高**，因为训练过程直接模拟了量化误差 | 代价是需要完整训练流程和数据集，耗时远超训练后方法；仅 PyTorch 支持                                                                                                         |
| `nncf.prune()`（Magnitude Pruning：非结构化 Local/Global、结构化 2:4）    | 按剪枝比例下降（减少的是参数数量，不是数值精度）           | 结构化 2:4 模式在有专门硬件支持时能直接转化为推理加速；非结构化剪枝若无稀疏计算支持，推理端提速有限                  | 取决于剪枝比例，通常需要训练恢复精度               | 仅 PyTorch 支持；旧版 Filter Pruning（L1/L2/geometric median）、Movement Sparsity、Mixed-Precision Quantization 等已随旧版 `create_compressed_model()` 架构一起移除 |
| Activation Sparsity（训练后）                                       | 不影响权重体积，理论上能减少推理时的有效计算量            | OpenVINO 后端暂不支持，无法在 OV 上拿到实际加速；仅 PyTorch 实验性支持                        | 未知/取决于稀疏率，尚不成熟                   | 目前更多是预研性质，不建议在生产环境依赖                                                                                                                           |

## 代码示例

### PTQ（OpenVINO 后端，INT8 全模型量化）

``` python
import nncf
import openvino as ov

model = ov.Core().read_model("model.xml")

# 校准数据集：transform_fn 把一条样本转换成模型可直接推理的输入
def transform_fn(data_item):
    images, _ = data_item
    return images

calibration_dataset = nncf.Dataset(dataset_loader, transform_fn)
quantized_model = nncf.quantize(model, calibration_dataset)

ov.save_model(quantized_model, "model_int8.xml")
```

### LLM 权重压缩（INT4，data-free）

``` python
from nncf import compress_weights, CompressWeightsMode

# 最简单的 INT4 压缩，不需要校准数据集
compressed_model = compress_weights(model, mode=CompressWeightsMode.INT4_SYM)

# 更精细的控制：group_size 控制量化粒度，ratio 控制 INT4/INT8 混合比例
compressed_model = compress_weights(
    model,
    mode=CompressWeightsMode.INT4_ASYM,
    group_size=64,
    ratio=0.9,   # 90% 的层压到 INT4，其余压到 INT8
)
```

### 通过 Optimum Intel 压缩 Hugging Face 模型（CLI）

``` bash
optimum-cli export openvino --model microsoft/Phi-3.5-mini-instruct \
  --weight-format int4 --awq --scale-estimation \
  --dataset wikitext2 --group-size 64 --ratio 1.0 \
  ov_phi-3.5-mini-instruct
```

## Reference

  - [NNCF GitHub](https://github.com/openvinotoolkit/nncf)
  - [NNCF Releases（含 legacy API
    移除记录）](https://github.com/openvinotoolkit/nncf/releases)
  - [NNCF PyPI](https://pypi.org/project/nncf/)
  - [Basic Quantization Flow - OpenVINO
    官方文档](https://docs.openvino.ai/2025/openvino-workflow/model-optimization-guide/quantizing-models-post-training/basic-quantization-flow.html)
  - [LLM Weight Compression - OpenVINO
    官方文档](https://docs.openvino.ai/2024/openvino-workflow/model-optimization-guide/weight-compression.html)
  - [4-bit Weight Quantization - OpenVINO
    官方文档](https://docs.openvino.ai/2024/openvino-workflow/model-optimization-guide/weight-compression/4-bit-weight-quantization.html)
  - [Optimum Intel](https://github.com/huggingface/optimum-intel)
  - [POT（已弃用，功能并入 NNCF）](0177_Tools_OV_POT)、[OpenVINO INT8
    Model](0182_Tools_OV_INT8Model)、[OpenVINO 总览](0185_Tools_OV)
  - 深入篇：[NNCF Weight Compression](0560_NNCF_Weight_Compression)、[NNCF
    Post-training
    Quantization](0561_NNCF_Post_training_Quantization)、[NNCF
    Training-time Optimization](0562_NNCF_Training_time_Optimization)
