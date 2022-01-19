---
Title | OpenVINO devcloud
-- | --
Create Date | `2020-12-09T07:28:51Z`
Update Date | `2022-01-19T08:34:21Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/179)

---
## Reference
- [DevCloud](https://devcloud.intel.com/edge/)

## Brief
- 测试不同 `Device`上的 `Performance`
- 使用 `Jupyter Notebook`

Mode | Inference Time | Throughput
-- | -- | --
Sync | ![image](https://user-images.githubusercontent.com/2216970/101599341-91936b00-3a34-11eb-834f-a73882442374.png) | ![image](https://user-images.githubusercontent.com/2216970/101599361-97894c00-3a34-11eb-8458-e78e9c225b02.png)
Async | ![image](https://user-images.githubusercontent.com/2216970/101599567-ec2cc700-3a34-11eb-8e8b-c52258dbc6af.png) | ![image](https://user-images.githubusercontent.com/2216970/101599575-efc04e00-3a34-11eb-9b98-bb5586be3114.png)

![image](https://user-images.githubusercontent.com/2216970/101602560-4596f500-3a39-11eb-9790-d5cda88739cb.png)
-- |


**Files**
- jupyter notebook
- python inference script 
- OpenVINO IR models
- test images/videos/labels

**Pipeline**
- *Optional* - Convert Tensorflow/Pytorch model to OpenVINO IR
- Create shell script to run on Edge Node
- Create Jobs on jupyter notebook on different devices
- Summary logs and plot performance


## Details
- Python
  - qarpo
    - demoutils
      - progressUpdate
    - displayMultiversionURL
  - applicationMetricWriter
- Shell
  - pbsnodes
  - qsub

