-----

| Title     | Media Image Color Space                              |
| --------- | ---------------------------------------------------- |
| Created @ | `2020-11-11T06:09:50Z`                               |
| Updated @ | `2026-11-26T10:18:25Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/41) |

-----

# Color Space 色彩空间

  - Color Spaces - 色彩空间 = `色彩模型 + 色域`
      - Adobe RGB
      - sRGB - `standard RedGreenBlue`
  - Others Color Spaces
      - CIE 1931 color space - `CIE 1931 RGB color space`/`CIE 1931 XYZ
        color space`
      - CIEUVW
      - CIELUV
      - CIELAB
  - [颜色空间变换](https://github.com/junxnone/aiwiki/issues/120)
  - [RGB 色表](/RGB_色表)

## 常见颜色空间

| 颜色空间         | 类型        | 特点                  |
| ------------ | --------- | ------------------- |
| sRGB         | 设备相关的 RGB | 显示器和网页的默认标准，色域较窄    |
| Adobe RGB    | 设备相关的 RGB | 色域比 sRGB 宽，用于摄影和印刷  |
| CIE 1931 XYZ | 设备无关      | 基于人眼实验，是其他空间的参考基准   |
| CIELAB       | 感知均匀      | 欧氏距离近似人眼感知的颜色差异     |
| CIELUV       | 感知均匀      | 与 Lab 类似，常用于光源相关的场景 |

表中：

  - **设备相关**：同一组数值在不同设备上显示可能不同；**感知均匀**：数值差越大，人眼感觉差异越大
  - 对比结论：显示和存储用 sRGB；需要计算颜色差异用 Lab；跨设备转换时用 XYZ 作中间空间

色彩空间与色彩模型、色域的关系见
[Color](https://github.com/junxnone/aiwiki/issues/126)、[Color
Model](https://github.com/junxnone/aiwiki/issues/125)、[Gamut
色域](https://github.com/junxnone/aiwiki/issues/124)。

## Reference

  - [Color FAQ - Frequently Asked Questions
    Color](http://poynton.ca/notes/colour_and_gamma/ColorFAQ.html)
  - [Gamma FAQ - Frequently Asked Questions about
    Gamma](http://poynton.ca/notes/colour_and_gamma/GammaFAQ.html)
  - [ColorSpace颜色空间简介](https://blog.csdn.net/zb1165048017/article/details/109003125)
