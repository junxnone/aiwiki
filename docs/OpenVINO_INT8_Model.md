---
Title | OpenVINO INT8 Model
-- | --
Create Date | `2020-03-18T08:44:15Z`
Update Date | `2022-05-13T01:51:00Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/182)

---
## Reference

- [calibration_tool](https://docs.openvinotoolkit.org/2019_R3.1/_inference_engine_tools_calibration_tool_README.html)
- [Intel® Neural Compressor](https://github.com/intel/neural-compressor)

## Brief
- OpenVINO INT8 Model - 量化后减少计算量(精度降低换计算量减少)
- API/CMD/Workbench 三种方式量化


![image](https://user-images.githubusercontent.com/2216970/168195305-aaebb76e-d783-462b-b178-b4fbfe3fee8a.png)

## Create INT8 Model
![image](https://user-images.githubusercontent.com/2216970/76941945-dcfe6a00-6937-11ea-91db-553b2b6396cc.png)

- Model --> IR(xml & bin)
-  Calibration Tool --> INT8

## Intel DL Boost

![image](https://user-images.githubusercontent.com/2216970/77025303-af630080-69cb-11ea-9d62-6a53dff1a859.png)

