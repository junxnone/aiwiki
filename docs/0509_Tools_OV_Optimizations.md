---
Title | Tools OV Optimizations
-- | --
Created @ | `2025-03-31T08:15:29Z`
Updated @| `2025-03-31T08:15:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/509)

---

#  OpenVINO 优化
- **输入预处理**: 网络通常需要预处理后的图像，模型转换 API 可高效将均值和归一化值融入模型，OpenVINO 可加速图像预处理和转换
- **OpenVINO 异步 API**: 异步 API 将推理请求分为开始异步执行和等待两步，相比同步 API 在生产代码中更具优势，异步方式能在设备忙时让应用并行做其他事
