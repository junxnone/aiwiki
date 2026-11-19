---
Title | ML Transformer ViT
-- | --
Created @ | `2021-02-01T03:01:44Z`
Updated @| `2026-11-19T09:38:44Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/223)

---
# ViT

Vision Transformer（ViT）把图像切成固定大小的 patch，当作 NLP 中的 token 序列，直接送入标准 Transformer Encoder 做图像分类，几乎不引入卷积等图像特有的归纳偏置。在 JFT-300M 等大规模数据上预训练后，ViT 在 ImageNet 等基准上达到甚至超过当时最好的 CNN，且训练算力更少；但在中小数据集上从头训练效果不如 CNN（见 [DeiT](/0253_ML_Transformer_DeiT)、[T2T-ViT](/0227_ML_Transformer_T2TViT)）。

## Pipeline

设输入图像 $`x \in \mathbb{R}^{H \times W \times C}`$，patch 边长为 $`P`$，则 patch 数 $`N = HW/P^2`$（$`224\times224`$、$`P=16`$ 时 $`N=196`$），隐层维度为 $`D`$。

- **Split**：$`\text{Image}(H \times W \times C) \to \text{Patches}(N \times P^2C)`$
- **Linear Projection**：每个 patch 展平后乘可学习矩阵 $`E \in \mathbb{R}^{(P^2C) \times D}`$，得到 $`N \times D`$ 的 patch embedding
- **Learnable Embedding**：在序列最前面拼接可学习的 `[class]` token，输出时用它作为图像表示
- **Position Embedding**：可学习的 1D 位置编码 $`E_{pos} \in \mathbb{R}^{(N+1) \times D}`$，与 patch embedding 相加
- **Transformer Encoder**：$`L`$ 层 Multi-Head Self-Attention（MSA）+ MLP，采用 Pre-LN
- **MLP Head**：取最后一层 `[class]` token 的输出做分类

$$
z_0 = [x_{class};\, x_p^1E;\, \dots;\, x_p^NE] + E_{pos}
$$

$$
z'_\ell = \mathrm{MSA}(\mathrm{LN}(z_{\ell-1})) + z_{\ell-1},\qquad
z_\ell = \mathrm{MLP}(\mathrm{LN}(z'_\ell)) + z'_\ell,\qquad
y = \mathrm{LN}(z_L^0)
$$

符号说明：

- $`x_p^i \in \mathbb{R}^{P^2C}`$：第 $`i`$ 个 patch 展平后的向量，$`x_p^iE`$ 就是它的 patch embedding（$`D`$ 维）
- $`x_{class}`$：可学习的 `[class]` token，初始化为随机向量，不对应任何图像内容
- $`z_0 \in \mathbb{R}^{(N+1)\times D}`$：Encoder 的输入序列，等于 token 序列逐位置加上位置编码 $`E_{pos}`$
- $`\mathrm{LN}`$ 是 LayerNorm，$`\mathrm{MSA}`$ 是 Multi-Head Self-Attention（见 [Transformer](/0229_ML_Transformer)），$`\mathrm{MLP}`$ 是两层全连接加 GELU
- $`z'_\ell`$ 是第 $`\ell`$ 层 MSA 子层的输出，$`z_\ell`$ 是 MLP 子层的输出，两个子层都是**先 LN、再子层、最后加残差**（Pre-LN）
- $`z_L^0`$：最后一层输出序列的第 0 个位置，即 `[class]` token 的最终表示。因为它在每一层都通过 attention 汇聚所有 patch 的信息，所以能代表整张图，再经 LN 后送入分类头得到 $`y`$

![image](https://user-images.githubusercontent.com/2216970/106418086-72431800-6490-11eb-96eb-7e65bd2d7489.png) | ![vit](https://user-images.githubusercontent.com/2216970/106410148-25097b00-647d-11eb-9ec8-792ff5ce59f8.gif)
-- | --

## 模型规格

Model | Layers | Hidden $`D`$ | MLP size | Heads | Params
-- | -- | -- | -- | -- | --
ViT-Base | 12 | 768 | 3072 | 12 | 86M
ViT-Large | 24 | 1024 | 4096 | 16 | 307M
ViT-Huge | 32 | 1280 | 5120 | 16 | 632M

模型名常写作 `ViT-B/16`，表示 Base 规格、patch 大小 $`16\times16`$；$`P`$ 越小，序列越长，计算量越大。

## Training

- 预训练：大数据集（ImageNet-21k / JFT-300M），预训练时分类头为带一个隐层的 MLP
- Fine-tune：丢弃预训练的分类头，换成零初始化的单层线性层 $`D \times K`$
- 更高分辨率 fine-tune 时 patch 大小不变、序列变长，需对预训练的位置编码按其在原图中的位置做 2D 插值
- 优化：SGD `momentum=0.9`，Cosine learning rate decay，Batch size = 512
- 在 Development Set 上 Grid Search **Learning Rate**（Dev Set 取训练集的一部分）
  - Pets/Flowers = 10% / Cifar = 2% / ImageNet = 1%

## 特点

- 没有 CNN 的局部性、平移等变性先验，数据量小时容易欠拟合，数据量大时反而更灵活，Scaling 表现好
- Self-Attention 全局感受野，第一层就能建模任意两个 patch 的关系
- 自注意力复杂度为 $`O(N^2D)`$，高分辨率输入时开销大

## Reference
- 10/2020 [An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929)
- [vision_transformer - google-research](https://github.com/google-research/vision_transformer)
- [vit-pytorch](https://github.com/lucidrains/vit-pytorch)
- [用Transformer完全替代CNN](https://zhuanlan.zhihu.com/p/266311690)
- [Vision Transformer - GiantPandaCV](https://zhuanlan.zhihu.com/p/317756159)

