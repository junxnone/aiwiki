-----

| Title     | ML PostP                                              |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-02-02T09:27:51Z`                                |
| Updated @ | `2026-11-26T10:15:22Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/370) |

-----

# PostProcessing

  - 模型生成结果的一些处理
  - Metrics 的计算
  - 结果的二值化，图像的拼接，等等

## 常见后处理

| 任务 | 后处理             | 说明              |
| -- | --------------- | --------------- |
| 分类 | softmax、取 top-k | 把得分转成概率，选最可能的类别 |
| 检测 | 置信度过滤、NMS       | 去掉低置信度框和重复框     |
| 分割 | 阈值二值化、连通域分析     | 得到最终掩码          |
| 大图 | 分块推理后拼接         | 把小块结果合成整图       |

表中：对比结论：模型输出通常是得分或概率，后处理把它变成可用的最终结果。

NMS（非极大值抑制）用 IoU 判断两个框是否重复：

$$ \\mathrm{IoU}(A,B)=\\frac{\\lvert A\\cap B\\rvert}{\\lvert A\\cup
B\\rvert} $$

其中：$A,B$ 为两个检测框的区域，$\\lvert\\cdot\\rvert$ 为面积；$\\mathrm{IoU}$ 超过阈值（如
0.5）时，只保留得分高的那个框。指标计算见 [ML
Metrics](https://github.com/junxnone/aiwiki/issues/138)。
