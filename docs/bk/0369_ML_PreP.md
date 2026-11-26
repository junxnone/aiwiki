-----

| Title     | ML PreP                                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-02-02T09:16:27Z`                                |
| Updated @ | `2026-11-26T10:15:19Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/369) |

-----

# PreProcessing

## 数据处理

  - 数据清洗
  - 归一化
  - 数据增强
  - ...

| 步骤        | 目的              | 文章                                                                                                                                                                                                                                          |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 数据清洗      | 去除错误、重复、缺失的样本   |                                                                                                                                                                                                                                             |
| 归一化 / 标准化 | 把特征缩放到相近范围，加快收敛 | [Data Normalization](https://github.com/junxnone/aiwiki/issues/251)                                                                                                                                                                         |
| 数据增强      | 增加数据多样性，减少过拟合   | [DataAug](https://github.com/junxnone/aiwiki/issues/255)、[Cutout](https://github.com/junxnone/aiwiki/issues/257)、[AutoAugment](https://github.com/junxnone/aiwiki/issues/256)、[Copy-Pasting](https://github.com/junxnone/aiwiki/issues/269) |

表中：对比结论：清洗是前提，归一化保证训练稳定，增强提升泛化。

标准化公式：

$$ x' = \\frac{x-\\mu}{\\sigma} $$

其中：$x$ 为原始值，$\\mu$、$\\sigma$ 为训练集的均值与标准差，$x'$ 为标准化后的值；测试时使用训练集的
$\\mu,\\sigma$，不能重新计算。
