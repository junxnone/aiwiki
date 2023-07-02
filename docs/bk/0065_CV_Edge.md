-----

| Title         | CV Edge                                              |
| ------------- | ---------------------------------------------------- |
| Created @     | `2020-11-12T07:09:54Z`                               |
| Last Modify @ | `2022-12-23T14:39:44Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/65) |

-----

# 边缘

## Reference

  - [Prewitt operator](https://en.wikipedia.org/wiki/Prewitt_operator)
  - [梯度与Roberts、Prewitt、Sobel、Lapacian算子](https://blog.csdn.net/swj110119/article/details/51777422)
  - 1970 [Object enhancement and
    extraction](http://web.eecs.utk.edu/~hqi/ece472-572/reference/edge-Prewitt70.pdf)
  - [数字图像处理:边缘检测(Edge detection)](https://zhuanlan.zhihu.com/p/59640437)
  - [Awesome-Edge-Detection-Papers](https://github.com/MarkMoHR/Awesome-Edge-Detection-Papers)
  - [传统实现 - prewitt/laplace/sobel/scharr/Canny
    ](https://github.com/butub1/Edge-detection)

## Brief

  - Roberts
  - Prewitt
  - Sobel
  - Scharr
  - [Canny](/Edge_Detection_Canny)
  - Marr-Hildreth

> DL 中一般使用 `Object Contour Detection` & `Semantic Segmentation` 检测边缘

## Roberts

  - 用于图像锐化
  - 计算量小
  - 结果边缘不平滑

| Original     | Vertical - Positive                                          | Horizontal - Negative                                        |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Computations | ![image](media/176d326a1dc5b11c876a6a111ced160190662936.png) | ![image](media/e60979b4c8cad00cd7796cefec89c54ec2c762dc.png) |
| Pixel 权重     | ![image](media/e60979b4c8cad00cd7796cefec89c54ec2c762dc.png) | ![image](media/3d9855de983d026ba3bb5fb161906b7345b04f02.png) |

## Prewitt

| Original                                                     | Vertical                                                     | Horizontal                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Computations                                                 | ![image](media/0fe4b0cb09566be113e944770021eb57c5de4ce7.png) | ![image](media/3f3793450edb9163067ea8caaf9b19ff8be1ab01.png) |
| Pixel 权重                                                     | ![image](media/47398d4a154b59207d979434b288b5410708f061.png) | ![image](media/85a380b474e80a060f714186f2c7029184fe2c9c.png) |
| ![image](media/a76c6a7fc5da2ea8519dbb00695b3d1fd5df3696.png) | ![image](media/dcbb5a1e8b4967ca02abe8b84f45f7fcdbe7e77c.png) | ![image](media/cf70a8af3a3f4f70b9eb9e9900e9e4d32029e976.png) |

## Sobel

  - 相比 `prewitt` 增加了权重

| Direction    | Vertical - Gx                                                | Horizontal - Gy                                              |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Computations | ![image](media/cefb747798cb58af9d28fe80cd990c612e578963.png) | ![image](media/d38345c6baf7134c8e68b94c14e7e8183245b4f1.png) |
| Pixel 权重     | ![image](media/4417397475da48f3bfb9bb380b6e90846a255ed6.png) | ![image](media/50be7b5b1b343a59bd31932d41048d4baa78abd3.png) |

## Scharr

  - 使用了更大的权重

| Direction    | Vertical - Gx                                                | Horizontal - Gy                                              |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Computations | ![image](media/a396862bd77b97ed3dc9b36d3a9ea8a160c8f664.png) | ![image](media/51aa7de0af83eae3e7dedadc01969362476dc531.png) |
| Pixel 权重     | ![image](media/ace01a6bbdc460fe4ef4c87c241ec851a089bb8a.png) | ![image](media/24fe3dc7af1f3a124f05cbf1488659518a2521a4.png) |

## Prewitt vs Sobel vs Scharr

| Original                                                     | Roberts                                                      | Prewitt                                                      | Sobel                                                        | Scharr                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/fb8100493d24ab2c0fa06a6c0d225694010a01c0.png) | ![image](media/897877ea9c118e85e50ee6aebbb2a3bedd38190a.png) | ![image](media/281ab365cc898c207a263d87723d4697fb06fc64.png) | ![image](media/c56cb453eeb7f7d2f07ae534368c581d884bb3f1.png) | ![image](media/4da77075820457a3dff26debf476ce6538af676a.png) |
