---
Title | Tools OV DevCloud
-- | --
Created @ | `2020-12-09T07:28:51Z`
Updated @| `2026-11-26T09:54:44Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/179)

---
# DevCloud

Intel DevCloud 是 Intel 提供的在线测试环境：不需要自己购买硬件，就可以在远程的不同 Intel 设备（CPU、GPU、VPU 等）上运行并对比 OpenVINO 模型的性能。

> 该服务可能已调整或下线，请以官方页面为准。

- 测试不同 `Device`上的 `Performance`
- 使用 `Jupyter Notebook`

## 同步与异步推理

Mode | Inference Time | Throughput
-- | -- | --
Sync | ![image](https://user-images.githubusercontent.com/2216970/101599341-91936b00-3a34-11eb-834f-a73882442374.png) | ![image](https://user-images.githubusercontent.com/2216970/101599361-97894c00-3a34-11eb-8458-e78e9c225b02.png)
Async | ![image](https://user-images.githubusercontent.com/2216970/101599567-ec2cc700-3a34-11eb-8e8b-c52258dbc6af.png) | ![image](https://user-images.githubusercontent.com/2216970/101599575-efc04e00-3a34-11eb-9b98-bb5586be3114.png)

![image](https://user-images.githubusercontent.com/2216970/101602560-4596f500-3a39-11eb-9790-d5cda88739cb.png)
-- |

表中：

- **Sync**：每次发出一个推理请求，等它完成再发下一个；**Async**：同时提交多个请求，设备并行处理
- 两列图片分别是该模式下的单次推理时间和吞吐量的测试结果（原文档附带）
- 对比结论：异步模式通常吞吐量更高，单次延迟不一定更低

两种指标的关系：

$$
\text{Throughput}_{sync}\approx\frac{1}{T_{latency}},\qquad \text{Throughput}_{async}\approx\frac{N_{req}}{T_{latency}}\ (\text{直到设备饱和})
$$

其中：

- $T_{latency}$：单个推理请求的耗时（秒）；Throughput 单位为每秒处理的帧数（FPS）
- $N_{req}$：同时在途的推理请求数
- 请求数增加到设备算力饱和后，吞吐量不再增加，再增加只会使延迟变大

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

```mermaid
flowchart LR
    A[准备模型和脚本] --> B[编写 shell 脚本]
    B --> C[qsub 提交作业到不同设备节点]
    C --> D[收集日志]
    D --> E[汇总并绘制性能对比图]
```

图中：从左到右是在 DevCloud 上的一次测试流程：脚本提交到不同的 Edge 节点运行，各节点写出日志，最后在 notebook 里汇总。

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

| 工具 | 作用 |
| --- | --- |
| `qsub` | 向作业调度系统提交作业，指定节点或设备类型 |
| `pbsnodes` | 查看集群中各节点的状态 |
| `qarpo` | DevCloud 的 Python 辅助库，含进度显示和结果展示 |

表中：`qsub`、`pbsnodes` 来自 PBS（作业调度系统）命令；对比结论：DevCloud 本质是「一个带作业调度的远程设备池」。

## Reference
- [DevCloud](https://devcloud.intel.com/edge/)

