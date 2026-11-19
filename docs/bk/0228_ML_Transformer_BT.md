-----

| Title     | ML Transformer BT                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-02-18T05:46:22Z`                                |
| Updated @ | `2026-11-19T09:38:55Z`                                |
| Labels    | `index`                                               |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/228) |

-----

# Bottleneck Transformers

Bottleneck Transformers（BoTNet）是一个 CNN 与 Self-Attention 的混合骨干：把 ResNet
最后一个 stage（c5）中 3 个 bottleneck block 里的 $`3\times3`$ 空间卷积替换为
**Multi-Head Self-Attention（MHSA）**，其余结构保持不变。因为 ResNet 的 bottleneck 结构与
Transformer block 很相似，替换后的模块称为 **BoT block**。

## Motivation

  - 纯 Transformer 做视觉任务（分类、检测、分割）时，高分辨率输入下全局 attention 的 $`O(n^2)`$ 开销过大
  - 做法：在 ResNet 低分辨率的最后阶段才使用全局 self-attention，此时 feature map
    已经被卷积下采样，序列长度可控
  - 检测/实例分割等任务输入分辨率较高，BoTNet 在该场景下尤其有效；ImageNet 分类上最高报告 84.7%
    top-1（BoTNet-T7）

## Arch

  - 前几个 stage（c2–c4）为普通 ResNet 卷积 block
  - c5 stage 的 3 个 block 把 $`3\times3`$ conv 换成 MHSA（4 个
    head），并加入**相对位置编码**（relative position encoding）
  - 为了保持下采样，c5 中原本 stride 为 2 的 block 里，用 $`2\times2`$ average pooling
    来下采样
  - 与标准 Transformer block 的区别：BoT block 使用 BatchNorm、有 $`1\times1`$ 卷积的
    bottleneck 结构（降维—MHSA—升维）以及更多的非线性

| Name              | Conv $`3\times3`$ | Self-Attention | 位置信息   |
| ----------------- | ----------------- | -------------- | ------ |
| ResNet bottleneck | ✅                 | ❌              | 卷积隐含   |
| BoT block         | ❌                 | ✅ (MHSA)       | 相对位置编码 |

## Evaluation

  - 在 COCO 实例分割/检测上，BoTNet 相比 ResNet 基线有明显提升
  - 在 ImageNet 上与 EfficientNet 等 CNN 对比，达到更好的精度-算力权衡，但需更大的训练 epoch
    和更强的数据增强

## Reference

  - 2021-01 **\[BoTNet\]** Bottleneck Transformers for Visual
    Recognition \[[Paper](https://arxiv.org/abs/2101.11605)\]
    \[[Code](https://paperswithcode.com/paper/bottleneck-transformers-for-visual#code)\]
