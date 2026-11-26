---
Title | ML Tasks MD
-- | --
Created @ | `2019-08-21T01:55:30Z`
Updated @| `2026-11-26T10:21:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/243)

---
# Motion Detection 运动侦测

运动侦测：在视频中判断是否有物体运动，并找出运动的区域。

```mermaid
flowchart LR
    A[视频帧] --> B[帧差分 或 背景建模]
    B --> C[前景掩码]
    C --> D[去噪 形态学]
    D --> E[找轮廓 得到运动区域]
```

图中：对视频帧用帧差分或背景模型得到前景掩码，经形态学去噪后提取轮廓，即得到运动区域。

## 分类

- 帧差分法 (frame differencing)
- 背景减除法 (Background subtraction)
  - 高斯模型 (Gaussian Model)
  - W4 algorithm
  - 基于颜色信息的背景建模 (color)
  - 本征背景法
  - 核密度估计方法
  - 背景统计模型
  - 复杂背景下的前景物体检测 (FGD)
  -  码本 (CodeBook)  
  - 样本一致性背景建模算法 (SACON)
  - 自组织背景建模 (SOBS: Self-organization background subtraction)
  - ViBe (A Universal Background Subtraction)
- 运动分割（motion segmentation）
  - 光流法 (optical flow)
  - 运动竞争 (Motion Competition)
  - DECOLOR
  - Long Term Video Analysis
- 运动历史图像 （motion history image, MHI）
- **应用** 
  - Auto-ROI
  - 人体/宠物检测

## 方法对比

| 方法 | 原理 | 特点 |
| --- | --- | --- |
| 帧差分 | 相邻帧相减，见 [absdiff](https://github.com/junxnone/aiwiki/issues/353) | 简单快速，对缓慢运动、光照变化敏感 |
| 背景减除 | 建立背景模型，当前帧与背景比较 | 适合固定摄像头，需要更新背景 |
| 光流 | 估计像素运动向量，见 [光流](https://github.com/junxnone/aiwiki/issues/559) | 可用于运动摄像头，计算量大 |

表中：对比结论：固定摄像头、要求快用帧差分或背景减除；需要运动方向和速度用光流。

## 公式

帧差分：

$$
M(x,y)=\begin{cases}1 & \lvert I_t(x,y)-I_{t-1}(x,y)\rvert>\tau\0 & \text{否则}\end{cases}
$$

其中：$I_t,I_{t-1}$ 为当前帧和上一帧；$\tau$ 为差值阈值；$M$ 为运动掩码（1 表示该像素发生运动）。

高斯混合背景模型：

$$
P(I_t)=\sum_{k=1}^{K}w_k\,\mathcal{N}\big(I_t;\mu_k,\sigma_k^2\big)
$$

其中：$K$ 个高斯分布描述一个像素的取值分布；$w_k,\mu_k,\sigma_k^2$ 为第 $k$ 个分量的权重、均值和方差；被现有分布较好解释的像素视为背景，否则视为前景。

## Reference

- [运动检测文献综述](http://blog.huajh7.com/2017/04/06/motion-detection/)
- [Change Detection - Algo - Datasets](http://www.changedetection.net/)
- [目标检测中背景建模方法](https://www.cnblogs.com/ronny/archive/2012/04/12/2444053.html)

