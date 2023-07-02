-----

| Title         | Media Image Color Model                               |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-10-25T03:08:34Z`                                |
| Last Modify @ | `2022-12-23T13:32:22Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/125) |

-----

# Color Model 色彩模型

## Reference

  - [Color model - wikipedia](https://en.wikipedia.org/wiki/Color_model)
  - [Color Models - Intel
    IPP](https://www.intel.com/content/www/us/en/develop/documentation/ipp-dev-reference/top/volume-2-image-processing/image-color-conversion/color-models.html)

## Brief

  - Color Model - 色彩模型 - 抽象数学模型分解色彩分量, 描述颜色
      - RGB - 用于计算机图形学 - 基于人眼感光细胞
      - CMYK - 用于彩色打印
      - [YUV](/YUV) - 用于视频
      - LAB - 基于人眼视觉神经
      - HSV/HSB
      - HSL
      - RYB

## RGB & CMYK

  - 人眼对于 `RGB` 三种颜色分量的敏感程度不同 `R<G<B`
  - 均匀性较差, 使用 `欧氏距离` 度量相似性结果会合人眼视觉有较大偏差
  - 光三原色 - 红/绿/蓝 - Red/Green/Blue
  - 颜料三原色 - 青/洋红/黄 -Cyan/Magenta/Yellow

> 通过混合颜料无法得出纯粹的黑色，因此在印刷品中又加入了黑色（Black）得到 `CMYK`

![image](media/4e306a962a62dabf7fd1a11aa45e5abf75896fc3.png)

![chrome\_BFsF54nopB](media/0ccb90b419e106c032bc711b77189d9b9cb5f5fb.png)
![chrome\_VZC8n9V9VZ](media/ece2e179b11ba52a52bbecfa316bb30cd03e739a.png)

## HSV/HSB

  - HSV - Hue/Saturation/Value(Brightness)
  - Hue - 色调/色相 - 是什么颜色 - 取决于主波长
  - Saturation - 饱和度 - 色彩浓淡/纯度 `颜色+白色` `饱和=纯色`
      - 饱和度越高(低), 颜色越纯正(淡)
  - Brightness - 明亮度 --\> 黑色

| ![image](media/b5f5f86307c5105839c78a83f2c8571081414f5a.png) | ![image](media/3256e3bb2104a59c2eb48bc311edde1550eae52b.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/56265d4429cc032cda94929e49784df68642fade.png) | ![image](media/912b124a5ace4b8fc75102647f53e1f7e8fbb1e1.png) |

| ![image](media/87b552f0be9e962080df59f1ba29e9c0d64c8c78.png) | ![HSV\_cone](media/ea939938c2180678bde58f16f047c13ec39ed578.jpg) | ![Hsv-hues-cf-lch-hues](media/c3f0f32d218915b98ac2bf3fea5923278d5f881d.png) |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| ![image](media/d8fe42935600875b6ee74d844d183e201da093ae.png) | ![image](media/9496b91bc24a8f3acb54c2b9a7c21003500905db.png)     | ![image](media/9d6fdf50375cb8c1140141111d0d86b25408102b.png)                |

## HSL

  - HSL - Hue/Saturation/Lightness

![image](media/75e88a4ddeb61d3d5582321a8bc365c05306ee4b.png)

| HSV                                                          | HSL                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/dcf7518685204a7ab6a50cfe2bbb98ff0c67896d.png) | ![image](media/4acc7387cb0418c74d5085b66e3adff44b5dc186.png) |
