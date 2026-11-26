---
Title | ML Tasks Image Classification Inception V4
-- | --
Created @ | `2019-12-04T10:51:56Z`
Updated @| `2026-11-26T01:26:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/47)

---
# Inception V4

## Brief
- Inception V4 和 Inception-ResNet 是同一篇 paper 提出
- 修改了Inception的Stem
- 添加了Reduction Block
- 添加了 ResNet

## Inception V4
- Stem
- Inception-A Block
- Inception-B Block
- Inception-C Block
- Reduction Module A
- Reduction Module B

![image](https://user-images.githubusercontent.com/2216970/70136613-4dee7e80-16c7-11ea-947e-3e903cca736d.png)



### Stem Block

![image](https://user-images.githubusercontent.com/2216970/70136969-f0a6fd00-16c7-11ea-8338-1601dab1eef7.png)

### Inception and Reduction  Blocks

Name | Block
-- | --
Inception-A | ![image](https://user-images.githubusercontent.com/2216970/70136883-d2d99800-16c7-11ea-871e-c0b9f1489431.png)
Inception-B | ![image](https://user-images.githubusercontent.com/2216970/70137020-09171780-16c8-11ea-80f1-5fed44b92085.png)
Inception-C | ![image](https://user-images.githubusercontent.com/2216970/70137050-192ef700-16c8-11ea-8888-58877a60e2b1.png)
Reduction-A |![image](https://user-images.githubusercontent.com/2216970/70137292-95293f00-16c8-11ea-97fb-6f7650fe6b3b.png)
Reduction-B | ![image](https://user-images.githubusercontent.com/2216970/70137244-7cb92480-16c8-11ea-8f21-736ea846d46b.png)


## Inception-ResNet
![image](https://user-images.githubusercontent.com/2216970/70206506-bdfe1280-1762-11ea-92f5-d4b855ed4cb1.png)

### Stem Block
- Inception-ResNet-V2 同 Inception V4
- Inception-ResNet-V1 如下
---
![image](https://user-images.githubusercontent.com/2216970/70206443-8727fc80-1762-11ea-8f47-eebb1a36bacd.png)

### ResNet v1  Inception and Reduction  Blocks

Name | Block
-- | --
Inception-ResNet-A | ![image](https://user-images.githubusercontent.com/2216970/70206186-a1ada600-1761-11ea-8771-c5c3adfc1271.png)
Inception-ResNet-B | ![image](https://user-images.githubusercontent.com/2216970/70206205-b9852a00-1761-11ea-86f7-de4530254049.png)
Inception-ResNet-C | ![image](https://user-images.githubusercontent.com/2216970/70206266-e3d6e780-1761-11ea-9499-6b5063ed4f97.png)
Reduction-A |  同 Inception V4
Reduction-B | ![image](https://user-images.githubusercontent.com/2216970/70206230-cdc92700-1761-11ea-94e9-42937de4e2df.png)

### ResNet v2  Inception and Reduction  Blocks

Name | Block
-- | --
Inception-ResNet-A | ![image](https://user-images.githubusercontent.com/2216970/70206839-bf7c0a80-1763-11ea-93ef-dea048c5d997.png)
Inception-ResNet-B | ![image](https://user-images.githubusercontent.com/2216970/70206850-c9057280-1763-11ea-878b-08be95627ea2.png)
Inception-ResNet-C | ![image](https://user-images.githubusercontent.com/2216970/70206861-d0c51700-1763-11ea-811f-5d56b5b3b556.png)
Reduction-A |  同 Inception V4
Reduction-B | ![image](https://user-images.githubusercontent.com/2216970/70206907-f7834d80-1763-11ea-890f-c6d66789c198.png)
> Reduction-B 中的 `wider Inception-ResNet-v1` 应该就是指 `Inception-ResNet-v2`

## Test Result
![image](https://user-images.githubusercontent.com/2216970/70207200-05859e00-1765-11ea-9c53-a1e4057de850.png)



## 残差缩放

$$
y=x+\alpha\,\mathcal{F}(x),\qquad \alpha\in[0.1,\,0.3]
$$

其中：

- $x$：残差块的输入；$\mathcal F(x)$：Inception 结构的输出 (经过 $1\times1$ 卷积把通道数调到与 $x$ 相同)
- $\alpha$：缩放系数，论文取 $0.1\sim0.3$；当滤波器数量超过约 1000 时，不缩放的残差分支会使训练早期发散，缩放后稳定
- 残差连接的作用与 [ResNet](/0051_ML_Tasks_Image_Classification_ResNet) 相同：让梯度直接回传，加快收敛

## 版本对比

模型 | 结构特点 | 说明
-- | -- | --
[Inception V3](/0046_ML_Tasks_Image_Classification_Inception_V2V3) | 分解卷积 + BN + Label Smoothing | 起点
Inception V4 | 统一的 Stem，更多、更均匀的 Inception-A/B/C 模块，Reduction-A/B | 没有残差，更深更宽
Inception-ResNet-V1 | Inception 模块 + 残差，计算量接近 V3 | 训练比 V3 更快
Inception-ResNet-V2 | 更宽的 Inception-ResNet，计算量接近 V4 | 精度最高

表中：论文结论是残差连接显著加快训练收敛；在同等计算量下，Inception-ResNet 精度略高于纯 Inception，但纯 Inception-V4 在训练足够久后与 Inception-ResNet-V2 相近。

## 模块组成

- Stem：网络入口，用卷积和池化把 $299\times299\times3$ 的输入变成 $35\times35\times384$ 的特征图，V4 与 Inception-ResNet-V2 共用同一个 Stem
- Inception-A/B/C：分别工作在 $35\times35$、$17\times17$、$8\times8$ 的特征图上，每组重复若干次 (V4 为 $4/7/3$ 次)
- Reduction-A/B：下采样模块，把特征图从 $35\to17\to8$ (采用并行卷积与池化的方式，见 [V2/V3](/0046_ML_Tasks_Image_Classification_Inception_V2V3) 的下采样)
- 最后接全局平均池化、Dropout (保留概率 $0.8$) 和 softmax

## Reference
- 2016 **Inception V4 & Inception-ResNet**  Inception-v4, Inception-ResNet and the Impact of Residual Connections on Learning [[paper](https://arxiv.org/pdf/1602.07261.pdf)]

