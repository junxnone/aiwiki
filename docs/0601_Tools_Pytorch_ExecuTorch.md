---
Title | Tools Pytorch ExecuTorch
-- | --
Created @ | `2026-10-21T07:56:35Z`
Updated @| `2026-10-21T07:56:35Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/601)

---
# ExecuTorch

ExecuTorch 是 PyTorch 官方推出的移动端/嵌入式设备推理运行时，是 Tools Pytorch TorchScript 一文提到的"TorchScript 嵌入式运行时"的正式替代品，建立在 Tools Pytorch Export 介绍的 `torch.export` 之上。

## 为什么需要一个新的嵌入式运行时

TorchScript 的嵌入式部署路径（trace/script 后用 LibTorch 跑在移动端）存在几个痛点：产物体积大（LibTorch 运行时本身不小，不适合对包体积敏感的移动端）、对硬件专有加速芯片（NPU/DSP 等）的适配需要各自写定制逻辑、trace 的"悄悄固化"问题在嵌入式这种对正确性要求高的场景里风险更明显。ExecuTorch 从头为"端侧部署"这个场景设计，直接建立在 `torch.export` 产出的 `ExportedProgram` 之上，天然继承了后者"静态图+显式 shape 约束"的保证。

## 整体流程：导出 → Edge 转换 → 后端委托 → 产出 .pte

1. **导出**：用 `torch.export` 把模型导出成 `ExportedProgram`（见 Tools Pytorch Export）；
2. **Edge 转换（`to_edge`）**：把导出图进一步规范化成适合端侧执行的中间表示，补充完整的张量元信息（shape、dtype 等）；
3. **后端委托（Delegate）**：针对特定硬件后端（比如移动 GPU/NPU），用对应的 **Partitioner**（如 `XnnpackPartitioner`）把计算图里能被该硬件加速的部分"委托"给专有后端执行，剩余部分走通用 CPU 实现——这一步是可插拔的，不同硬件厂商可以提供各自的 Partitioner 后端；
4. **产出可执行文件**：调用 `to_executorch()` 生成最终的 `.pte` 文件，模型权重也可以选择单独序列化成 `.ptd` 文件；
5. **端侧加载执行**：用 ExecuTorch 的轻量级运行时加载 `.pte` 文件执行推理，运行时本身的体积比 LibTorch 小得多，更适合移动端/嵌入式场景对包体积和启动速度的要求。

## 核心设计保证

因为建立在 `torch.export` 之上，ExecuTorch 的导出产物继承了几条关键保证：**Shape 合规**（图里的 shape 满足每个算子的语义约束）、**图归一化**（不含任何 Python 语义，算子被归约到一组确定的集合）、**张量元信息完整**（输入/中间值/输出的 shape 信息在图里都能查到）、**程序溯源信息完整**（能追溯回原始 `nn.Module` 的层级结构和调用栈）——这些保证是端侧部署对"正确性和可预测性"要求的直接体现，也是和老的 TorchScript 嵌入式路径相比最大的架构升级。

## Reference
- [ExecuTorch 官方文档](https://pytorch.org/executorch/stable/index.html)
- [Model Export and Lowering — ExecuTorch 官方教程](https://docs.pytorch.org/executorch/stable/tutorials/export-to-executorch-tutorial.html)
- ExecuTorch -- A Unified PyTorch Solution to Run AI Models On-Device（PyTorch 团队论文）
- Tools Pytorch Export
- [Tools Pytorch TorchScript](0490_Tools_Pytorch_TorchScript)

