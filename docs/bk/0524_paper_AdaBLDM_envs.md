-----

| Title     | paper AdaBLDM envs                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-08-08T07:55:07Z`                                |
| Updated @ | `2025-08-08T07:59:32Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/524) |

-----

# AdaBLDM 环境设置

## CUDA

## XPU

  - **安装依赖**

<!-- end list -->

    pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/xpu

``` 
pip install gradio 
```

  - **检查 xpu 是否正常**

<!-- end list -->

``` 
pip install ipython
ipython
In [1]: import torch

In [2]: torch.xpu.is_available()
Out[2]: True

```
