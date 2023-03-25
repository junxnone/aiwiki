---
Title | ML AutoML NAS ProxylessNAS
-- | --
Created @ | `2020-07-23T08:13:47Z`
Updated @| `2023-03-25T14:36:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/387)

---

# ProxylessNAS 

- `Proxy Task` -> `Target Task`
- Proxy - 小数据集(`Cifar`)/`Fewer Blocks`/`Fewer Epoch` -> 大数据 (`ImageNet`)/`Stacked Top-Performing Bloocks`/Retraining
- 把  NAS 视为 `path-level pruning` 的过程
- Path-Level pruning -  prune redundant parts
- Binarized Architecture parameters - Binary Gate(0-prune/1-keep)
- DAG
  - 之前的 NAS 把 operation 作为 edge
  - Proxyless NAS 使用 `Mixed Operation` 作为一个 edge, 即 `(operation + Binary Gate) x N`

Proxy-Based vs Proxy-Less
-- |
![image](https://user-images.githubusercontent.com/2216970/88266108-35d47980-cd01-11ea-9004-221815c42bf2.png)




## Arch
Binarized Architecture parameters
-- |
![image](https://user-images.githubusercontent.com/2216970/88269201-2c014500-cd06-11ea-9f72-23ed4c096219.png)

Cifar-10 Op Set | ImageNet Op Set (`various kernel sizes`/`expansion ratios`)
-- | -- 
3 × 3 dilated depthwise-separable convolution | MBConv layers  3x3/3
Identity | MBConv layers  3x3/6
3 × 3 depthwise-separable convolution | MBConv layers  5x5/3
5 × 5 depthwise-separable convolution | MBConv layers  5x5/6
7 × 7 depthwise-separable convolution | MBConv layers  7x7/3
3 × 3 average pooling | MBConv layers  7x7/6
3 × 3 max pooling

Name | DARTS | ProxyLess
-- | -- | --
Output | Operation Output 求和  | Binary Gate 取一个路径 Output
计算 | 每次计算 N Path | 每次计算 1 Path
Memory | M | M x N
Update Weights | standard gradient descent | BinaryConnect

## Latency Differentiable
- 抽象成连续函数
- Latency regularization Loss
![image](https://user-images.githubusercontent.com/2216970/88273131-4d652f80-cd0c-11ea-96a0-4aa94c060be9.png)

## Search Result - GPU/CPU/Mobile
![image](https://user-images.githubusercontent.com/2216970/88272851-ecd5f280-cd0b-11ea-8a2a-f4ba93304c5f.png)


## Reference

- [paper - 2018.12 - ProxylessNAS: Direct Neural Architecture Search on Target Task and Hardware](https://arxiv.org/pdf/1812.00332.pdf)
- [Github](https://github.com/mit-han-lab/proxylessnas)
- [【ProxylessNAS】2019-ICLR-ProxylessNAS Direct Neural Architecture Search on Target Task and Hardware-论文阅读](https://www.cnblogs.com/chenbong/p/13337587.html)
- [ProxyLessNAS](https://blog.csdn.net/aliceleehx/article/details/88663004)



