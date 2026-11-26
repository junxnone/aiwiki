---
Title | Tools OV
-- | --
Created @ | `2018-08-26T08:02:48Z`
Updated @| `2026-11-26T10:21:00Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/185)

---
# OpenVINO

OpenVINO 是 Intel 的深度学习推理工具套件：把训练好的模型转换并优化后，部署到 Intel 的 CPU、集成显卡、NPU 等设备上高效运行。

- [Model Optimizer](https://github.com/junxnone/aiwiki/issues/181)
- [Inference Engine](https://github.com/junxnone/aiwiki/issues/180)
- [DevCloud](https://github.com/junxnone/aiwiki/issues/179)
- [Workbench](https://github.com/junxnone/aiwiki/issues/178)
- [Post-Training Optimization Toolkit](https://github.com/junxnone/aiwiki/issues/177)
- [Security](https://github.com/junxnone/aiwiki/issues/176)
- [OpenVINO INT8 Model](https://github.com/junxnone/aiwiki/issues/182)
- [OpenVINO Compile Tool](https://github.com/junxnone/aiwiki/issues/183)
- [OpenVINO Tips](https://github.com/junxnone/aiwiki/issues/184)
- [OpenVINO Debug](https://github.com/junxnone/aiwiki/issues/527)

## 基本流程

```mermaid
flowchart LR
    A[训练框架模型 TF PyTorch ONNX] --> B[Model Optimizer 转成 IR]
    B --> C[可选 量化 INT8]
    C --> D[Inference Engine 在设备上推理]
```

图中：

- 先把不同框架的模型转成统一的中间表示（IR，由 .xml 与 .bin 组成），再可选做 INT8 量化，最后由推理引擎在目标设备上执行
- 关键结论：「转换 → 优化 → 部署」，同一个 IR 可以在不同 Intel 设备间复用

## 文章说明

| 文章 | 内容 |
| --- | --- |
| Model Optimizer | 模型转换与图优化（融合、折叠等） |
| Inference Engine | 推理 API，加载 IR 并在设备上执行 |
| POT / NNCF | 训练后量化；POT 已被 [NNCF](https://github.com/junxnone/aiwiki/issues/451) 替代 |
| INT8 Model | INT8 模型的使用 |
| Compile Tool | 把模型离线编译成设备可直接加载的 blob |
| Workbench / DevCloud | 图形化工具与在线测试环境（均可能已弃用） |
| Tips / Debug | 动态形状、日志与调试 |

表中：对比结论：入门按「Model Optimizer → Inference Engine」顺序阅读，部署优化再看量化与调试。

##  Device Support
  - CPU
  - iGPU
  - VPU/NPU
  - ~~FPGA~~

| 设备 | 说明 |
| --- | --- |
| CPU | 通用，支持最广 |
| iGPU | 集成显卡，适合并行度高的网络 |
| VPU / NPU | 专用的低功耗 AI 加速器 |
| ~~FPGA~~ | 已不再支持 |

表中：对比结论：同一模型在不同设备上性能不同，可用 `benchmark_app` 实测对比。

## Reference

- [openvinotoolkit Docs](https://docs.openvinotoolkit.org/latest/index.html)
- [Intel OpenVINO配置和使用](https://blog.csdn.net/smallhujiu/article/details/83650755)
- [OpenVINO - opencv/dldt ](https://github.com/opencv/dldt)
- [OpenVINO Downloads](https://download.01.org/openvinotoolkit/)

