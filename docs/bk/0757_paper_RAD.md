-----

| Title     | paper RAD                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:55Z`                                |
| Updated @ | `2026-11-24T08:14:55Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/757) |

-----

# RAD 检索式异常检测

  - **RAD** - Retrieval-based Anomaly Detection，论文
    [arXiv 2601.22763](https://arxiv.org/abs/2601.22763)
  - 类型：Segmentation
  - 思路：**无需训练**的框架，通过**多级检索**与**位置感知的 Patch 匹配**检测异常。使用 DINOv3 ViT-B/16
    作骨干，从多个 Transformer 块抽取特征，建立多层记忆库
  - 与
    [PatchCore](/0535_paper_PatchCore)、[AnomalyDINO](/0756_paper_AnomalyDINO)
    同属记忆库方法，区别是先检索相似图像，再在局部记忆库内比较

## 原理

RAD 分为三个阶段：

``` mermaid
graph LR
    X["测试图像"] --> F["特征提取<br/>ViT 的 3 6 9 11 块<br/>CLS 与 Patch 令牌"]
    F --> R["图像级检索<br/>用 CLS 令牌余弦相似度<br/>找 k 张最相似训练图"]
    R --> L["局部记忆库<br/>由检索到的图像 Patch 构成"]
    F --> P["Patch 级评分<br/>位置感知余弦距离"]
    L --> P
    P --> A["各层融合<br/>得到异常图"]
```

图中：

  - **特征提取**：用多层 ViT 特征（CLS 令牌 + Patch 令牌），取第 3、6、9、11 个块（从 0 计）
  - **图像级检索**：先用 CLS 令牌的余弦相似度，在训练集中找到与测试图像最相似的 $k$ 张图像
  - **Patch 级评分**：只用这 $k$ 张图像的 Patch 构成一个**局部记忆库**，测试图像的每个 Patch
    只与这个局部记忆库里**空间位置相近**的 Patch
    比较（位置感知匹配），用余弦距离作为分数，再把各层的结果融合
  - 拟合阶段只是把正常图像的特征存进记忆库，**训练集过一遍即可**

Patch 的异常分数：

$$ s(h, w) = \\min\_{(h', w') \\in \\mathcal{N}*r(h, w)}\\ \\min*{I \\in
\\mathcal{R}\_k}\\ \\Big(1 - \\cos\\big(f(h, w),\\ f\_I(h',
w')\\big)\\Big) $$

其中：

  - $f(h,w)$：测试图像在位置 $(h,w)$ 的 Patch 特征；$\\mathcal{R}\_k$：检索到的 $k$
    张最相似训练图像的集合；$f\_I(h', w')$：训练图像 $I$ 在位置 $(h', w')$ 的
    Patch 特征
  - $\\mathcal{N}\_r(h,w)$：以 $(h,w)$ 为中心、半径为 $r$ 的邻域，**位置感知**：测试 Patch
    只与对应位置附近的 Patch 比较；论文按数据集调整检索图像数 $k$ 和邻域半径 $r$
  - $1 - \\cos$：余弦距离；取最小值即最近邻距离，距离越大越异常
  - 这里的写法依据 README 的文字描述，具体的层融合方式请参考论文

## 注意事项

  - **单类 vs 多类**：`anomalib train --model Rad`
    为每个类别建一个记忆库，对应论文的单类设置；论文的主要结果是在多类（MUAD）协议下，所有类别共用一个记忆库
  - **位置对齐**：位置感知匹配按网格位置比较，所以拟合和推理的图像尺寸必须一致；尺寸不同时设
    `use_positional_bank=False`
  - **内存**：记忆库存储每个正常 Patch 的嵌入，并保存在 checkpoint 中，大小与训练集规模成线性关系
  - README 中的 benchmark 和架构图仍是 TODO

## 使用

``` bash
anomalib train --model Rad --data MVTecAD --data.category <category>
```

评估指标见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)；README
没有给出数值，请参考论文。

## 优缺点

  - **优点**：无需训练；检索缩小搜索范围，局部记忆库使匹配更准确；位置感知抑制误匹配；基于强大的 DINOv3 特征
  - **缺点**：记忆库随训练集线性增大；要求图像尺寸一致；需要保存全部训练特征；暂无 anomalib 官方基准

## Reference

  - [RAD](https://arxiv.org/abs/2601.22763)
  - [anomalib -
    Rad](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/rad)
