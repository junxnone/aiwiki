-----

| Title     | Media Image Color                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-10-25T03:13:08Z`                                |
| Updated @ | `2026-11-26T09:13:30Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/126) |

-----

# Color

颜色相关三个基本概念：颜色模型、色域、颜色空间，它们的关系是：**颜色空间 = 颜色模型 + 色域**。

  - [Image Color Model](https://github.com/junxnone/aiwiki/issues/125)
  - [Image Color Spaces](https://github.com/junxnone/aiwiki/issues/41)
  - [Image Color Gamut](https://github.com/junxnone/aiwiki/issues/124)
  - [Color Space 转换](https://github.com/junxnone/aiwiki/issues/120)

| Name         | Description                             | Example                               |
| ------------ | --------------------------------------- | ------------------------------------- |
| Color Model  | 颜色的分解方式                                 | RGB/CMYK/HSV/...                      |
| Color Gamut  | 自然界颜色集合的部分<br>受限于设备或者颜料只能显示或者打印自然界颜色的子集 | sRGB 色域、Adobe RGB 色域                  |
| Color Spaces | Model + Gamut 使用坐标系表示特定的颜色              | sRGB/Adobe RGB/SWOP CMYK/ProPhoto RGB |

表中：

  - **Color Model**：回答「用哪几个分量描述颜色」；**Color Gamut**：回答「能表示哪些颜色」；**Color
    Spaces**：两者结合后能给出具体、可复现的颜色
  - 对比结论：同样是 RGB 模型，sRGB 与 Adobe RGB 因色域不同是不同的颜色空间，同一组 RGB 数值显示出来的颜色并不相同

<!-- end list -->

``` mermaid
flowchart LR
    M[颜色模型 RGB] --> S[颜色空间 sRGB]
    G[色域 sRGB 范围] --> S
    M --> S2[颜色空间 Adobe RGB]
    G2[色域 Adobe RGB 范围] --> S2
```

图中：

  - 同一个颜色模型（RGB）配上不同的色域，得到不同的颜色空间
  - 关键结论：说「一个颜色」时，必须同时说明它所处的颜色空间，否则数值没有确定含义
