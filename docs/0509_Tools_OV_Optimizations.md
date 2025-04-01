---
Title | Tools OV Optimizations
-- | --
Created @ | `2025-03-31T08:15:29Z`
Updated @| `2025-04-01T08:27:34Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/509)

---

#  OpenVINO 优化
- **输入预处理**: 网络通常需要预处理后的图像，模型转换 API 可高效将均值和归一化值融入模型，OpenVINO 可加速图像预处理和转换
- **OpenVINO 异步 API**: 异步 API 将推理请求分为开始异步执行和等待两步，相比同步 API 在生产代码中更具优势，异步方式能在设备忙时让应用并行做其他事

## 输入预处理

- **设置用户数据格式：** `ElementType`/`Shape`/`Layout`/`ColorFormtat`

```
from openvino.preprocess import PrePostProcessor
from openvino.preprocess import ColorFormat
from openvino import Layout, Type

ppp = PrePostProcessor(model)

ppp.input(input_name).tensor() \
        .set_element_type(Type.u8) \
        .set_shape([1, 480, 640, 3]) \
        .set_layout(Layout('NHWC')) \
        .set_color_format(ColorFormat.BGR)

```

- **设置模型格式**

```
# `model's input` already `knows` it's shape and data type, no need to specify them here
ppp.input(input_name).model().set_layout(Layout('NCHW'))
```

- **预处理**

```
from openvino.preprocess import ResizeAlgorithm
ppp.input(input_name).preprocess() \
    .convert_element_type(Type.f32) \
    .convert_color(ColorFormat.RGB) \
    .resize(ResizeAlgorithm.RESIZE_LINEAR) \
    .mean([100.5, 101, 101.5]) \
    .scale([50., 51., 52.])
# .convert_layout(Layout('NCHW')) # Not needed, such conversion will be added implicitly
```

```
model = ppp.build()
```
