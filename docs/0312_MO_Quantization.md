---
Title | MO Quantization
-- | --
Created @ | `2018-10-16T02:57:36Z`
Updated @| `2026-10-18T09:34:54Z`
Labels | `ML`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/312)

---
# 量化
- Quantization - 量化
  - 嵌入式设备/移动设备 - 低计算能力/低内存/低存储空间/低功耗/...
  - 压缩参数/提升速度/降低内存占用/低计算单元占用面积
  - 精度损失
- 浮点运算 --> 整型运算: `float32 --> int8`
- 线性量化/非线性量化
- 逐层/组/通道量化：量化参数（Scale/Zero Point）的统计粒度，细粒度精度更高但元数据开销更大，详见下文"量化粒度"一节
- 在线/离线量化：量化参数是提前算好固定住（离线），还是运行时按每次输入实时计算（在线），详见下文"在线量化 vs 离线量化"一节
- 比特量化
- 权重/权重激活量化
- [OpenVINO INT8 Model](/OpenVINO_INT8_Model)


## 线性量化
- $r = Round(S(q-Z))$
  - $q$: 原始 float32 值
  - $Z$: float32 数值的偏移量 `Zero Point`
  - $S$: float32 缩放因子 `Scale`
  - $Round$:  四舍五入或向上向下取整
  - $r$: 量化后的整数值
- 对称量化/非对称量化

### 对称量化
- 输入数据的 `最大值/最小值` 映射到 [-128, 127]
- 输入数据`零`，对应量化后的`零`


![image](https://user-images.githubusercontent.com/2216970/168248278-a3c3abe7-6288-4a54-bf00-422cec369d7b.png)


### 非对称量化
- 输入数据的 `最大值/最小值` 映射到 [0, 255]

![image](https://user-images.githubusercontent.com/2216970/168248293-3f565fd3-540c-4de1-98b1-3d4830dd693f.png)


## 非线性量化

线性量化假设数值在 [min, max] 区间里大致均匀分布，但训练出来的权重/激活往往是长尾/偏态分布（大量值集中在 0 附近，少量离群值很大）——这时均匀步长会在数据稀疏的区域浪费表示能力，在数据密集的区域又分辨率不够。非线性量化按数据实际分布的疏密分配量化级别：

- **对数域量化（Log quantization）**：不直接量化 `x`，而是量化 `log(|x|)`（符号位单独存），对数空间里的均匀步长对应原始空间里越靠近 0 分辨率越高、越远离 0 分辨率越低，正好匹配长尾分布；
- **K-means / 码本（Codebook）量化**：典型代表是 **Deep Compression**（Han, Mao & Dally, 2015/2016）的"剪枝 → 训练量化与权重共享 → 霍夫曼编码"三段式流水线。量化阶段对一层训练好的权重做 K-means 聚类，得到 K 个簇中心（码本），每个权重被替换成指向码本的索引（只需 $log_2K$ 比特），码本本身还可以用反向传播微调。论文报告 AlexNet 压缩 35 倍、VGG-16 压缩 49 倍且精度不下降；
- **什么时候该用非线性**：线性量化在数值分布本就接近均匀时最优；一旦分布明显偏态/有长尾（训练出来的权重、softmax/attention 之后的激活值都是典型例子），非线性方案能用同样的比特数换来更高精度，代价是查表/反量化的实现复杂度更高。

## 量化粒度

量化参数（Scale/Zero Point）可以在不同粒度上共享，粒度越细精度越高、元数据开销也越大：

| 粒度 | 做法 | 特点 |
|---|---|---|
| Per-tensor（逐张量） | 整个 Tensor 共用一组 Scale/Zero Point | 最粗、最快，但某个 Tensor 内不同通道数值范围差异大时精度损失明显 |
| Per-channel / Per-axis（逐通道） | 每个输出通道一组 Scale/Zero Point | 现代框架（TensorRT/PyTorch/ONNX Runtime）权重量化的事实标准，因为不同输出通道的权重范围往往差异很大 |
| Per-group（逐组） | 把一个通道的权重向量切成固定大小的块（常见 **group size = 128**），每块一组 Scale/Zero Point | LLM 权重量化（GPTQ/AWQ）的标准粒度，精度和元数据开销之间的经验最优点；部分研究发现多数层用更粗的 group size（如 1024）就够，只给少数敏感层用细粒度分组 |

## Pipeline
- 统计输入数据 Max/Min
- 选择量化方法 int8/uint8 ...
- 计算 `Zero Point`/`Scale`
- 根据Data对模型进行量化
- 验证量化模型性能, 若模型性能不好，则尝试不同的 `Z/S` 重复量化

## 在线量化 vs 离线量化

这组概念和前面的"静态/动态量化"描述的是同一件事的两种叫法：
- **离线（Offline）= 静态**：量化参数提前（通常是校准阶段）算好、固定下来，推理时直接用常量，对应前面的"静态量化"；
- **在线（Online）= 动态**：量化参数在推理时按**每次实际输入**的 min/max 实时计算，对应前面的"动态量化"。

严格来说"在线/离线"是更偏系统/硬件层面的通用说法，"静态/动态"是机器学习框架里专门针对**激活值**量化方式的说法——权重在两种方案里都是提前（离线）量化好的，"在线 vs 离线"真正有选择余地的只是激活值这一侧。

## 量化感知训练（QAT）

训练时在权重/激活处插入"伪量化"（Fake Quantization，量化再反量化）节点：前向计算时把数值舍入到模拟的低精度级别、再立刻反量化回浮点，让网络其余部分仍用浮点计算，但"感知"到了量化带来的误差。

核心难点是 `round()` 几乎处处梯度为零，没法直接反向传播。解决方法是 **Straight-Through Estimator（STE，直通估计器）**：反向传播时把 `round()` 当作恒等函数处理（梯度近似为 1，超出截断范围时梯度置零），让梯度能穿透这个不可导的操作继续回传到底层的浮点权重。

因为权重是在"亲身经历"量化误差的同时被更新的，QAT 在同等比特宽度下通常比 PTQ 精度更高，代价是需要训练数据、算力和时间——PTQ 不需要。

## LLM 权重量化（2022 年至今）

- **GPTQ**（2022-10）：单次前向的训练后量化，用近似二阶（Hessian）信息逐列量化权重，并用该列的 Hessian 信息对剩余未量化权重做闭式修正来补偿误差；175B 级模型只需约 4 GPU-小时即可量化到 3-4 bit，不需要重新训练；
- **AWQ**（2023-06，Activation-aware Weight Quantization）：不按权重本身的幅度、而是按**激活值的幅度**找出约 0.1%-1% 的"显著"权重通道，对这些通道做逐通道缩放来保护它们，而不是用混合精度；不需要反向传播/重建计算，泛化性更好，不容易过拟合校准数据；
- **GGUF**（llama.cpp / GGML 项目）：是一种**文件格式**而不是量化算法——把已经量化好的权重（提供 Q2_K~Q8_0 等多种位宽，Q4_K_M 是社区最常用的精度/体积平衡点）、分词器、元数据打包进一个文件，主要面向 CPU/边缘端本地推理；
- **bitsandbytes / NF4**：QLoRA（2023）引入的 4-bit NormalFloat 数据类型，假设权重近似正态分布，量化级别在 0 附近更密集，主要用于微调（QLoRA）场景而非推理部署；
- **三者的定位**：GPTQ、AWQ 是生成量化权重数值的**算法**；GGUF 是存储这些权重的**容器格式**，既可以装它自己的 K-quant 方法，也可以装 GPTQ/AWQ 量化出来的权重。

### 实践里怎么选

- 先试 **PTQ**——不需要训练数据和算力，INT8 下基本够用，很多模型 INT4 下也够用；
- 只有当激进比特宽度（≤4-bit）下 PTQ 精度损失无法接受、且有训练预算时，才上 **QAT**（如 Gemma 3 官方发布的 QAT checkpoint）；
- 2026 年本地/消费级 GPU 部署 LLM 的实际默认是 **INT4**：AWQ 在指令微调模型上的质量通常略优于 GPTQ（GPTQ 有时在原始困惑度上更优），两者在 vLLM/TensorRT-LLM/SGLang 上都很成熟；本地 llama.cpp 部署社区默认是 GGUF 的 Q4_K_M；
- 3-bit/2-bit 这类更激进的比特宽度通常需要 QAT 或专门的校准方法才能保持可用；新一代硬件原生格式（NVIDIA NVFP4、Microsoft MXFP4）正在 Blackwell 级 GPU 上成为 AWQ/GPTQ 的新竞争者。


## Reference 
- [模型量化详解](https://blog.csdn.net/WZZ18191171661/article/details/103332338)
- [Deep Compression](https://arxiv.org/abs/1510.00149)
- [GPTQ](https://arxiv.org/abs/2210.17323)
- [AWQ](https://arxiv.org/abs/2306.00978)
- [Quantization and Training of Neural Networks for Integer-Only Inference (STE)](https://arxiv.org/abs/1712.05877)
- [Quantization 2026 Guide: GGUF vs AWQ vs GPTQ vs bitsandbytes](https://www.premai.io/blog/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/)

