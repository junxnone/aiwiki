-----

| Title     | paper FRE                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:22Z`                                |
| Updated @ | `2026-11-24T08:14:22Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/742) |

-----

# FRE 特征重构误差

  - **FRE**：A Fast Method For Anomaly Detection And Segmentation，论文
    [BMVC 2023](https://papers.bmvc2023.org/0614.pdf)
  - 类型：Segmentation
  - 思路：深度特征提取 + **浅层线性自编码器**，用**特征重构误差**作为异常分数；因为只有一个线性层，训练和推理都很快
  - 与 [DFM](/0740_paper_DFM) 的 PCA 重构分数思想接近：线性自编码器等价于
    PCA，只是用梯度下降学习，并且在空间位置上逐点计算，所以可以得到异常图

## 原理

下图是 FRE 的流程：

``` mermaid
graph LR
    A["正常图像"] --> B["ResNet-50 预训练<br/>取中间层 layer3 特征"]
    B --> C["训练浅层线性自编码器<br/>编码到低维再解码"]
    T["测试图像"] --> D["同样提取 layer3 特征"]
    D --> E["自编码器重构"]
    C --> E
    E --> F["重构误差张量<br/>缩放到图像大小 得到异常图"]
```

图中：

  - 骨干为 ImageNet 预训练的 ResNet-50，取中间层（默认 layer3）的特征，anomalib 说明其向量长度为
    65536
  - 在正常图像的特征上训练一个浅层线性自编码器，使其能把正常特征压缩再还原
  - 测试时，正常特征可以被还原好，误差小；异常特征无法被还原，误差大。把误差张量变形并缩放到输入图像大小，即得到异常图

$$ s(x) = \\big\\lVert x - D\\big(E(x)\\big) \\big\\rVert\_2, \\qquad
E(x) = W\_e x + b\_e,\\ \\ D(z) = W\_d z + b\_d $$

其中：

  - $x$：某个空间位置（或整张图）的特征向量；$E$：线性编码器，把特征压缩到低维 $z$；$D$：线性解码器，把 $z$ 还原为与
    $x$ 同维度的向量
  - $W\_e, b\_e, W\_d, b\_d$：编码器、解码器的权重和偏置，是唯一需要训练的参数，在正常图像特征上最小化重构误差
  - $s(x)$：特征重构误差，即原特征与重构特征的差的 L2 范数，越大越异常
  - 由于编码维度远小于特征维度，自编码器只能保留正常数据中最主要的变化方向，对异常不能很好地还原

## 特点

| Name  | 说明                                                  |
| ----- | --------------------------------------------------- |
| 速度    | 只有一个线性层，训练和推理都很快，名称里的 Fast 即来自于此                    |
| 中间层特征 | 默认 layer3，兼顾语义和空间分辨率，可生成异常图                         |
| 简单    | 没有记忆库、没有流，实现简单，可作为基线                                |
| 池化设置  | anomalib 说明：ResNet-50 使用池化核大小 2，Wide ResNet-50 使用 4 |

表中是 FRE 的特点：它在速度和可定位之间取了平衡，但表达能力受限于线性模型。

## 使用与评估

``` bash
anomalib train --model Fre --data anomalib.data.MVTecAD
```

anomalib README 中的结果（MVTec AD 15 类平均，seed 42）：

| Backbone       | Image AUROC | Image F1 |
| -------------- | ----------- | -------- |
| ResNet-50      | 0.933       | 0.935    |
| Wide ResNet-50 | 0.947       | 0.941    |

表中是图像级指标，与 [DFM](/0740_paper_DFM)（0.936\~0.943）接近；FRE
的优势在于能同时提供异常图。需要速度优先、对精度要求不是最高的场景可以考虑。

## 优缺点

  - **优点**：非常快；结构简单；能生成异常图；训练稳定
  - **缺点**：线性模型表达能力有限，对复杂正常模式的重构不足；精度低于
    [PatchCore](/0535_paper_PatchCore) 等方法；特征维度很高（65536），占用内存较多

## Reference

  - [FRE: A Fast Method For Anomaly Detection And
    Segmentation](https://papers.bmvc2023.org/0614.pdf)
  - [anomalib -
    Fre](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/fre)
