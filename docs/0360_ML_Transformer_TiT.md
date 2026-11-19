---
Title | ML Transformer TiT
-- | --
Created @ | `2021-03-04T01:58:58Z`
Updated @| `2026-11-19T09:39:02Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/360)

---
# Transformer in Transformer

TNT（Transformer in Transformer）认为 [ViT](/0223_ML_Transformer_ViT) 把 patch 当作最小单位，忽略了 patch 内部的局部结构。TNT 把每个 patch 再切成更小的子块（visual words），用两层嵌套的 Transformer 同时建模：

- **Inner T-Block** ==> Pixel level：在每个 patch 内部，对 visual words 之间的关系建模
- **Outer T-Block** ==> Patch level：在 patch embedding 之间建模全局关系

## Motivation

- ViT 只在 patch 之间做 attention，patch 内部的像素/局部结构被一次线性投影压缩掉
- 把图像看作"patch 序列"，每个 patch 又是"visual words 序列"，层次化地表示
- 做法：在 Outer 的 patch embedding 上叠加 Inner 输出的局部信息

## Arch

设第 $`i`$ 个 patch 被拆成 $`m`$ 个 visual words，对应特征 $`Y_i \in \mathbb{R}^{m \times c}`$，patch embedding 为 $`Z_i \in \mathbb{R}^{d}`$。第 $`l`$ 层：

$$
Y_i^{\prime l} = Y_i^{l-1} + \mathrm{MSA}(\mathrm{LN}(Y_i^{l-1})),\qquad
Y_i^{l} = Y_i^{\prime l} + \mathrm{MLP}(\mathrm{LN}(Y_i^{\prime l}))
$$

$$
Z_i^{l-1} \leftarrow Z_i^{l-1} + \mathrm{FC}\big(\mathrm{Vec}(Y_i^{l})\big)
$$

之后 Outer Transformer 对更新后的 $`Z^{l-1}`$ 做标准的 MSA + MLP。其中 $`\mathrm{Vec}`$ 为展平，$`\mathrm{FC}`$ 把 $`mc`$ 维映射到 $`d`$ 维，实现 Inner → Outer 的信息融合。

符号与形状：

- $`Y_i^{l}`$ 是第 $`i`$ 个 patch 内 $`m`$ 个 visual words 在第 $`l`$ 层的特征。第一个式子是 Inner 的 MSA 子层，第二个是 MLP 子层，写法与 [ViT](/0223_ML_Transformer_ViT) 的 Pre-LN 残差块相同；**每个 patch 独立做**，所以注意力只在 patch 内的 $`m`$ 个词之间进行，开销很小
- $`\mathrm{Vec}(Y_i^l)`$：把 $`m\times c`$ 展平成 $`mc`$ 维向量，经 $`\mathrm{FC}`$ 变成 $`d`$ 维，加到 patch embedding $`Z_i`$ 上。直观上就是**把 patch 内部的细节"写回"patch 向量**，这样 Outer 在 patch 之间做 attention 时用到的 patch 表示，已经包含了内部结构

**具体数值**（以 $`224\times224`$ 输入为例）：patch 大小 $`16\times16`$，共 $`196`$ 个 patch；每个 patch 再按 $`4\times4`$ 切成 $`m=16`$ 个 visual words，每个 word 展平为 $`4\times4\times3=48`$ 维后线性映射到 $`c`$ 维。论文的 TNT-S 取 $`c=24`$、$`d=384`$。可见 Inner 的维度远小于 Outer，这是额外计算量可控的关键：Inner 序列虽有 $`196\times16`$ 个词，但注意力只在每个 patch 内的 16 个词间做。

![image](https://user-images.githubusercontent.com/2216970/109899121-51105a00-7cd0-11eb-9d14-5e726cc9eee0.png)

### Position encoding(patch & pixel)

Outer 对 patch embedding 加 patch 位置编码，Inner 对每个 patch 内的 visual words 加 pixel 位置编码，两者都可学习。

![image](https://user-images.githubusercontent.com/2216970/109899156-61c0d000-7cd0-11eb-856c-9f638b3109bf.png)

## Evaluation

- TNT-S（约 23.8M 参数）在 ImageNet 上 top-1 约 81.5%，TNT-B（约 65.6M）约 82.9%，在相近参数量/FLOPs 下优于 DeiT
- 额外开销来自 Inner Transformer，FLOPs 有一定增加

![image](https://user-images.githubusercontent.com/2216970/109899351-b2d0c400-7cd0-11eb-87bb-13db9c82462f.png)
![image](https://user-images.githubusercontent.com/2216970/109899376-bcf2c280-7cd0-11eb-9acc-82506298c502.png)
![image](https://user-images.githubusercontent.com/2216970/109899558-017e5e00-7cd1-11eb-8477-dde2d011f8f0.png)

## Reference
- 2021-02 **[TNT]** Transformer in Transformer[[Paper](https://arxiv.org/abs/2103.00112)] [[Code](https://github.com/huawei-noah/noah-research/tree/master/TNT)] 
- [pytorch code - lucidrains](https://github.com/lucidrains/transformer-in-transformer)

