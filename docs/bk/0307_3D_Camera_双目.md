-----

| Title         | 3D Camera 双目                                          |
| ------------- | ----------------------------------------------------- |
| Created @     | `2022-04-06T03:04:59Z`                                |
| Last Modify @ | `2022-12-24T16:22:56Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/307) |

-----

## Reference

  - [视差图Disparity与深度图Depth
    Map的一点知识](https://www.codenong.com/cs105964662/)
  - [双目视觉（一）双目视觉系统](https://blog.csdn.net/He3he3he/article/details/101053457)
  - [双目视觉（六）U-V视差](https://blog.csdn.net/He3he3he/article/details/105293258)
  - [计算机视觉：相机成像原理：世界坐标系、相机坐标系、图像坐标系、像素坐标系之间的转换](https://blog.csdn.net/chentravelling/article/details/53558096)

## Brief

  - 双目立体视觉: 基于视差原理, 获取被测物体的不同角度的两幅图像，计算图像对应点的位置偏差获取物体三维信息
  - 视差/Disparity
  - UV-Disparity Mapping
  - 结构光基于双目视觉(提供了主动标记)
  - **局限性**
      - 对环境光敏感
      - 不适合单调缺乏纹理场景
      - 计算复杂度高
      - 相机基线限制测量范围

## 坐标系

  - 世界坐标系
  - 相机坐标系
  - 图像坐标系
  - 像素坐标系

![image](media/ba55e6a2b01e23c7300ed7459f065995211da92a.png)

## UV-DIsparity Mapping

  - 统计视差行列中视差值 \[0,1,2,3,4...\] 个数

| 原理                                                           | 实际图像                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/8e7ad8bdb865f713ab3f49da3248751faddbfca3.png) | ![image](media/bb36adfaaf035b58de60ca87b4ba3896366b726e.png) |

## 原理

### 对极几何/`Epipolar Geometry`

  - 基线 - `Baseline`: 直线 $O\_c - O^{'}\_c$
  - 对极平面束 - `Epipolar Pencil`: 以基线为轴的平面束
  - 对极平面 - `Epipolar Plane`: 任何包含基线的平面都称为对极平面
  - 对极点 - `Epipole`: 摄像机的基线与每幅图像的交点 $e$ 和 $e^{'}$
  - 对极线 - `Epipolar Line`: 对极平面与图像的交线 $x-e$ 和 $x^{'} - e^{'}$
  - 5点共面: 图像上点 $x x'$ + 摄像机中心$O\_c O^{'}\_c$ + 空间点 $X$ =\> 5点共面
  - 极线约束: 两极线上点的对应关系。

| 单目                                                           | 双目                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/8f24fdae4ac14a363913515ec3298264257268d7.png) | ![image](media/eabdbe422b0cec6cd6a4521459a7c0072e2cf869.png) |

![image](media/13e78ebb6c450bb06d83db7732a02bc38c9e0bf6.png)
![image](media/85e08c25674724cf616cd3fcee98212453274cdd.png)
![image](media/f140484d7153da9db7134efe6ff9eff9c6ab0b16.png)

### 计算

  - $Depth(Z) = \\frac{FocalLength(f) \* Baseline(b)}{Disparity \*
    PixelSize}$

![image](media/bd7bfc88ab921b0ba1870502b356ab837ddd6403.png)

| Name         | 图解                                                           |
| ------------ | ------------------------------------------------------------ |
| Focal Length | ![image](media/67a57090686b332bcbe1b65bb3632b03bbbd2bf4.png) |
| Baseline     | ![image](media/896fdda87a12d3824be9bd376c45db293b6786f4.png) |
| Pixel Size   | ![image](media/f523fd60f4bed7d13af97de2ede16d7ce3515639.png) |
| Disparity    | ![image](media/6e055774dc4cd087f54c5e7f5bdeb265291d4a88.png) |
