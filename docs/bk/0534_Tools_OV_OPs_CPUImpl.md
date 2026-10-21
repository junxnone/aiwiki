-----

| Title     | Tools OV OPs CPUImpl                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-03-20T07:20:58Z`                                |
| Updated @ | `2026-10-21T01:25:58Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/534) |

-----

# OPs CPU Impl

  - 部分 OPs 是根据 CPU 指令集（ISA）和执行精度（exec\_prc\_），动态生成加法算子（Add）的 JIT 汇编代码，例如
    ADD/Sub/Mul/Mul\_Add/Div/...
  - 正如 [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl) 里提到的，CPU 侧没有 GPU
    那种独立的 `.cl` kernel 文件，取而代之的是两套机制：**JIT
    Emitters**（给单个算子按指令集现场生成机器码）和
    **Snippets**（把多个算子融合的子图整体编译成一段二进制）。

## JIT Emitters：按指令集现场生成机器码

OpenVINO CPU 插件用 [Xbyak](https://github.com/herumi/xbyak)（一个 C++ 的
x86/x64 汇编代码生成库）给每个算子实现对应的 **Emitter**——不是预先编译好多份"AVX2 版""AVX512
版"二进制再运行时选择，而是在模型加载/编译阶段，**根据当前 CPU
实际支持的指令集（SSE41/AVX2/AVX512...）现场生成一段机器码**，直接对应这颗 CPU
能用的最优指令：

  - 每个 Emitter 对应一个底层算子（如加法、减法、乘法、Swish、Power 等逐元素运算）；
  - 同一个算子在不同 ISA 下是不同的 Emitter 实现（比如 `jit_add_emitter` 针对
    SSE41/AVX2/AVX512 会生成不同的向量指令序列），选用哪个由 `cpu_isa_t host_isa` 参数在运行时决定；
  - 这种"现场生成"的方式避免了维护大量预编译变体，也能更精细地利用某颗具体 CPU 的指令集能力（比如同样是 AVX512，是否支持
    BF16/VNNI 扩展指令）。

## Snippets：把算子融合子图整体 JIT 编译

单个算子各自生成代码还不够——如果一条 `Add→Mul→ReLU` 这样的逐元素算子链各自独立执行，依然要付出多次内存读写的代价（这正是
[算子融合](0563_Tools_OV_MO_Fusion) 一文里讲的问题）。**Snippets** 是 CPU
插件里专门解决这件事的 JIT 子图编译器——通过 Tokenization（子图识别）+
纵向融合/Tiling + 整体 JIT 编译三步，把一整条融合链编译成一段机器码，也是 [OpenVINO Ops
Impl](0533_Tools_OV_OPs_Impl) 里"CPU 融合能力比 GPU 更深"这个结论背后的根本原因。详细机制（含动态
shape 支持的演进）见独立的 [Snippets](0576_Tools_OV_OPs_CPUImpl_Snippets) 一文。

## 代码示例：怎么观察 JIT/Snippets 是否生效

    # 和 OpenVINO 算子融合一文里提到的 OV_CPU_VERBOSE 是同一套机制
    set OV_CPU_VERBOSE=11

打开后跑一次推理，输出里能看到哪些节点被识别成了 `Subgraph`（Snippets 编译的融合子图），哪些节点仍然是独立执行的单个算子。

## Reference

  - [OpenVINO CPU 插件 Emitters
    说明（GitHub）](https://github.com/openvinotoolkit/openvino/blob/master/src/plugins/intel_cpu/src/emitters/README.md)
  - [OpenVINO Snippets
    设计文档（GitHub）](https://github.com/openvinotoolkit/openvino/blob/master/src/common/snippets/docs/snippets_design_guide.md)
  - [Xbyak](https://github.com/herumi/xbyak)
  - [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)
  - [Snippets](0576_Tools_OV_OPs_CPUImpl_Snippets)
  - [算子融合](0563_Tools_OV_MO_Fusion)
  - [OpenVINO Debug](0527_Tools_OV_Debug)
  - [OpenVINO Ops](0528_Tools_OV_OPs)
