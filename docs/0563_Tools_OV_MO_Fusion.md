---
Title | Tools OV MO Fusion
-- | --
Created @ | `2026-10-20T01:38:37Z`
Updated @| `2026-10-20T01:52:55Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/563)

---
# OpenVINO 算子融合（Operator Fusion）

> 本文是 OpenVINO Model Optimizer / 模型转换总览的深入篇，专门展开**算子融合**——一种贯穿模型转换和设备编译两个阶段的图优化手段。

## 融合解决什么问题

一个朴素的推理执行方式是：计算图里每个算子（Conv、BN、ReLU……）各自独立执行一次，上一个算子的输出写回内存，下一个算子再把它读出来作为输入。这样做有两个明显的开销：

- **内存读写开销**：每个中间结果都要完整写入、再完整读出一次，对于大的特征图（Feature Map）这个搬运成本可能比计算本身还贵——尤其是带宽受限的场景；
- **kernel 调度开销**：每个算子对应一次独立的计算核（kernel）启动，GPU 上尤其明显（每次 kernel 启动都有"参数传递→线程调度"的固定开销），算子越碎，这部分开销占比越高。

**算子融合**把多个相邻、满足融合条件的算子合并成一个计算核一次执行完，中间结果直接留在寄存器/缓存里不写回内存，既省了内存搬运，也省了多次 kernel 启动的调度开销。

## 融合是怎么做到的：两种完全不同的机制

"融合"听起来是一个动作，但实现上其实是两种本质不同的手段，分清楚这两种，后面每个具体模式就容易理解了：

- **机制 A：算子真的从图里消失，参数被代数合并进另一个算子**——比如 Conv 后面跟一个线性的 Scale/Shift，两者复合之后仍然是一次线性运算，可以直接算出一组新的权重/偏置，把下游算子彻底删掉。这种融合**不需要**底层 kernel 库做任何特殊支持，因为融合之后图里就是一个普通的 Conv，运行时根本不知道它曾经是两个算子。[OpenVINO BatchNorm 折叠](0564_OpenVINO_BatchNorm_折叠_BN_Folding) 就是这种机制的典型例子。
- **机制 B：下游算子保留在语义上，但被当作"后处理操作（Post-op）"附加到上游算子的 kernel 调用里**——比如 Conv 后面跟一个 ReLU，ReLU 不是线性的，没法用代数合并消掉，但可以让 Conv 的 kernel 在算完乘加结果、还没把数据写回内存之前，**顺手在寄存器里对结果做一次 `max(0, x)`，再写出最终结果**。这要求底层计算库（CPU 的 oneDNN、GPU 的 clDNN/oneDNN）本身提供"post-ops"接口，让调用方可以往一个主算子（如 Convolution）上追加若干个后处理操作。OpenVINO GPU 插件的编译流水线里有专门的两个阶段对应这件事：`prepare_primitive_fusing`（把下游的 ReLU、Eltwise Add 等操作标记为要融合进前一个 primitive）和 `add_onednn_optimization_attributes`（把这些标记翻译成 oneDNN 的 post-ops 调用参数）。

图优化阶段具体怎么"找到"该融合哪些算子：OpenVINO 的图变换框架提供了 `ov::pass::MatcherPass` 这个基础设施——开发者预先定义好一个要匹配的子图"模式"（比如"Convolution 后面紧跟一个 Add，且 Add 的另一个输入是常量"），框架会在整张计算图里查找所有匹配这个模式的位置，匹配到之后执行注册好的回调函数，由回调决定是走机制 A（直接改写权重、删除节点）还是机制 B（给上游节点打上 post-op 标记）。

## 常见的融合模式，用公式看具体怎么融合的

### Conv + Bias（机制 A）

卷积本身就是一次乘加：

```
y = W * x
```

如果来源框架把 bias 表示成卷积后面一个独立的 Add：

```
z = y + b = (W * x) + b
```

融合时不需要任何近似或推导——`Convolution` 算子的定义里本来就有一个可选的 bias 输入槽位，`MatcherPass` 匹配到 `Conv → Add(常量)` 这个模式后，直接把 `b` 搬进 Conv 节点自己的 bias 输入，Add 节点整个删掉。融合后的计算仍然是 `z = W*x + b`，只是现在这一步只用一次算子调用完成。

### Conv + BatchNorm + Activation（先 A 后 B）

第一步，[OpenVINO BatchNorm 折叠](0564_OpenVINO_BatchNorm_折叠_BN_Folding) 的代数把 `BN(Conv(x))` 改写成一个新的卷积：

```
BN(Conv(x)) = BN(W*x + b)
            = γ * ((W*x + b) - μ) / sqrt(σ² + ε) + β
            = W' * x + b'          （W' = W·γ/sqrt(σ²+ε)，b' 见 BN 折叠一文的推导）
```

这一步之后，图里只剩 `Conv'(x) → Activation`。第二步不能再用代数合并——假设激活函数是 ReLU：

```
output = ReLU(Conv'(x)) = max(0, W'*x + b')
```

`max(0, ·)` 是非线性的，没法把它"吸收"进 `W'`/`b'`，所以机制 A 在这一步失效。但 `max(0, ·)` 只是对标量结果做一次比较置零，完全可以在 Conv 的 kernel 算出 `W'*x + b'` 的那一刻、还没把结果写回内存之前，顺手在寄存器里做掉：

```
对每个输出元素:
    acc = sum(W'[k] * x[k]) + b'     # 卷积乘加，结果留在寄存器/累加器里
    acc = max(0, acc)                # ReLU 作为 Conv 的 post-op，在写回前执行
    写出 acc
```

GPU 插件文档原话"relu is fused into convolution"说的正是这一步：ReLU 不再是独立节点，而是变成 Convolution primitive 在写出结果前顺带执行的一个 post-op。

### 逐元素算子链融合（机制 B）

一条 `Add → Mul → ReLU` 的逐元素算子链，数学上是：

```
output = ReLU( (x + c1) * c2 )
       = max(0, c2*x + c1*c2)
```

注意：如果链条里全是线性运算（Add、Mul），它们之间其实也可以先用机制 A 合并成一个 `a*x + b` 的形式（这里 `a = c2`，`b = c1*c2`），只有链条末尾的非线性函数（ReLU）必须留到最后用机制 B 处理。所以这条链实际的融合顺序是"先代数合并掉所有线性步骤，再把最后的非线性函数变成 post-op"——和上面 Conv+BN+Activation 是同一套"先 A 后 B"的逻辑，只是这里合并的是纯逐元素的线性步骤，而不是卷积权重。GPU 插件文档里提到的"Element-wise add operation can usually be fused into predecessor, too"，说的就是把 Add 这类逐元素算子作为 post-op 挂到前一个（通常是计算密集型的）算子上。

### 线性算子融合（机制 A，BN 折叠的推广）

任意一个形如下式的逐通道线性层（Scale/Shift）：

```
y = a * x + b
```

只要它紧跟在一个卷积 `Conv(x) = W*x + b_conv` 后面，复合后仍然是线性的：

```
y = a * (W*x + b_conv) + b = (a·W)*x + (a*b_conv + b)
```

所以可以直接算出新的 `W' = a·W`、`b' = a*b_conv + b`，把 Scale/Shift 节点整个删掉——这和 BatchNorm 折叠是**完全相同的代数操作**，只是 BN 折叠里的 `a = γ/sqrt(σ²+ε)`、`b = β - γμ/sqrt(σ²+ε)` 这两个系数恰好是由 BN 的四个训练参数算出来的，而这里 `a`、`b` 可以是任意来源的线性变换系数。旧版 Model Optimizer 文档里专门有 `--disable_fusing` 开关可以关掉这整类融合，说明这是一个独立于 BN 折叠、但数学原理完全相同的通用优化。

## 融合发生在哪个阶段

OpenVINO 的模型优化流水线分两段，融合在两段都可能发生，但关注点不同：

1. **转换阶段**（`openvino.convert_model()`/`ovc`）：做的是**和硬件无关**的图级融合——比如把数学上等价、可以合并的线性算子直接在计算图层面合并掉，这一步融合后的结果会保存进 IR（`.xml`/`.bin`），所有设备都能复用；
2. **编译阶段**（`compile_model()`，由具体的 CPU/GPU/NPU 插件执行）：做的是**和硬件相关**的融合决策——同一个融合模式在不同硬件上是否划算、融合后用哪个具体 kernel 执行，是设备插件自己决定的。[OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl) 里对比过 CPU 和 GPU 插件的融合能力差异：CPU 插件因为没有独立 kernel 启动开销、融合实现更灵活，能做到"Conv+BN+激活+裁剪"这种更深的融合；GPU 插件受限于 kernel 编译机制，融合范围相对保守（如 `reorder+crop`，见 [OpenVINO GPU Crop 实现](0530_Tools_OV_OPs_GPUImpl_Crop)）。

这也是为什么同一个模型在 CPU 和 GPU 上转换出来的"实际执行的算子数量"可能不一样——IR 文件本身是一致的，差异来自各自插件在编译阶段做的融合决策不同。

## 怎么验证融合是否生效

- CPU：用 `OV_CPU_VERBOSE=11` 环境变量跑一次推理（见 [OpenVINO Debug](0527_Tools_OV_Debug)），输出里能看到每个实际执行节点的信息，融合后的节点通常会把原本几个算子的名字拼在一起显示；
- GPU：用 `OV_GPU_DUMP_SOURCES_PATH` 导出编译后的 OpenCL 源码，检查生成的 kernel 数量是否比计算图里的算子数量少。

## Reference
- [OpenVINO BatchNorm 折叠](0564_OpenVINO_BatchNorm_折叠_BN_Folding)
- [OpenVINO Matcher Pass 官方文档（图模式匹配/改写框架）](https://docs.openvino.ai/2024/documentation/openvino-extensibility/transformation-api/matcher-pass.html)
- [OpenVINO GPU Plugin Graph Optimization Passes（prepare_primitive_fusing/add_onednn_optimization_attributes）](https://github.com/openvinotoolkit/openvino/wiki/Graph-Optimization-Passes)
- [OpenVINO Ops Impl（CPU/GPU 融合能力对比）](0533_Tools_OV_OPs_Impl)
- [OpenVINO GPU Crop 实现（reorder+crop 融合示例）](0530_Tools_OV_OPs_GPUImpl_Crop)
- [OpenVINO Debug（OV_CPU_VERBOSE/OV_GPU_DUMP_SOURCES_PATH）](0527_Tools_OV_Debug)
- [Legacy Conversion API - 线性融合/ResNet 优化开关](https://docs.openvino.ai/2023.3/openvino_docs_MO_DG_Deep_Learning_Model_Optimizer_DevGuide.html)
- [OpenVINO Model Optimizer 总览](0181_Tools_OV_MO)

