---
Title | Tools OV MO
-- | --
Created @ | `2018-11-11T15:06:52Z`
Last Modify @| `2022-12-24T15:57:39Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/181)

---
## Brief
- MO - `Model Optimizer` 把各种框架训练的模型文件转换成 OpenVINO 可以识别的文件并优化模型
- **Support Framework :** Tensorflow/MXNet/Kaldi/ONNX
  - `Pytorch` ==> `ONNX` ==> `IR`


Parameters | Description
-- | --
`--reverse_input_channels` |   当输入为 3 通道图像时, 转换通道顺序 RGB -> BGR
--input_shape | 输入的 Shape NCHW/NHWC
--mean_values | RGB Mean values ==> `image - mean`
--scale | 归一化  ==> `image - mean) /scale`
> [models mean/scale value `和 Training 保持一致`](https://docs.openvinotoolkit.org/latest/_docs_MO_DG_prepare_model_convert_model_Convert_Model_From_TensorFlow.html)

## UseCase

### SSD_Mobilenet 
- ssd_mobilenet_v2_coco
- ssd_mobilenet_v1_fpn_640

```
python3 /opt/intel/openvino/deployment_tools/model_optimizer/mo.py \
        --input_model frozen_inference_graph.pb \
        --tensorflow_use_custom_operations_config /opt/intel/openvino/deployment_tools/model_optimizer/extensions/front/tf/ssd_v2_support.json \
        --tensorflow_object_detection_api_pipeline_config pipeline.config \
        --data_type FP16\
        --output_dir FP16
```

###  YOLO

- YOLO v3
  - /opt/intel/openvino/deployment_tools/model_optimizer/extensions/front/tf/yolo_v3.json
```
python3 /opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py -b 1 \
    --input_model ./frozen_darknet_yolov3_model.pb \
    --tensorflow_use_custom_operations_config ./yolo_v3.json \
    --data_type FP16\
    --output_dir ./FP16
```
- YOLO tiny 
  - /opt/intel/openvino/deployment_tools/model_optimizer/extensions/front/tf/yolo_v3_tiny.json
```
python3 /opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py -b 1 \
   --input_model ./frozen_darknet_yolov3_model.pb \
    --tensorflow_use_custom_operations_config ./yolo_v3_tiny.json \
    --data_type FP16\
    --output_dir ./tiny_FP16
```


