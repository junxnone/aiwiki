-----

| Title     | Tools OV OPs CPUImpl Snippets                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T01:08:38Z`                                |
| Updated @ | `2026-10-21T01:08:38Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/576) |

-----

# Snippets（CPU 子图 JIT 编译器）

> 本文从 [OPs CPU Impl](0534_Tools_OV_OPs_CPUImpl) 拆分出来，专门展开 Snippets——CPU
> 插件里把多个算子融合成一个子图、整体 JIT 编译成一段机器码的编译器子系统，是
> [算子融合](0563_Tools_OV_MO_Fusion) 一文里"机制 B（post-op/融合执行）"在 CPU
> 侧最完整的落地形式。

## 要解决的问题

单个算子各自用 [JIT Emitters](0534_Tools_OV_OPs_CPUImpl)
生成代码，解决的是"怎么让一个算子尽量快"；但如果一条
`Add→Mul→ReLU` 这样的逐元素运算链每个算子都独立执行，依然要为每一步付出一次完整的内存读写——这正是
[算子融合](0563_Tools_OV_MO_Fusion) 一文反复强调的问题。手写 kernel
去覆盖"任意可能出现的算子组合"显然不现实（组合数量爆炸），Snippets
的思路是：**把融合这件事做成一个小型编译器，而不是逐个手写**。

## 三个核心步骤

1.  **Tokenization（子图识别/分词）**：在图优化阶段，Snippets
    扫描计算图，自动识别出一串可以融合的算子（典型是逐元素运算链，也支持更复杂的模式，如
    Scaled Dot-Product Attention 的部分子结构），把它们打包成一个统一的 `Subgraph`
    节点——这个过程类似编译器前端把源代码"分词"成 token 流，所以叫 Tokenization；
2.  **子图级优化**：对这个 `Subgraph` 内部做编译器常见的优化手段：
      - **纵向融合（Vertical
        Fusion）**：让数据在子图内部"流水线式"地依次经过各步计算，而不是每步都完整写回内存再读出来；
      - **分块（Tiling）**：把大张量切成适合缓存大小的小块分别处理，提升缓存局部性，减少缓存失效；
3.  **整体 JIT 编译**：复用和单算子 Emitter
    相同的底层机制（Xbyak），把优化后的整个子图一次性编译成一段可执行机器码——原本好几个独立算子调用，变成一次函数调用、一次内存读、一次内存写。

## 动态 Shape 支持的演进

Snippets 早期版本有一个明显限制：子图的输入 shape 必须在**编译期固定**，一旦运行时换了一个新的输入
shape，就要重新走一遍 JIT 编译流程生成新的二进制——对于 shape 经常变化的场景（如变长序列的
NLP 推理），频繁重新编译的开销可能把融合本来省下来的收益完全抵消掉。后续版本针对这个问题做了改进，加入了对动态 shape
的支持，不再要求每次 shape 变化都重新编译，这也是 OpenVINO 官方博客里专门提到"动态
shape 支持让 JIT 编译器的推理性能提升 40%"的背景。

## 和算子融合、Ops Impl 的关系

  - [算子融合](0563_Tools_OV_MO_Fusion) 一文里的"机制 B"说的是抽象原理——让下游算子变成上游算子的
    post-op，在写回内存前顺带算完；Snippets 是这个原理在 CPU 插件里的具体实现形式，而且比单纯的"附加一个
    post-op"更进一步，是一个能处理任意长度融合链的通用编译器；
  - [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl) 里提到"CPU 融合能力比 GPU
    更深，能把卷积+BN+激活+裁剪合并成一个逻辑"——这个结论背后的直接原因就是 Snippets：GPU
    的融合受限于预先写好的 `.cl` kernel 能不能覆盖某个具体组合，CPU 侧 Snippets
    是一个真正的编译器，原则上能处理任意一条逐元素运算链的融合，不需要事先为每种组合单独写代码。

## 怎么验证 Snippets 是否生效

    set OV_CPU_VERBOSE=11

打开后跑一次推理，输出里能看到哪些节点被识别/编译成了 `Subgraph`（即被 Snippets
接管），哪些节点仍然是独立执行的单个算子——融合生效的话，原本好几个独立节点会合并显示成一个
Subgraph 节点。

## Reference

  - [OpenVINO Snippets
    设计文档（GitHub）](https://github.com/openvinotoolkit/openvino/blob/master/src/common/snippets/docs/snippets_design_guide.md)
  - [Dynamic shapes support in OpenVINO JIT compiler boosts inference
    performance
    by 40%（官方博客）](https://medium.com/openvino-toolkit/dynamic-shapes-support-in-openvino-jit-compiler-boosts-inference-performance-by-40-a8e9707e2605)
  - [OPs CPU Impl](0534_Tools_OV_OPs_CPUImpl)
  - [算子融合](0563_Tools_OV_MO_Fusion)
  - [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)
