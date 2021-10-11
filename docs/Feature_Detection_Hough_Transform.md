---
Title | Feature Detection Hough Transform
-- | --
Create Date | `2021-10-11T07:40:49Z`
Update Date | `2021-10-11T07:40:49Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/71)

---
# Reference
- [Hough transform - Wikipedia](https://en.wikipedia.org/wiki/Hough_transform)
- [Generalised Hough transform - Wikipedia](https://en.wikipedia.org/wiki/Generalised_Hough_transform)
- [霍夫变换](https://www.cnblogs.com/php-rearch/p/6760683.html)
- [Hough Transform](http://homepages.inf.ed.ac.uk/rbf/HIPR2/hough.htm)
- [【OpenCV入门教程之十四】OpenCV霍夫变换：霍夫线变换，霍夫圆变换合辑](https://blog.csdn.net/poem_qianmo/article/details/26977557/)

# Brief
- 霍夫变换于1962年由PaulHough首次提出
- 将在一个空间中具有相同形状的曲线或直线映射到另一个坐标空间的一个点上形成峰值，从而把检测任意形状的问题转化为统计峰值问题
- 霍夫线
- 霍夫圆


Line Detection | Circle Detection
-- | --
![image](https://user-images.githubusercontent.com/2216970/98335293-a8166300-203f-11eb-9d14-b65449474d47.png) | ![image](https://user-images.githubusercontent.com/2216970/98337072-0133c600-2043-11eb-8d92-c41b1ee24381.png)


## 霍夫线变换原理
- 如果笛卡尔坐标系的点共线，这些点在霍夫空间对应的直线交于一点
- 找到图像中每个点对应的直线，多条直线的交点对应图像中的直线

Name | 笛卡尔坐标 | 霍夫空间
-- | -- | --
公式 | `y = kx + q` | ![image](https://user-images.githubusercontent.com/2216970/98332990-c0d04a00-203a-11eb-8bde-55cef37f16fd.png)
相应线点 | ![image](https://user-images.githubusercontent.com/2216970/98332924-a1d1b800-203a-11eb-963d-8fbb45f2adc5.png) | ![image](https://user-images.githubusercontent.com/2216970/98332945-aac28980-203a-11eb-9ed9-ae3e0c6ec764.png)
两个点 | ![image](https://user-images.githubusercontent.com/2216970/98333134-0ab93000-203b-11eb-8279-f53343de2539.png) | ![image](https://user-images.githubusercontent.com/2216970/98333146-10af1100-203b-11eb-8a83-b27a29706314.png)
k = ∞ | ![image](https://user-images.githubusercontent.com/2216970/98333415-a5197380-203b-11eb-811a-819c3173d0ec.png) | :? ==> 使用极坐标系
极坐标系 | ![image](https://user-images.githubusercontent.com/2216970/98333778-718b1900-203c-11eb-810c-5ab18299536b.png) | ![image](https://user-images.githubusercontent.com/2216970/98333794-7c45ae00-203c-11eb-8148-c01775ec16f0.png)

- **k = ∞** 
> ![image](https://user-images.githubusercontent.com/2216970/98333561-02adc000-203c-11eb-8364-1a0f7ec12c5e.png)




---
- [ OpenCV Examples](https://github.com/junxnone/examples/issues/223)
