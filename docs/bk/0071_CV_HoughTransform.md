-----

| Title         | CV HoughTransform                                    |
| ------------- | ---------------------------------------------------- |
| Created @     | `2020-11-10T06:34:44Z`                               |
| Last Modify @ | `2022-12-27T02:37:29Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/71) |

-----

# Hough Transform 霍夫变换

## Reference

  - [Hough transform -
    Wikipedia](https://en.wikipedia.org/wiki/Hough_transform)
  - [Generalised Hough transform -
    Wikipedia](https://en.wikipedia.org/wiki/Generalised_Hough_transform)
  - [霍夫变换](https://www.cnblogs.com/php-rearch/p/6760683.html)
  - [Hough Transform](http://homepages.inf.ed.ac.uk/rbf/HIPR2/hough.htm)
  - [【OpenCV入门教程之十四】OpenCV霍夫变换：霍夫线变换，霍夫圆变换合辑](https://blog.csdn.net/poem_qianmo/article/details/26977557/)

## Brief

  - 霍夫变换于1962年由PaulHough首次提出
  - 将在一个空间中具有相同形状的曲线或直线映射到另一个坐标空间的一个点上形成峰值，从而把检测任意形状的问题转化为统计峰值问题
  - 霍夫线
  - 霍夫圆

| Line Detection                                               | Circle Detection                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/6f5c0ccf52143dda0fcacc460308b356630805c8.png) | ![image](media/e5ce03f058a461c079a91c81cba60b7047684854.png) |

## 霍夫线变换原理

  - 如果笛卡尔坐标系的点共线，这些点在霍夫空间对应的直线交于一点
  - 找到图像中每个点对应的直线，多条直线的交点对应图像中的直线

| Name  | 笛卡尔坐标                                                        | 霍夫空间                                                         |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 公式    | `y = kx + q`                                                 | ![image](media/9c5239f3d7c6def0b7ed5ccadff30c79fc99fd9a.png) |
| 相应线点  | ![image](media/cf536d4c50f25197b331d3b729a54c7e300f79cd.png) | ![image](media/faac684535417089a7f9937f3f91f7e01b378112.png) |
| 两个点   | ![image](media/e652f5391ded5cf7402a6dde9a6d740b950548da.png) | ![image](media/3db7561daa61d1d29187c4237df1560b172806e5.png) |
| k = ∞ | ![image](media/f9f31a36c0a583c223afc560eff2d1650971ce76.png) | :? ==\> 使用极坐标系                                               |
| 极坐标系  | ![image](media/ae0d4ec451b41b4c4fe7b6cc2e6515d166b25729.png) | ![image](media/840989a4a92badeb15e32ccb9ef50436cb9689ab.png) |

  - **k = ∞**

> ![image](media/798f88553170aa8ce803d2bb12b9aeb26d180574.png)

-----

  - [ OpenCV Examples](https://github.com/junxnone/aiwiki/issues/340)
