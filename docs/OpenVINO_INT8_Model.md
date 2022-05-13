---
Title | OpenVINO INT8 Model
-- | --
Create Date | `2020-03-18T08:44:15Z`
Update Date | `2022-05-13T02:10:13Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/182)

---
## Reference
- [Optimizing models post-training](https://docs.openvino.ai/latest/pot_introduction.html#doxid-pot-introduction)
- [calibration_tool](https://docs.openvinotoolkit.org/2019_R3.1/_inference_engine_tools_calibration_tool_README.html)
- [NNCF](https://github.com/openvinotoolkit/nncf)
- [Intel® Neural Compressor](https://github.com/intel/neural-compressor)

## Brief
- OpenVINO INT8 Model - 增加性能/减少模型大小
- POT - `Post-training Optimization Tool`
- API/CMD/Workbench 三种方式量化
- Quantization Methods
  - Default Quantization (仅需要未注释的数据集)
  - Accuracy-aware Quantization (需要标注的数据集以控制 `Accuracy Drop`)

![image](https://user-images.githubusercontent.com/2216970/168196362-17a40e1f-479e-48a8-9553-8681ed9faee3.png) 

## Default Quantization
- POT Python API/POT cmd-line

 ![image](https://user-images.githubusercontent.com/2216970/168195305-aaebb76e-d783-462b-b178-b4fbfe3fee8a.png)


## Create INT8 Model
![image](https://user-images.githubusercontent.com/2216970/76941945-dcfe6a00-6937-11ea-91db-553b2b6396cc.png)

- Model --> IR(xml & bin)
-  Calibration Tool --> INT8

## Intel DL Boost

![image](https://user-images.githubusercontent.com/2216970/77025303-af630080-69cb-11ea-9d62-6a53dff1a859.png)

