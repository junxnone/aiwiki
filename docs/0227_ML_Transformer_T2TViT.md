---
Title | ML Transformer T2TViT
-- | --
Created @ | `2021-02-18T05:34:31Z`
Updated @| `2026-11-19T09:38:53Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/227)

---
# T2T-ViT

T2T-ViT（Tokens-to-Token ViT）针对 [ViT](/0223_ML_Transformer_ViT) 在中等规模数据（如 ImageNet）上从头训练效果不如 CNN 的问题，提出两点改进：用渐进式的 **Tokens-to-Token（T2T）模块**把相邻 token 聚合，建模局部结构并逐步缩短序列；借鉴 CNN 的设计，为 ViT 骨干网络采用 **Deep-Narrow** 结构。

## Motivation

- ViT 直接把图像切成不重叠的 patch，**不能学习到局部特征**（边缘、线条等），因此比 CNN 需要更多数据
- ViT backbone 冗余的 Attention 设计导致 feature 不够丰富，训练困难

**如下图, 分析了 `ResNet & ViT & T2T-ViT` 学习到的 `low level feature`**
- 绿色为 `low level structure features` (edges/lines)
- 红色为 ViT 中 学习到的 `invalid feature` (zeros/large value)

![image](https://user-images.githubusercontent.com/2216970/109020575-094c6a00-76f5-11eb-8487-aeda5214e8fc.png)

## Arch
- Image Soft Split to Tokens
- T2T Module x 2
- Concat Class Token + Position Embedding
- T2T-ViT Backbone

![image](https://user-images.githubusercontent.com/2216970/108311515-1eeefa80-71f0-11eb-8940-25171622cb84.png) 
 

## Tokens to Token / T2T Module

每个 T2T 模块由 **Re-structurization** 和 **Soft Split** 两步组成：

- Re-structurization：token 序列 $`T`$ 先经 Transformer 层（self-attention + MLP）得到 $`T'`$，再 reshape 回 $`s \times s`$ 的 2D 图 $`I`$
- Soft Split：对 $`I`$ 做带重叠的滑窗展开（`unfold`），把每个窗口内的 token 拼接成一个新 token，得到更短、通道更宽的序列 $`T_{i+1}`$

$$
T' = \mathrm{MLP}(\mathrm{MSA}(T)),\qquad I = \mathrm{Reshape}(T'),\qquad T_{i+1} = \mathrm{SoftSplit}(I)
$$

符号与形状：

- $`T \in \mathbb{R}^{l\times c}`$：长度为 $`l`$、通道为 $`c`$ 的 token 序列，$`l = s\times s`$
- $`T'`$：经 MSA + MLP 后形状不变，此时每个 token 已通过 attention 融合了全局信息
- $`I \in \mathbb{R}^{s\times s\times c}`$：把一维序列按空间位置还原为 2D 特征图
- $`\mathrm{SoftSplit}`$：用 kernel $`k`$、stride $`s_t`$、padding $`p`$ 的滑窗取块（与卷积的 `unfold` 相同），每个窗口内 $`k\times k`$ 个 token 拼接成一个 $`k^2 c`$ 维的新 token

**为什么叫 Soft**：ViT 的 patch 切分是不重叠的（stride = kernel），而这里 $`k > s_t`$，相邻窗口有重叠，相邻 token 共享边缘像素，局部结构（边缘、线条）因此被保留。

**token 数变化**：滑窗后每边的 token 数为 $`\lfloor (s + 2p - k)/s_t \rfloor + 1`$。例如第一次对 $`224\times224`$ 图像（$`k=7, s_t=4, p=2`$）得到 $`(224+4-7)/4+1 \approx 56`$，即 $`56\times56`$ 个 token，每个 token 通道为 $`7\times7\times3 = 147`$；再经两次（$`k=3, s_t=2, p=1`$）降到 $`28\times28`$、$`14\times14`$。通道数随 $`k^2`$ 变宽，所以 T2T 里的 Transformer 层要先把通道压到很小（如 64）再计算 attention，避免 token 数多时开销过大。

Steps | Formula | Description
-- | :-- | --
Re-structurization | ![image](https://user-images.githubusercontent.com/2216970/109027415-b9bd6c80-76fb-11eb-92de-479f77cec5c7.png) <br> ![image](https://user-images.githubusercontent.com/2216970/109027635-f8532700-76fb-11eb-9f84-398121b2e602.png) | 
Soft Split|  Image : (kernel, strde, padding) = (7, 4, 2)<br>  Tokens : (kernel, strde, padding) = (3, 2, 1)
 
![image](https://user-images.githubusercontent.com/2216970/108311565-38904200-71f0-11eb-8bba-3a3fb1fdeb7f.png)

输入 $`224\times224`$ 时，token 数依次为 $`56\times56 \to 28\times28 \to 14\times14 = 196`$。T2T 模块内的 Transformer 层通道数很小（如 64），以控制 token 数量大时的计算量。

## Backbone
- 测试了几种模式最终得出结论 : **Deep-Narrow 模式提升性能更多(减少冗余与计算复杂度，提升特征丰富性)**
  - Dense Connection 类似于DenseNet
  - **Deep-narrow** vs shallow-wide结构 类似于Wide-ResNet一文的讨论
  - Channel Attention 类似SENet
  - More Split Head 类似ResNeXt
  - Ghost操作 类似GhostNet

最终的 backbone 采用 Deep-Narrow：层数更深、embedding 维度更小（如 384）。论文给出 T2T-ViT-14 / 19 / 24 三种规格（数字为 backbone 层数），分别对标 ResNet-50 / 101 / 152 量级的参数量与计算量，在 ImageNet 从头训练即可达到约 81.5% / 81.9% / 82.3% top-1。

## Reference
- 2021-01 **[T2T-ViT]** Tokens-to-Token ViT: Training Vision Transformers from Scratch on ImageNet [[Paper](https://arxiv.org/abs/2101.11986)] [[Code](https://github.com/yitu-opensource/T2T-ViT)] 
- [vit_pytorch.t2t  - lucidrains](https://github.com/lucidrains/vit-pytorch/blob/main/vit_pytorch/t2t.py)

