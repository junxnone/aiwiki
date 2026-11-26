-----

| Title     | Tools Darknet                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-09-06T07:36:20Z`                                |
| Updated @ | `2026-11-26T09:54:53Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/260) |

-----

# Darknet

Darknet 是 Joseph Redmon 用 C 和 CUDA 编写的开源神经网络框架，也是最早的 YOLO
系列目标检测模型的官方实现。结构简单、依赖少，通过 cfg 配置文件描述网络。

  - [Darknet AlexeyAB](/Darknet_AlexeyAB)
  - [Darknet config files](/Darknet_cfg_files)

## 版本

| 仓库               | 说明                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| pjreddie/darknet | 原作者版本，YOLOv1\~v3                                                                                  |
| AlexeyAB/darknet | 社区维护的增强版，支持 YOLOv4 等，用于目标检测训练，见 [Darknet AlexeyAB](https://github.com/junxnone/aiwiki/issues/261) |

表中：对比结论：做新项目训练一般使用 AlexeyAB 版本；原版适合学习和运行经典 YOLOv3。

## Build

### Build with CPU only

    git clone https://github.com/pjreddie/darknet
    cd darknet
    make

### Build with OpenCV

  - Change the Makefile

<!-- end list -->

    vi Makefile

    OPENCV=1

    make

  - Test

<!-- end list -->

    ./darknet imtest data/eagle.jpg

Makefile 里常用的开关：

| 开关         | 作用                 |
| ---------- | ------------------ |
| `GPU=1`    | 使用 CUDA 在 GPU 上运行  |
| `CUDNN=1`  | 使用 cuDNN 加速        |
| `OPENCV=1` | 使用 OpenCV 读写图像和视频  |
| `OPENMP=1` | 使用 OpenMP 多线程（CPU） |

表中：开关改为 1 后重新 `make`；对比结论：有 NVIDIA GPU 时开启 `GPU` 和 `CUDNN` 速度提升最明显。

## Run

    wget https://pjreddie.com/media/files/yolov3.weights
    ./darknet detect cfg/yolov3.cfg yolov3.weights data/dog.jpg
    
    wget https://pjreddie.com/media/files/yolov3-tiny.weights
    ./darknet detect cfg/yolov3-tiny.cfg yolov3-tiny.weights data/dog.jpg

其中：

  - `detect`：检测子命令；后面依次是网络配置文件、权重文件、输入图片
  - 结果保存为 `predictions.jpg`，并在终端打印检测到的类别和置信度
  - `yolov3-tiny` 是更小更快的版本，精度较低
  - 模型原理见 [YOLO
    V3](https://github.com/junxnone/aiwiki/issues/56)，配置文件说明见
    [Config Files](https://github.com/junxnone/aiwiki/issues/262)

## Reference

  - [官网](https://pjreddie.com/darknet/)
  - [Github repo](https://github.com/pjreddie/darknet)
  - [ for object detection training
    repo](https://github.com/AlexeyAB/darknet)
