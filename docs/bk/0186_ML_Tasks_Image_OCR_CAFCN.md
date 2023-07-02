-----

| Title         | ML Tasks Image OCR CAFCN                              |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-05-07T06:08:32Z`                                |
| Last Modify @ | `2022-12-24T13:03:27Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/186) |

-----

## Reference

  - [paper - 2018 - Scene Text Recognition from Two-Dimensional
    Perspective](https://arxiv.org/pdf/1809.06508.pdf)
  - [CVPR2019-Scene Text
    Spotting汇总](https://zhuanlan.zhihu.com/p/66719257)
  - [STR from Two-Dimensional
    Perspective](https://zhuanlan.zhihu.com/p/56998973)
  - [【text recognition算法】Scene Text Recognition from Two-Dimensional
    Perspective](https://blog.csdn.net/xuningli84019582/article/details/90478601)
  - [一作blog](https://mhliao.github.io/)

## Brief

  - CA-FCN - `Character Attention Fully Convolutional Network` - 基于 FCN
  - 一维 --\> 二维空间问题
  - 字符注意力机制 - character attention FCN - CA-FCN
  - 金字塔的结构处理字符的尺度变化
  - Deformable convolution 处理字符的形变
  - 词信息模块 - word formation module
  - **特点**
      - 任意形状场景文本识别
      - 尺度变化
      - 字符形变

## 一维空间 vs 二维空间

  - \[paper - 2016 -Robust scene text recognition with automatic
    rectification\] 使用了 `STN` 方法，但是收效不大
    ![image](media/9af85c1a3918952c9f3fe0290a3356dac62cec07.png)

## Arch

  - FCN
      - Backbone - VGG-16
  - FPN 结构
  - Attention module
  - Output - `H/2xW/2xC` \[C = 36 clasess\]

![image](media/a31a38946f40781ecd1f9b27b2a77a9a3b7304e1.png)

### character attention module

![image](media/ccfcea03fdb2bcfb46eb85b20d05784f24867ec7.png)

  - Fo - Output feature map
  - Fi - Input feature map
  - ⊗ - elementwise multiplication
  - A - Attention map
      - 2 convolutional layers 产生
      - 0 表示背景
      - 1 表示characters
      - shape 同 Fi 用于 `elementwise multiplication`

-----

| Attention modules            | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| low-level attention modules  | appearance<br> - edge<br> - color<br> - texture |
| high-level attention modules | semantic information                            |

## Word formation module

![image](media/ecd3df1bf0dd5ac0ef69738f5fd05aa6cc261ed1.png)

  - prediction map --\> binary map \[threshold==240/255\]
  - 计算区域均值获取类别，即 `character`
  - 从左到右排序区域获取 `word`

## image preprocessing

![image](media/1c701f4235db52e936b40d8a20ddc847903cfe52.png)

  - 原始 label 会存在重叠的情况
  - 通过缩小 `label BBox` 来获取新的 label 用于 training

![image](media/e749eb6e5b60f8da93f33102f46e7ceaaa1091a1.png)

> r=0.5 or 0.25

| Name   | Value             |
| ------ | ----------------- |
| Xg-min | `Xmin + w(1-r)/2` |
| Yg-min | `Ymin + h(1-r)/2` |
| Xg-max | `Xmax - w(1-r)/2` |
| Yg-max | `Ymax - h(1-r)/2` |

## Training - Testing 细节

### Training

  - multi-scale
      - 32x128
      - 48x192
      - 64x256
  - augmentation
      - random rotation \[-15, 15\]
      - hue
      - brightnes
      - contrast
      - blur
  - Adam
  - init lr 10^-4
  - 5 epochs
      - epoch 3 - lr=10^-5
      - epoch 4 - lr=10^-6
  - `38 classes- character` = `26 alphabet` + `10 digitals`

### Testing

  - H = 64
  - W =？
      - W = Wo\*H/64 (if Wo/Ho\>4)
      - W = 256

> Wo/Ho 为图片原始尺寸

### Loss

  - character prediction loss - `Lp`
  - character attention loss - `La`

| Name | Loss                                                         |
| ---- | ------------------------------------------------------------ |
| L    | ![image](media/25c5da989c2e8902c80f19225512aa210d56e4d0.png) |
| Lp   | ![image](media/e9bb3fac7953ba531ce911dbe8927c5b21971605.png) |
| La   | ![image](media/94066cb02b15bc2af784094df371e94cab9b3098.png) |

> s - stages α = 1.0

## Performance

  - 45 FPS
      - CA-FCN - `0.018 sec`
      - Word formation module - `0.004 sec`
      - Titan Xp GPU
