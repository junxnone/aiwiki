-----

| Title     | CV Tools                                             |
| --------- | ---------------------------------------------------- |
| Created @ | `2021-10-11T02:38:42Z`                               |
| Updated @ | `2026-11-26T10:18:23Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/63) |

-----

# CV Tools

计算机视觉常用的开源库。

  - **OpenCV** \[[repo](https://github.com/opencv/opencv)\]
    \[[docs](https://opencv.org/)\]
  - **Numpy** \[[repo](https://github.com/numpy)\]
    \[[docs](https://numpy.org/)\]
  - **Scikit-Image**
    \[[repo](https://github.com/scikit-image/scikit-image)\]
    \[[docs](https://scikit-image.org/)\]
  - **TorchVision** \[[repo](https://github.com/pytorch/vision)\]
    \[[docs](https://pytorch.org/vision/stable/index.html)\]
  - **MMCV** \[[repo](https://github.com/open-mmlab/mmcv)\]
    \[[docs](https://mmcv.readthedocs.io/zh_CN/latest/)\]
  - **CV-CUDA** \[[repo](https://github.com/CVCUDA/CV-CUDA)\]
    \[[docs](https://cvcuda.github.io/)\]

## 对比

| 库            | 定位             | 特点                                                                                          |
| ------------ | -------------- | ------------------------------------------------------------------------------------------- |
| OpenCV       | 通用 CV 库        | 功能最全，C++ 核心，有 Python 绑定，见 [Image Processing](https://github.com/junxnone/aiwiki/issues/316) |
| Numpy        | 数组计算           | 图像在内存中就是数组，见 [Numpy](https://github.com/junxnone/aiwiki/issues/328)                         |
| Scikit-Image | 图像处理算法         | 纯 Python，接口简洁，适合科研与教学                                                                       |
| TorchVision  | 深度学习视觉         | 数据集、预训练模型、图像变换，与 PyTorch 集成                                                                 |
| MMCV         | OpenMMLab 的基础库 | 提供训练框架组件与 CUDA 算子                                                                           |
| CV-CUDA      | GPU 加速的前后处理    | NVIDIA 的 GPU 图像处理算子，用于加速推理流水线                                                               |

表中：

  - **定位**：库的主要用途；**特点**：区别于其他库的地方
  - 对比结论：传统图像处理首选 OpenCV；深度学习训练用 TorchVision / MMCV；GPU 上的批量前后处理用
    CV-CUDA
