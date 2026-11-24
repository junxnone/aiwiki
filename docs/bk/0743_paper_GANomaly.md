-----

| Title     | paper GANomaly                                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:24Z`                                |
| Updated @ | `2026-11-24T09:21:44Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/743) |

-----

# GANomaly 对抗训练的异常检测

  - **GANomaly**：Semi-Supervised Anomaly Detection via Adversarial
    Training，论文
    [arXiv 1805.06725](https://arxiv.org/abs/1805.06725)（ACCV 2018）
  - 类型：Classification（图像级）
  - 问题设定：训练集 $\\mathcal{D}={X\_1,\\dots,X\_M}$ **只含正常图像**，测试集
    $\\hat{\\mathcal{D}}$ 有正常和异常图像（$M \\gg
    N$）。目标是先学习正常数据的流形，推理时把偏离的样本检测为离群点；异常分数
    $\\mathcal{A}(\\hat{x}) \> \\phi$ 判为异常
  - 核心思想：用条件 GAN
    训练一个只会生成「正常」图像的生成器，**生成器由「编码器-解码器-编码器」组成**；比较输入图像与重构图像各自编码得到的**隐向量**差异，作为异常分数
  - 属于 [anomalib](/0321_Tools_anomalib) 里基于生成/重构的方法，同类见
    [DRAEM](/0744_paper_DRAEM)

## 原理：三个子网络

下图是 GANomaly 的结构：

``` mermaid
graph LR
    X["输入图像 x"] --> GE["编码器 G_E<br/>压缩成隐向量 z"]
    GE --> GD["解码器 G_D<br/>DCGAN 生成器结构 重构 x_hat"]
    GD --> E["编码器 E<br/>把 x_hat 编码为 z_hat"]
    X --> D["判别器 D"]
    GD --> D
    GE --> S["异常分数: z 与 z_hat 的距离"]
    E --> S
```

图中：

  - **子网络 1（生成器 G，蝶形/bow-tie 自编码器）**：编码器 $G\_E$ 用卷积层 + BatchNorm +
    LeakyReLU 把图像 $x \\in \\mathbb{R}^{w\\times h\\times c}$ 下采样压缩成瓶颈特征
    $z \\in \\mathbb{R}^d$；解码器 $G\_D$ 采用 DCGAN
    生成器的结构（转置卷积、ReLU、BatchNorm）重构出图像
    $\\hat{x}$
  - **子网络 2（编码器 E）**：把重构图像 $\\hat{x}$ 再压缩成 $\\hat{z} = E(\\hat{x})$，结构与
    $G\_E$ 相同但参数不同，$\\hat{z}$ 的维度与 $z$
    一致，以便比较。**这是该方法的独特之处**：以往基于自编码器的方法只是靠瓶颈特征来最小化隐向量，而这里由
    $E$ 显式地学习最小化距离；测试时的异常检测也依赖这一距离
  - **子网络 3（判别器 D）**：标准 DCGAN 判别器，对输入 $x$ 和输出 $\\hat{x}$ 判断真假

**为什么有效**：训练时网络只见过正常样本，参数不适合生成异常样本。异常图像输入 $G$ 时，即使 $G\_E$ 能把它映射到隐向量
$z$，$G\_D$ 也**无法重构出异常**；丢失了异常的 $\\hat{x}$ 再被 $E$ 编码得到的 $\\hat{z}$
也缺少异常特征，导致 $z$ 与 $\\hat{z}$ 不一致，于是判为异常。

## 损失函数

生成器的目标由三项组成：

$$ \\mathcal{L}*{adv} = \\mathbb{E}*{x \\sim p\_X}\\big\\lVert f(x) -
\\mathbb{E}*{x \\sim p\_X} f\\big(G(x)\\big)\\big\\rVert\_2, \\quad
\\mathcal{L}*{con} = \\mathbb{E}*{x \\sim p\_X}\\big\\lVert x - G(x)
\\big\\rVert\_1, \\quad \\mathcal{L}*{enc} = \\mathbb{E}\_{x \\sim
p\_X}\\big\\lVert G\_E(x) - E\\big(G(x)\\big) \\big\\rVert\_2 $$

$$ \\mathcal{L} = w\_{adv}\\mathcal{L}*{adv} + w*{con}\\mathcal{L}*{con}
+ w*{enc}\\mathcal{L}\_{enc} $$

其中：

  - $x \\sim p\_X$：从正常数据分布采样的图像；$G(x) =
    \\hat{x}$：生成器的重构输出；$f(\\cdot)$：判别器 $D$
    的某个**中间层**输出
  - $\\mathcal{L}\_{adv}$：**对抗损失**采用 Salimans 等人提出的**特征匹配** (feature
    matching) 形式，计算真实图像和生成图像在判别器中间层特征的 $L\_2$ 距离；它与原始 GAN 用判别器真/假输出更新
    $G$ 不同，是根据判别器**内部表示**更新，能缓解 GAN 训练的不稳定
  - $\\mathcal{L}\_{con}$：**上下文损失**，输入与重构的 $L\_1$
    距离。只有对抗损失时，生成器不会学习输入的上下文信息；$L\_1$
    比 $L\_2$ 的结果更清晰（参考 Isola 等人）
  - $\\mathcal{L}\_{enc}$：**编码损失**，最小化输入的瓶颈特征 $z = G\_E(x)$ 与重构图像的编码特征
    $\\hat{z} = E(G(x))$ 的距离。这使生成器学会对正常样本的重构图像做一致的编码；对异常输入则因为 $G$、$E$
    只针对正常样本优化而无法最小化
  - $w\_{adv}, w\_{con}, w\_{enc}$：三项权重。论文实验中设为
    $w\_{adv}=1$、$w\_{con}=50$、$w\_{enc}=1$，是经验选择；论文称在 MNIST 上这组权重取得最高
    AUC，其余数据集观察到相同的规律

**测试时的异常分数**：

$$ \\mathcal{A}(\\hat{x}) = \\big\\lVert G\_E(\\hat{x}) -
E\\big(G(\\hat{x})\\big) \\big\\rVert\_1, \\qquad s'\_i = \\frac{s\_i -
\\min(\\mathcal{S})}{\\max(\\mathcal{S}) - \\min(\\mathcal{S})} $$

其中：$\\hat{x}$ 为测试图像；$\\mathcal{S} = {s\_i}$ 为整个测试集的分数集合；第二式是对分数做 min-max
缩放，使其落在 $\[0, 1\]$。注意训练时的编码损失用 $L\_2$，而论文的测试分数公式用的是 $L\_1$ 距离。

## 实验

  - **数据集**：MNIST（每次把一个数字当作异常，其余当作正常，缩放到 32×32）、CIFAR10（一个类当异常、其余当正常）、X
    射线安检数据 UBA（230275 个图像块，异常包括 knife/gun/gun-component）和 FFOB（4680
    张枪支完整图像为异常、67672 张操作中的良性图像为正常）；正常样本按 80% / 20% 划分训练和测试
  - **实现**：PyTorch，基于标准 DCGAN；Adam，初始学习率 $2\\times10^{-3}$，$\\beta\_1 =
    0.5$，$\\beta\_2 = 0.999$；MNIST、UBA、FFOB 分别训练 15、25、25 个 epoch
  - **结果**：论文在 MNIST 和 CIFAR10 上，对任何一个数字/类别当异常，AUC 都高于 EGBAD、AnoGAN 和
    VAE；CIFAR10 整体 AUC 较低，原因是异常类别往往存在与之相似的正常类（飞机与鸟、猫与狗、马与鹿、汽车与卡车）
  - **UBA 和 FFOB**（AUC，论文 Table 1）：

| Method   | UBA gun   | gun-parts | knife | UBA overall | FFOB full-weapon |
| -------- | --------- | --------- | ----- | ----------- | ---------------- |
| AnoGAN   | 0.598     | 0.511     | 0.599 | 0.569       | 0.703            |
| EGBAD    | 0.614     | 0.591     | 0.587 | 0.597       | 0.712            |
| GANomaly | **0.747** | **0.662** | 0.520 | **0.643**   | **0.882**        |

表中每一列是一种异常类型。GANomaly 在大部分列上更好（knife 一列除外，三者接近），论文解释 knife
形状过于简单，容易过拟合导致高误报。正文给出的整体 AUC 为 UBA 0.666 和
FFOB 0.882（与表中 0.643 略有出入，以论文为准）。

  - **运行时间**（毫秒/样本，论文 Table 2）：AnoGAN 约 7120 ms（每个样本都要优化隐向量），EGBAD 约
    8.7~~8.9 ms，GANomaly 约 \*\*2.2~~2.8 ms\*\*，是最快的
  - **超参数**：MNIST 上隐向量 $z$ 的维度取 100 时性能最优
  - **论文自己的观察**：MNIST 数字 2 的异常重构图像并没有失败（MNIST
    较简单，模型学到的信息足以生成没见过的样本）；这时**隐向量空间的距离**依然足以检测异常，即使模型在图像空间里区分不出异常

**anomalib 复现的结果**（README，MVTec AD 15 类平均，seed 42）：

| Metric      | 平均值   |
| ----------- | ----- |
| Image AUROC | 0.421 |
| Image F1    | 0.834 |

表中 Image AUROC 平均为 0.421，**低于 0.5 的随机水平**，说明在 anomalib 的默认设置下 GANomaly 在
MVTec AD 这类工业纹理/物体数据上基本没有区分能力。这与论文的实验对象（MNIST、CIFAR10、X 射线安检）不同，GAN
训练又不稳定，结果受设置影响很大。F1 较高（0.834）是因为数据不均衡时 F1 偏高，需要和 AUROC 一起看，见
[Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)。工程上优先选择
[PatchCore](/0535_paper_PatchCore) 等方法。

## 特点与局限

  - **优点**：分数定义在**隐空间**，对像素级噪声更稳健；只需要正常样本（半监督）；推理非常快（2\~3
    ms）；结构上把编码损失显式加入训练
  - **局限**：GAN 训练不稳定；只有图像级输出，没有像素级异常图；在 anomalib 的 MVTec AD 基准下 AUROC
    低于随机；论文也承认在相似类别较多的数据集（CIFAR10）上整体指标较低

## Reference

  - [GANomaly: Semi-Supervised Anomaly Detection via Adversarial
    Training](https://arxiv.org/abs/1805.06725)
  - [anomalib -
    Ganomaly](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/ganomaly)
