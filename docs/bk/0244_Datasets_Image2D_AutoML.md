-----

| Title     | Datasets Image2D AutoML                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-07-17T02:39:20Z`                                |
| Updated @ | `2026-11-11T09:37:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/244) |

-----

# AutoML 基准数据集

AutoML（尤其是神经架构搜索 NAS）的"数据集"通常是**表格基准（tabular
benchmark）**：预先把搜索空间里每个架构都训练好，把精度、参数量、耗时记录成查表，NAS
算法只需查表就能评估架构，把一次搜索实验从数百 GPU 天降到秒级，并使不同算法可复现、可比较。本文整理常用基准和简述。NAS 方法见
[AutoML NAS](0014_ML_AutoML_NAS)，超参优化见 [AutoML HPO
BO](0022_ML_AutoML_HPO_BO)，总入口见 [Datasets
Image2D](0018_Datasets_Image2D)。

## 分类表

| 数据集                                                          | 描述                                                                           | 简单统计                                         | 链接                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| [NAS-Bench-101](https://github.com/google-research/nasbench) | 第一个公开的 NAS 架构数据集，cell 级搜索空间，在 CIFAR-10 上训练                                   | 423k 个唯一架构，超过 500 万个训练好的模型（arXiv:1902.09635） | [GitHub](https://github.com/google-research/nasbench) |
| [NAS-Bench-201](https://github.com/D-X-Y/NAS-Bench-201)      | 固定搜索空间：4 个节点、5 种候选操作，覆盖 CIFAR-10 / CIFAR-100 / ImageNet-16-120 三个数据集         | 15,625 个架构（5^6，待核实）                          | [GitHub](https://github.com/D-X-Y/NAS-Bench-201)      |
| [NDS](https://github.com/facebookresearch/nds)               | Facebook 的网络设计空间（Network Design Spaces）分布估计基准，对采样模型群体做统计比较（arXiv:1905.13214） | 规模见论文与仓库（待核实）                                | [GitHub](https://github.com/facebookresearch/nds)     |

涉及的数据集：CIFAR-10/100 见
[CIFAR](0032_Datasets_Image2D_Classification_Cifar)；ImageNet-16-120 是
ImageNet 下采样到 16×16、取 120 类的子集（待核实）。

## 其他基准入口

  - [vega -
    benchmark](http://www.noahlab.com.hk/opensource/vega/#benchmark)：华为诺亚的
    NAS/AutoML 工具库，含基准结果。
  - [NNI -
    benchmark](https://nni.readthedocs.io/zh/latest/NAS/Benchmarks.html)：微软
    NNI 对 NAS-Bench-101/201、NDS 的封装，可直接查询。

## 选择建议

| 需求                | 建议                                         |
| ----------------- | ------------------------------------------ |
| 快速验证 NAS 算法、可复现对比 | NAS-Bench-201（空间小、含三个数据集）                  |
| 需要更大搜索空间          | NAS-Bench-101（但只有 CIFAR-10，且是约束下的 cell 空间） |
| 研究搜索空间本身的设计       | NDS                                        |
| 不想自己处理格式          | 通过 NNI 的 benchmark 接口查询                    |

注意：基准只验证"在该搜索空间内找好架构"的能力，不代表在真实任务上有同样效果；表格基准结果有随机种子方差，对比时应多次重复。

## Reference

  - [vega -
    benchmark](http://www.noahlab.com.hk/opensource/vega/#benchmark)
  - [NNI -
    benchmark](https://nni.readthedocs.io/zh/latest/NAS/Benchmarks.html)
  - [NAS-Bench-101 (arXiv:1902.09635)](https://arxiv.org/abs/1902.09635)
  - [NAS-Bench-201 (arXiv:2001.00326)](https://arxiv.org/abs/2001.00326)
  - [On Network Design Spaces for Visual Recognition
    (arXiv:1905.13214)](https://arxiv.org/abs/1905.13214)
