---
Title | paper AdaBLDM envs
-- | --
Created @ | `2025-08-08T07:55:07Z`
Updated @| `2025-08-08T07:58:54Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/524)

---
- **安装依赖**
```
pip install gradio 
```

```
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/xpu
```


- **检查 xpu 是否正常**

```
pip install ipython
ipython
In [1]: import torch

In [2]: torch.xpu.is_available()
Out[2]: True

```
