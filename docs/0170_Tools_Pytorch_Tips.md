---
Title | Tools Pytorch Tips
-- | --
Created @ | `2021-04-13T07:54:18Z`
Updated @| `2026-10-21T08:03:12Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/170)

---
# Pytorch Tips

## 设备无关代码写法

统一用 `torch.device` 控制运行设备，而不是在代码里到处写死 `.cuda()`，方便同一份代码在有/没有 GPU 的机器上都能跑：

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
inputs = inputs.to(device)
```

## 固定随机种子（保证实验可复现）

```python
import torch, random, numpy as np

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
```

## 查看当前 PyTorch 版本

```python
import torch
print(torch.__version__)
```

## UseCase

### pytorch 设置 GPU

```
os.environ["CUDA_VISIBLE_DEVICES"] = 1
```

### 查看需要的 `cuda` 版本

```
import torch
print(torch.version.cuda)
```

### 查看 pytorch 编译环境

> 下面两个命令现在依然适用，只是示例输出来自较早期的 PyTorch/CUDA 版本（仅作格式参考，不代表当前版本信息）。

```
print(torch.__config__.show())
```
```
PyTorch built with:
  - GCC 7.3
  - Intel(R) Math Kernel Library Version 2019.0.4 Product Build 20190411 for Intel(R) 64 architecture applications
  - Intel(R) MKL-DNN v0.21.1 (Git Hash 7d2fd500bc78936d1d648ca713b901012f470dbc)
  - OpenMP 201511 (a.k.a. OpenMP 4.5)
  - NNPACK is enabled
  - CUDA Runtime 10.1
  - NVCC architecture flags: -gencode;arch=compute_37,code=sm_37;-gencode;arch=compute_50,code=sm_50;-gencode;arch=compute_60,code=sm_60;-gencode;arch=compute_61,code=sm_61;-gencode;arch=compute_70,code=sm_70;-gencode;arch=compute_75,code=sm_75;-gencode;arch=compute_37,code=compute_37
  - CuDNN 7.6.3
  - Magma 2.5.1
  - Build settings: BLAS=MKL, BUILD_NAMEDTENSOR=OFF, BUILD_TYPE=Release, CXX_FLAGS= -Wno-deprecated -fvisibility-inlines-hidden -fopenmp -DUSE_FBGEMM -DUSE_QNNPACK -DUSE_PYTORCH_QNNPACK -O2 -fPIC -Wno-narrowing -Wall -Wextra -Wno-missing-field-initializers -Wno-type-limits -Wno-array-bounds -Wno-unknown-pragmas -Wno-sign-compare -Wno-unused-parameter -Wno-unused-variable -Wno-unused-function -Wno-unused-result -Wno-strict-overflow -Wno-strict-aliasing -Wno-error=deprecated-declarations -Wno-stringop-overflow -Wno-error=pedantic -Wno-error=redundant-decls -Wno-error=old-style-cast -fdiagnostics-color=always -faligned-new -Wno-unused-but-set-variable -Wno-maybe-uninitialized -fno-math-errno -fno-trapping-math -Wno-stringop-overflow, DISABLE_NUMA=1, PERF_WITH_AVX=1, PERF_WITH_AVX2=1, PERF_WITH_AVX512=1, USE_CUDA=ON, USE_EXCEPTION_PTR=1, USE_GFLAGS=OFF, USE_GLOG=OFF, USE_MKL=ON, USE_MKLDNN=ON, USE_MPI=OFF, USE_NCCL=ON, USE_NNPACK=ON, USE_OPENMP=ON, USE_STATIC_DISPATCH=OFF, 
```

### torch 环境信息

```
$ python -c 'from torch.utils.collect_env import main; main()'
Collecting environment information...
PyTorch version: 1.0.1
Is debug build: No
CUDA used to build PyTorch: 9.0.176

OS: Ubuntu 18.04.2 LTS
GCC version: (Ubuntu 6.5.0-2ubuntu1~18.04) 6.5.0 20181026
CMake version: version 3.10.2

Python version: 3.6
Is CUDA available: Yes
CUDA runtime version: 9.0.176
GPU models and configuration:
GPU 0: GeForce GTX 1080 Ti
GPU 1: GeForce GTX 1080 Ti
GPU 2: GeForce GTX 1080 Ti

Nvidia driver version: 430.50
cuDNN version: Probably one of the following:
/usr/lib/x86_64-linux-gnu/libcudnn.so.7.6.5.dpkg-new
/usr/local/cuda-10.0/include/libcudnn7_7.6.5.32-1+cuda10.0_amd64.deb
/usr/local/cuda-10.0/lib64/libcudnn.so
/usr/local/cuda-10.0/lib64/libcudnn.so.7
/usr/local/cuda-10.0/lib64/libcudnn.so.7.6.5
/usr/local/cuda-10.0/lib64/libcudnn_static.a
/usr/local/cuda-9.0/lib64/libcudnn.so
/usr/local/cuda-9.0/lib64/libcudnn.so.7
/usr/local/cuda-9.0/lib64/libcudnn.so.7.3.0
/usr/local/cuda-9.0/lib64/libcudnn_static.a

Versions of relevant libraries:
[pip] Could not collect
[conda] Could not collect
```

## Reference
- [Tools Pytorch](0168_Tools_Pytorch)

