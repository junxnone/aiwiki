-----

| Title     | Tools OV Tips                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-12-09T05:35:25Z`                                |
| Updated @ | `2026-11-26T09:54:41Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/184) |

-----

# Tips

OpenVINO 使用中的小技巧，目前记录：动态输入尺寸（reshape）。

## Dynamic Input Shape

  - method for reshape the input of model and all intermediate layers
      - `C++`
          - `CNNNetwork::reshape`
          - `InferenceEngine::CNNNetwork::setBatchSize`
      - `Python`
          - `ie_api.IENetwork.reshape`
  - 不能在 `setBatchsize` 后使用 `reshape`

> setBatchsize 会将内部模型表示转换为旧模型表示

  - input size 应该是 **16** 的倍数(下采样的倍数 ？？)
  - 读取 IR 文件创建 `network` 后，加载到 `plugin` 之前 `reshape`

<!-- end list -->

    ReadNetwork -> reshape(input_1_shape) -> LoadNetwork -> infer(input_1)
               \
                -> reshape(input_2_shape) -> LoadNetwork -> infer(input_2)

关于「16 的倍数」：网络里每做一次 stride 为 2 的下采样，特征图尺寸减半，要使每次减半后仍是整数，输入尺寸应满足：

$$ H\\bmod 2^{n}=0,\\qquad W\\bmod 2^{n}=0 $$

其中：

  - $H,W$：输入的高和宽；$n$：网络中的下采样（含池化）次数
  - 若 $n=4$（如典型 U-Net 有 4 次下采样），则 $2^4=16$，所以输入尺寸必须是 16
    的倍数；否则上采样后的特征图尺寸无法与跳连对齐

**Examples**

``` python
from openvino.inference_engine import IECore
ie = IECore()
net = ie.read_network(model=model_xml, weights=model_bin)
net.reshape({'input': [1, 3, new_height, new_width]})
exec_net = ie.load_network(network=net, device_name=device)
```

其中：`reshape` 的参数是「输入名 → 新形状」的字典，形状为 $\[N,C,H,W\]$；必须在 `load_network`
之前调用，因为加载后会按当前形状编译。

### 新版 API（OpenVINO 2022 及之后）

``` python
import openvino as ov
core = ov.Core()
model = core.read_model("model.xml")
model.reshape([1, 3, new_height, new_width])   # 静态改形状
# model.reshape([1, 3, -1, -1])                 # 把 H、W 设为动态维度
compiled = core.compile_model(model, "CPU")
```

  - 新版用 `Core.read_model` + `model.reshape`，`-1` 表示动态维度
  - 对比结论：旧版（`IENetwork.reshape`）是静态改形，每次改形都要重新加载；新版支持动态维度，一次编译可处理多种尺寸（部分设备对动态形状的支持有限）

## Reference

  - [Using Shape
    Inference](https://docs.openvinotoolkit.org/latest/openvino_docs_IE_DG_ShapeInference.html)
  - [unet 网络接受任意大小的输入](https://www.cnblogs.com/fanhaha/p/7867301.html)
  - [unet openvino reshape inference
    code](https://github.com/IntelAI/unet/blob/master/2D/openvino/inference_openvino.py#L252)
