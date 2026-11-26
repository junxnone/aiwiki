-----

| Title     | paper AdaBLDM envs                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-08-08T07:55:07Z`                                |
| Updated @ | `2026-11-26T10:11:23Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/524) |

-----

# AdaBLDM 环境设置

AdaBLDM 的运行环境配置，分为 NVIDIA GPU（CUDA）和 Intel GPU（XPU）两种。

``` mermaid
flowchart LR
    A[选择设备 CUDA 或 XPU] --> B[安装对应 PyTorch]
    B --> C[安装其他依赖]
    C --> D[检查设备可用]
```

图中：先按设备安装对应版本的 PyTorch，再装其余依赖，最后确认设备可用。

## CUDA

安装带 CUDA 的 PyTorch（按显卡驱动选择版本），其余依赖与下面 XPU 的依赖列表相同。

## XPU

  - **安装依赖**

<!-- end list -->

    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/xpu

    gradio==5.43.1
    transformers==4.22.0
    opencv-python
    einops==0.8.1
    pytorch-lightning==1.5.0
    omegaconf==2.3.0
    scipy==1.15.3
    open_clip_torch==3.1.0

| 依赖                             | 作用           |
| ------------------------------ | ------------ |
| gradio                         | 搭建演示界面       |
| transformers、open\_clip\_torch | 文本编码、CLIP 相关 |
| pytorch-lightning、omegaconf    | 训练框架与配置管理    |
| einops                         | 张量维度重排       |
| opencv-python、scipy            | 图像与科学计算      |

表中：依赖版本是原环境验证过的版本，更换版本可能出现兼容性问题（尤其是 `transformers`、`pytorch-lightning`
这两个较旧的固定版本）。

  - **检查 xpu 是否正常**

<!-- end list -->

``` 
pip install ipython
ipython
In [1]: import torch

In [2]: torch.xpu.is_available()
Out[2]: True

```

其中：`torch.xpu.is_available()` 返回 `True` 表示 PyTorch 能够识别 Intel GPU；返回
`False` 时请检查驱动和 PyTorch 的 XPU 版本是否匹配。

相关方法见
[DualAnoDiff](https://github.com/junxnone/aiwiki/issues/522)、[AnomalyDiffusion](https://github.com/junxnone/aiwiki/issues/513)。
