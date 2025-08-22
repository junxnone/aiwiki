-----

| Title     | paper AdaBLDM envs                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-08-08T07:55:07Z`                                |
| Updated @ | `2025-08-22T09:15:19Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/524) |

-----

# AdaBLDM 环境设置

## CUDA

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

  - **检查 xpu 是否正常**

<!-- end list -->

``` 
pip install ipython
ipython
In [1]: import torch

In [2]: torch.xpu.is_available()
Out[2]: True

```
