---
Title | Media Image Color Gamut
-- | --
Created @ | `2021-10-25T02:39:07Z`
Updated @| `2026-11-26T09:13:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/124)

---
# Gamut 色域

- Gamut：一个设备、颜色空间或介质所能表示的颜色范围
- CIE 1931 chromaticity diagram：用来比较不同色域的标准图

##  CIE 1931 chromaticity diagram
- x - 红色色系
- y - 绿色色系
- 曲线边沿都是纯色(饱和色)
  - 从 380 --> 710 nm 
  - 内部点是混合色
- D65 white point 
  - 等能量点 
  - 饱和度为0

其中 $x,y$ 是色度坐标，由 CIE XYZ 三刺激值归一化得到：

$$
x=\frac{X}{X+Y+Z},\qquad y=\frac{Y}{X+Y+Z},\qquad z=1-x-y
$$

其中：

- $X,Y,Z$：CIE 1931 XYZ 三刺激值，$Y$ 对应亮度
- $x,y$：色度坐标，只描述颜色的「色调和饱和度」，不含亮度；$x$ 偏向红，$y$ 偏向绿
- $z$：由 $x+y+z=1$ 得到，因此二维图（$x,y$）就足以表示色度
- 马蹄形曲线边缘：单色光（光谱轨迹），即纯色；内部点是混合色
- D65 白点：标准日光白，约为 $(x,y)=(0.3127,\ 0.3290)$，饱和度为 0

![image](https://user-images.githubusercontent.com/2216970/138627879-c19866d7-c7a8-45c3-814e-f976bd43d3d6.png) 

![image](https://user-images.githubusercontent.com/2216970/138626907-aae12d3e-1f00-4717-b35d-08b0b8c139ce.png)
-- |
![image](https://user-images.githubusercontent.com/2216970/138628159-ebbd2a8a-7d71-4f07-8a39-59c4acb2f234.png)

图中：以上各图为原文档附带的 CIE 1931 色度图相关示意图，对应上面对 $x,y$ 坐标和光谱轨迹、白点的说明。

## 颜色空间色域比较
- `ProPhoto RGB` > `Adobe RGB` > `Colormatch RGB` > `sRGB`

![image](https://user-images.githubusercontent.com/2216970/138626590-90b3eb8b-6eea-48c3-98ac-a955422074d6.png)

图中：该图为原文档附带的各颜色空间色域在 CIE 1931 图中的三角形比较，三角形越大表示色域越宽。

RGB 色域在色度图上是由三个原色围成的三角形，例如 sRGB 的三原色色度坐标约为：

| 原色 | $x$ | $y$ |
| --- | --- | --- |
| 红 R | 0.64 | 0.33 |
| 绿 G | 0.30 | 0.60 |
| 蓝 B | 0.15 | 0.06 |

表中：

- 三个点围成的三角形内的颜色可由这三个原色混合得到，三角形外的颜色该设备无法显示
- 对比结论：原色越「纯」（越靠近马蹄形边缘），三角形越大，色域越广；ProPhoto RGB 最宽，sRGB 最窄，因此 sRGB 图像在宽色域屏幕上若不做色彩管理会显得过饱和

## Reference
- [Gamut - wikipedia](https://en.wikipedia.org/wiki/Gamut)

