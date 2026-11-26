-----

| Title     | ML Tasks Image Classification SENet                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T01:28:25Z`                                |
| Updated @ | `2026-11-26T01:30:07Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/800) |

-----

# SENet

SENet (Squeeze-and-Excitation Networks，CVPR
2018)：给卷积特征的每个通道学一个权重，增强有用通道、抑制无用通道，是最经典的通道注意力。获得
ILSVRC 2017 分类冠军 (top-5 错误率 $2.251%$)。

## SE 模块

下图是一个 SE 模块，可以插入到任意卷积块之后：

``` mermaid
flowchart LR
    U[特征 U<br>H x W x C] --> SQ[Squeeze<br>全局平均池化]
    SQ --> Z[z: 1 x 1 x C]
    Z --> FC1[FC C→C/r + ReLU]
    FC1 --> FC2[FC C/r→C + Sigmoid]
    FC2 --> S[s: 1 x 1 x C]
    U --> SC[逐通道相乘]
    S --> SC
    SC --> X[输出 X~<br>H x W x C]
```

图中：

  - Squeeze：对每个通道做全局平均池化，把 $H\\times W$ 的空间信息压成一个数，得到描述各通道全局响应的向量 $z$
  - Excitation：两层全连接 (先降维到 $C/r$ 再恢复到 $C$)，最后用 sigmoid 得到 $0\\sim1$
    的通道权重 $s$
  - Scale：把权重 $s$ 逐通道乘回原特征 $U$，得到重标定后的特征；不改变特征图尺寸，可以加在
    [ResNet](/0051_ML_Tasks_Image_Classification_ResNet) 等任何网络的块里

$$ z\_c=\\frac1{HW}\\sum\_{i=1}^{H}\\sum\_{j=1}^{W}u\_c(i,j),\\qquad
\\mathbf s=\\sigma\\bigl(W\_2,\\delta(W\_1\\mathbf z)\\bigr),\\qquad
\\tilde x\_c=s\_c\\cdot u\_c $$

其中：

  - $u\_c\\in\\mathbb R^{H\\times W}$：特征 $U$ 的第 $c$
    个通道；$z\_c$：该通道的全局平均值；$C$：通道数
  - $W\_1\\in\\mathbb R^{\\frac Cr\\times C}$、$W\_2\\in\\mathbb
    R^{C\\times\\frac Cr}$：两个全连接的权重；$r$：降维比 (reduction ratio)，论文取
    $16$，用来控制参数量
  - $\\delta$：ReLU；$\\sigma$：sigmoid；$\\mathbf s\\in(0,1)^C$：各通道的权重
  - $\\tilde x\_c$：第 $c$ 个通道的输出；与 BatchNorm 类似，SE
    通过「依赖输入的通道缩放」实现动态调整，不同图像会得到不同权重

## 代价与效果

  - 每个 SE 模块增加的参数量约 $2C^2/r$，整个网络增加约 $10%$ 的参数，计算量几乎不变
  - 论文结果：SE-ResNet-50 的 top-1 错误率 $23.29%$，低于 ResNet-50 的 $24.80%$，接近
    ResNet-101 的 $23.17%$，而计算量约只有后者的一半 `[待核实]`
  - 通用性：对各种结构 (ResNet、Inception、ResNeXt、MobileNet) 都有效，因此成为后续很多网络的标准组件，如
    [MobileNet
    V3](/0044_ML_Tasks_Image_Classification_MobileNet_V3)、[EfficientNet](/0801_ML_Tasks_Image_Classification_EfficientNet)

## 变体与后续

| 方法                   | 思路                                             |
| -------------------- | ---------------------------------------------- |
| CBAM                 | 通道注意力 + 空间注意力串联                                |
| ECA-Net              | 用一维卷积代替全连接，去掉降维，参数更少                           |
| SKNet                | 在多个卷积核分支之间做注意力选择                               |
| Self-attention / ViT | 通道/空间注意力的一般化，见 [ViT](/0223_ML_Transformer_ViT) |

表中：这些方法都是对 SE 的通道注意力做改进或扩展，思路都是「让网络自己学哪里更重要」。

## Reference

  - [Squeeze-and-Excitation Networks - Hu et al.,
    CVPR 2018](https://arxiv.org/abs/1709.01507)
  - [ECA-Net](https://arxiv.org/abs/1910.03151)
  - [CBAM](https://arxiv.org/abs/1807.06521)
