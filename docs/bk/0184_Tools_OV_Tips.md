-----

| Title         | Tools OV Tips                                         |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-12-09T05:35:25Z`                                |
| Last Modify @ | `2022-12-24T16:00:13Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/184) |

-----

## Reference

  - [Using Shape
    Inference](https://docs.openvinotoolkit.org/latest/openvino_docs_IE_DG_ShapeInference.html)
  - [unet 网络接受任意大小的输入](https://www.cnblogs.com/fanhaha/p/7867301.html)
  - [unet openvino reshape inference
    code](https://github.com/IntelAI/unet/blob/master/2D/openvino/inference_openvino.py#L252)

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

**Examples**

``` python
from openvino.inference_engine import IECore
ie = IECore()
net = ie.read_network(model=model_xml, weights=model_bin)
net.reshape({'input': [1, 3, new_height, new_width]})
exec_net = ie.load_network(network=net, device_name=device)
```
