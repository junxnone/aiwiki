-----

| Title     | MO Pruning                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T14:35:10Z`                                |
| Updated @ | `2026-11-26T14:35:50Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/808) |

-----

# 剪枝

  - Pruning - 剪枝
  - 把网络里「不重要」的参数或结构移除，减少参数量和计算量
  - 与
    [量化](https://github.com/junxnone/aiwiki/issues/312)、[知识蒸馏](https://github.com/junxnone/aiwiki/issues/207)
    并称模型压缩的三大手段，总览见
    [模型性能优化技术](https://github.com/junxnone/aiwiki/issues/471)

## 系列文章

剪枝相关的技术按下表整理成系列文章，依次展开各类方法的公式与对比。

| 文章                                                          | 覆盖内容                                                |
| ----------------------------------------------------------- | --------------------------------------------------- |
| [基础原理](https://github.com/junxnone/aiwiki/issues/809)       | 掩码与稀疏度、粒度分类、稀疏不等于加速、CSR 存储开销、评价指标                   |
| [重要性准则](https://github.com/junxnone/aiwiki/issues/810)      | 幅度、范数、BN 缩放因子、泰勒展开、OBD / OBS、SNIP、移动剪枝              |
| [剪枝流程与时机](https://github.com/junxnone/aiwiki/issues/811)    | 训练前 / 中 / 后、一次性与迭代、渐进式调度、彩票假说、RigL                  |
| [结构化剪枝](https://github.com/junxnone/aiwiki/issues/812)      | 通道耦合、Network Slimming、依赖图、Transformer 的头与层剪枝        |
| [N:M 半结构化稀疏](https://github.com/junxnone/aiwiki/issues/813) | 2:4 模式、Sparse Tensor Core、存储开销、ASP 流程               |
| [LLM 剪枝](https://github.com/junxnone/aiwiki/issues/814)     | 逐层重构、SparseGPT、Wanda、LLM-Pruner、Sheared-LLaMA、层剪枝   |
| [工具](https://github.com/junxnone/aiwiki/issues/815)         | `torch.nn.utils.prune`、Torch-Pruning、NNCF、ASP、TFMOT |

表中：

  - 第一列是系列中的文章，点击进入；第二列是该文章覆盖的代表方法或主题
  - 本文是总览；各概念在下文简述，细节见对应文章

## 基本思想

``` mermaid
flowchart LR
    A[稠密模型] --> B[评估各参数 / 结构的重要性]
    B --> C[移除最不重要的部分]
    C --> D[微调恢复精度]
    D --> E[稀疏 / 更小的模型]
```

图中：剪枝的基本流程是「评分 → 移除 → 微调」，可以一次完成，也可以多轮迭代（见
[剪枝流程与时机](https://github.com/junxnone/aiwiki/issues/811)）。

用掩码 $M$ 表示：

$$ W'=M\\odot W,\\qquad s=1-\\frac{\\lVert M\\rVert\_0}{N} $$

其中：$W$ 为原始权重（共 $N$ 个元素），$M\\in{0,1}^N$ 为掩码，$W'$ 为剪枝后权重，$s$
为稀疏度（被置零的比例）。详见
[基础原理](https://github.com/junxnone/aiwiki/issues/809)。

## 分类

| 维度 | 类型                    | 说明             |
| -- | --------------------- | -------------- |
| 粒度 | 非结构化 / 半结构化（N:M）/ 结构化 | 粒度越粗越容易获得真实加速  |
| 时机 | 训练前 / 训练中 / 训练后       | 训练后最常用，尤其是 LLM |
| 评分 | 幅度 / 梯度 / 二阶信息        | 精度越高，计算量越大     |

表中：对比结论：三个维度相互独立，可以自由组合，例如「训练后 + 幅度评分 + 结构化」。

## 关键陷阱：稀疏不等于加速

非结构化剪枝即使稀疏度很高，如果没有专用稀疏内核或硬件（如 2:4 的 Sparse Tensor
Core），推理速度也不会变快，只是存储变小。要真实加速，应选择：

  - 结构化剪枝（见
    [结构化剪枝](https://github.com/junxnone/aiwiki/issues/812)）：剪完是更小的稠密模型
  - N:M 稀疏（见 [N:M
    半结构化稀疏](https://github.com/junxnone/aiwiki/issues/813)）：硬件原生支持的稀疏模式

## 与其他压缩手段的组合

| 组合      | 做法                      |
| ------- | ----------------------- |
| 剪枝 + 蒸馏 | 用蒸馏损失恢复剪枝后的精度           |
| 剪枝 + 量化 | 先剪枝降低计算量，再量化降低带宽，两者收益叠加 |
| 剪枝 + 微调 | 剪枝后用少量数据微调，LLM 上常用 LoRA |

表中：对比结论：压缩的不同维度正交，常见的做法是「先剪枝或蒸馏，再量化部署」。

## 怎么选

| 场景                    | 推荐                                                                           |
| --------------------- | ---------------------------------------------------------------------------- |
| 通用 GPU / CPU 上要真实加速   | 结构化剪枝                                                                        |
| NVIDIA Ampere 及以上 GPU | 2:4 稀疏                                                                       |
| 只想最小化模型体积             | 非结构化剪枝 + 压缩存储                                                                |
| 已有的大语言模型              | Wanda、SparseGPT，见 [LLM 剪枝](https://github.com/junxnone/aiwiki/issues/814)    |
| 快速实验                  | `torch.nn.utils.prune`，见 [工具](https://github.com/junxnone/aiwiki/issues/815) |

表中：选择的关键是「目标硬件能否利用稀疏」。

## Reference

  - [The Lottery Ticket Hypothesis](https://arxiv.org/abs/1803.03635)
  - [SparseGPT](https://arxiv.org/abs/2301.00774)
  - [Wanda: A Simple and Effective Pruning Approach for
    LLMs](https://openreview.net/pdf?id=tz9JV2PRSv)
  - [LLM-Pruner](https://arxiv.org/pdf/2305.11627)
