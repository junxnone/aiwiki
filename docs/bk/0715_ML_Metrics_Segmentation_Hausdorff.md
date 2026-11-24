-----

| Title     | ML Metrics Segmentation Hausdorff                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T01:03:56Z`                                |
| Updated @ | `2026-11-24T01:03:56Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/715) |

-----

# Hausdorff

  - 区域重合指标（[IoU /
    Dice](/0231_ML_Metrics_Segmentation)）对边界偏差不敏感；**距离类**指标直接测量预测边界与真值边界之间有多远，单位是像素或毫米
  - 医学图像分割（器官/肿瘤轮廓）中最常用，同时是评估分割边界最坏偏差的指标
  - 与 [Boundary F1-Score](/0526_ML_Metrics_Segmentation_BF1S)
    互补：Boundary F1 看「有多少边界匹配上」，Hausdorff 看「偏差有多大」

## Hausdorff Distance

$$ h(A, B) = \\max\_{a \\in A}\\ \\min\_{b \\in B} \\lVert a - b
\\rVert, \\qquad HD(A, B) = \\max\\big(h(A, B),\\ h(B, A)\\big) $$

其中：

  - $A$：预测边界（表面）上的点集；$B$：真值边界上的点集；$a, b$ 分别为两个点集中的点
  - $\\min\_{b \\in B} \\lVert a - b \\rVert$：点 $a$ 到真值边界的最短距离
  - $h(A, B)$：有向 Hausdorff 距离，即预测边界上「离真值最远」的那个点到真值的距离；$h(B, A)$
    反之，衡量真值上最远离预测的点（漏掉的部分）
  - $HD$：取两个方向中较大的值，所以是**对称**的；它等于「最坏情况下的边界偏差」，值越小越好，0 表示两个边界完全重合

## HD95

  - Hausdorff 取的是最大值，对**离群点极度敏感**：一个孤立的误检像素就会让 HD 变得很大
  - **HD95**：取所有点对距离的第 95 百分位数，而不是最大值，忽略最差的 5%，更稳健，是实际中最常用的版本

$$ HD\_{95}(A, B) = \\max\\Big(\\text{P}*{95}\\big{d(a, B)\\big}*{a \\in
A},\\ \\text{P}*{95}\\big{d(b, A)\\big}*{b \\in B}\\Big) $$

其中：$d(a, B) = \\min\_{b \\in B}\\lVert a - b \\rVert$
为点到对方边界的最短距离，$\\text{P}\_{95}{\\cdot}$ 为这些距离的第
95 百分位数。

## ASSD / ASD

  - **ASD** - `Average Surface Distance`：边界点到对方边界最短距离的平均值
  - **ASSD** - `Average Symmetric Surface Distance`：两个方向的距离合在一起取平均

$$ ASSD = \\frac{\\sum\_{a \\in A} d(a, B) + \\sum\_{b \\in B} d(b,
A)}{\\lvert A \\rvert + \\lvert B \\rvert} $$

其中：$\\lvert A \\rvert$、$\\lvert B \\rvert$ 为两个边界的点数；ASSD
反映平均偏差，对少量离群点不敏感，常与 HD95
一起报告（一个看平均、一个看最坏）。

## NSD

  - **NSD** - `Normalized Surface Dice`（Surface Dice at tolerance
    $\\tau$）：在容差 $\\tau$ 内的边界比例，形式与 [Boundary
    F1](/0526_ML_Metrics_Segmentation_BF1S) 类似

$$ NSD = \\frac{\\lvert {a \\in A : d(a, B) \\le \\tau} \\rvert +
\\lvert {b \\in B : d(b, A) \\le \\tau} \\rvert}{\\lvert A \\rvert +
\\lvert B \\rvert} $$

其中：$\\tau$ 为容差（mm 或像素），应该根据临床/业务能接受的偏差设定，也要考虑标注者之间的差异；取值 $\[0,
1\]$，越大越好。

## 指标对比

| Name       | 反映什么        | 对离群点 | 取值              | 单位         |
| ---------- | ----------- | ---- | --------------- | ---------- |
| Dice / IoU | 区域重合比例      | 不敏感  | $\[0, 1\]$ 越大越好 | 无          |
| HD         | 最坏边界偏差      | 极敏感  | $\\ge 0$ 越小越好   | mm / pixel |
| HD95       | 95% 分位的边界偏差 | 较稳健  | $\\ge 0$ 越小越好   | mm / pixel |
| ASSD       | 平均边界偏差      | 稳健   | $\\ge 0$ 越小越好   | mm / pixel |
| NSD        | 容差内的边界比例    | 稳健   | $\[0, 1\]$ 越大越好 | 无          |

表中是常见分割指标的对比：区域类指标和距离类指标反映的是不同方面，医学分割推荐至少各报一个（如 Dice + HD95）。

## 注意

  - 距离的单位：要用像素间距（spacing）把像素距离转换为 mm，不同分辨率的数据才可比
  - **空掩码**：预测或真值为空时距离没有定义，通常记为最大值（图像对角线长度）或单独统计
  - 距离只在有目标的图上有意义，批量评估时先统计「有/无目标」的情况再算平均
  - 计算量较大（点对距离），实际用距离变换（Distance Transform）计算

## Code

``` python
import numpy as np
from scipy import ndimage as ndi

def surface_distances(pred, gt, spacing=(1.0, 1.0)):
    # pred, gt: bool (H, W)
    sp = pred & ~ndi.binary_erosion(pred)             # 预测边界
    sg = gt & ~ndi.binary_erosion(gt)                 # 真值边界
    dist_to_g = ndi.distance_transform_edt(~sg, sampling=spacing)
    dist_to_p = ndi.distance_transform_edt(~sp, sampling=spacing)
    return dist_to_g[sp], dist_to_p[sg]               # a->B, b->A 的距离

d_pg, d_gp = surface_distances(pred, gt)
hd = max(d_pg.max(), d_gp.max())
hd95 = max(np.percentile(d_pg, 95), np.percentile(d_gp, 95))
assd = (d_pg.sum() + d_gp.sum()) / (len(d_pg) + len(d_gp))
```

## Reference

  - [Hausdorff distance -
    Wikipedia](https://en.wikipedia.org/wiki/Hausdorff_distance)
  - [Metrics reloaded: Recommendations for image analysis
    validation](https://arxiv.org/abs/2206.01653)
  - [Deepmind
    surface-distance](https://github.com/google-deepmind/surface-distance)
