---
Title | Tools VIS netron
-- | --
Created @ | `2018-12-13T15:37:35Z`
Last Modify @| `2022-12-25T04:22:01Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/135)

---

## Reference

- [Github repo](https://github.com/lutzroeder/netron)
- [Web UI](https://lutzroeder.github.io/netron)


## Brief
- Visualizer for deep learning and machine learning models  
- **Support model files**
  - ONNX (.onnx, .pb, .pbtxt)
  - Keras (.h5, .keras)
  - CoreML (.mlmodel)
  - Caffe (.caffemodel, .prototxt)
  - Caffe2 (predict_net.pb, predict_net.pbtxt)
  - MXNet (.model, -symbol.json)
  - PyTorch (.pth)
  - Torch (.t7)
  - CNTK (.model, .cntk)
  - PaddlePaddle (__model__)
  - scikit-learn (.pkl)
  - TensorFlow Lite (.tflite)
  - TensorFlow.js (model.json, .pb)
  - TensorFlow (.pb, .meta, .pbtxt).


## Install 

```
pip install netron
```

## Usecase

```
netron -b xxx.pb
```
http://localhost:8080/

```
netron xxx.onnx --port xxx_port --host xxx_host
```
> access from <http://xxx_host:xxx_port>

