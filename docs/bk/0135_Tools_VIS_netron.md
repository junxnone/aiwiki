-----

| Title     | Tools VIS netron                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-12-13T15:37:35Z`                                |
| Updated @ | `2026-11-26T09:54:57Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/135) |

-----

# 模型结构可视化工具 netron

  - Visualizer for deep learning and machine learning models
  - **Support model files**
      - ONNX (.onnx, .pb, .pbtxt)
      - Keras (.h5, .keras)
      - CoreML (.mlmodel)
      - Caffe (.caffemodel, .prototxt)
      - Caffe2 (predict\_net.pb, predict\_net.pbtxt)
      - MXNet (.model, -symbol.json)
      - PyTorch (.pth)
      - Torch (.t7)
      - CNTK (.model, .cntk)
      - PaddlePaddle (**model**)
      - scikit-learn (.pkl)
      - TensorFlow Lite (.tflite)
      - TensorFlow.js (model.json, .pb)
      - TensorFlow (.pb, .meta, .pbtxt).

> 较新版本还支持 OpenVINO IR 等格式，具体以官方支持列表为准。

## Install

    pip install netron

## Usecase

    netron -b xxx.pb

<http://localhost:8080/>

    netron xxx.onnx --port xxx_port --host xxx_host

> access from <http://xxx_host:xxx_port>

其中：

  - `netron
    <文件>`：启动本地服务并在浏览器中打开模型图；`--port`、`--host`：指定监听端口和地址，便于在远程服务器上查看
  - `-b`：以浏览器方式打开

在 Python 里调用：

``` python
import netron
netron.start('model.onnx')       # 启动服务并打开浏览器
```

## 能看到什么

| 内容    | 说明                            |
| ----- | ----------------------------- |
| 计算图结构 | 每个节点（算子）及其连接                  |
| 节点属性  | 卷积的 kernel、stride、padding 等参数 |
| 输入输出  | 张量的名称、类型、形状                   |
| 权重    | 点击节点可查看权重的形状和数值               |

表中：对比结论：netron 适合快速检查转换后的模型结构是否正确，例如确认 ONNX 导出后的算子和形状；ONNX 相关可视化见 [ONNX
可视化工具](https://github.com/junxnone/aiwiki/issues/134)。

## Reference

  - [Github repo](https://github.com/lutzroeder/netron)
  - [Web UI](https://netron.app/)
