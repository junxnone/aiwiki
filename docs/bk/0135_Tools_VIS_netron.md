-----

| Title     | Tools VIS netron                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-12-13T15:37:35Z`                                |
| Updated @ | `2024-05-15T06:26:30Z`                                |
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

## Install

    pip install netron

## Usecase

    netron -b xxx.pb

<http://localhost:8080/>

    netron xxx.onnx --port xxx_port --host xxx_host

> access from <http://xxx_host:xxx_port>

## Reference

  - [Github repo](https://github.com/lutzroeder/netron)
  - [Web UI](https://netron.app/)
