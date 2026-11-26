---
Title | Tools Numpy
-- | --
Created @ | `2022-12-13T09:04:40Z`
Updated @| `2026-11-26T09:54:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/328)

---
# Numpy
- NumPy - 来源于两个单词 `Numerical` 和 `Python`
- 提供了大量的进行数值计算的库函数和操作
- 用途:
  - 数学计算
  - 图像处理
  - 机器学习

## 核心：ndarray

NumPy 的核心是 `ndarray`：同一类型元素组成的多维数组，在内存中连续存放。相比 Python 列表，它更省内存，并且运算由 C 实现，可以**向量化**（一次对整个数组运算，不写 Python 循环）。

```python
import numpy as np

a = np.arange(6).reshape(2, 3)      # 形状 (2, 3)
b = np.array([10, 20, 30])          # 形状 (3,)
c = a + b                           # 广播：b 被扩展到 (2, 3)
m = a @ a.T                         # 矩阵乘法
print(a.shape, a.dtype, a.strides)
```

其中：

- `shape`：每个维度的大小；`dtype`：元素类型；`strides`：沿每个维度移动一个元素需要跳过的字节数
- `a + b`：对应元素相加，形状不同时按广播规则扩展
- `@`：矩阵乘法运算符，`a * b` 则是逐元素相乘

## 广播（Broadcasting）规则

两个数组按**尾部对齐**比较各维度，满足下面任一条件即可：

$$
d_a=d_b\ \ \text{或}\ \ d_a=1\ \ \text{或}\ \ d_b=1
$$

其中：$d_a$、$d_b$ 是两个数组在同一维度（从最后一维向前对齐）上的大小；大小为 1 的维度会被复制扩展，使两者形状一致。例如 $(2,3)$ 与 $(3,)$ 相加，后者被视为 $(1,3)$ 再扩展为 $(2,3)$。

## 常用操作

| 类别 | 例子 |
| --- | --- |
| 创建 | `zeros`、`ones`、`arange`、`linspace`、`random.rand` |
| 形状 | `reshape`、`transpose`、`concatenate`、`stack` |
| 索引 | 切片 `a[1:3, :]`、布尔索引 `a[a > 0]`、花式索引 |
| 统计 | `sum`、`mean`、`std`、`max`、`argmax`（可指定 `axis`） |
| 线性代数 | `dot`、`linalg.inv`、`linalg.svd` |

表中：对比结论：能用数组运算和广播的地方，尽量不要写 Python 循环；图像在 NumPy 里就是 `(H, W, C)` 的数组，常与 OpenCV 配合。

## Visualization Tools

- [array-visualizer](https://github.com/biraj21/array-visualizer) [[app](https://arrayvis.netlify.app/)]
- [vedo](https://github.com/marcomusy/vedo)
- [three.js voxel painter](https://threejs.org/examples/#webgl_interactive_voxelpainter) [[editor](https://nmcapule.github.io/voxel-editor/)]
- [ndarray-visualizer](https://github.com/Pewww/ndarray-visualizer)
- [seaborn heatmaps](https://seaborn.pydata.org/examples/spreadsheet_heatmap.html)
- [ndarray_plot](https://github.com/safl/ndarray_plot)
- [matplotlib 3D Voxel](https://matplotlib.org/stable/plot_types/3D/voxels_simple.html)

## History
- `Numeric` + `Numarray` ------> `NumPy`
- 2005 年, 社区统一了数组处理 pacakge, `Numeric` 和 `Numarray` 最后孕育出了 `Numpy` 

