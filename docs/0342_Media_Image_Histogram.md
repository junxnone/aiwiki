---
Title | Media Image Histogram
-- | --
Created @ | `2018-10-09T08:20:07Z`
Last Modify @| `2022-12-27T02:40:23Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/342)

---
# Histogram 图像直方图
## Reference
- [OpenCV 中的直方图](https://opencv.apachecn.org/#/docs/4.0.0/4.10-tutorial_py_histograms)

## Brief
- X - 像素值
- Y - 相应的像素数量

Gray | RGB
-- | --
![image](https://user-images.githubusercontent.com/2216970/98321357-d3895580-201f-11eb-87b1-3caba5fd0bfb.png) | ![image](https://user-images.githubusercontent.com/2216970/98321433-06cbe480-2020-11eb-9c5b-04733729c17f.png)

**计算 & 绘制函数**
- cv.calcHist()
- np.histogram()
- np.bincount()
- matplotlib.pyplot.hist()

## 直方图均衡
- 将像素值范围均衡化到更大范围
- 改善图像的对比度


![image](https://user-images.githubusercontent.com/2216970/98321701-b739e880-2020-11eb-9fdd-381335d8ad0e.png) | ![image](https://user-images.githubusercontent.com/2216970/98321807-f2d4b280-2020-11eb-9327-5b408b2b252c.png)
-- | --

原图 |  cv.equalizeHist() - 全局直方图均衡 | cv.createCLAHE() - 自适应直方图均衡 
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/98322026-70002780-2021-11eb-9036-0ed89d91d5f9.png) | ![image](https://user-images.githubusercontent.com/2216970/98322037-77273580-2021-11eb-988d-2dbac89f9b21.png) | ![image](https://user-images.githubusercontent.com/2216970/98322048-7e4e4380-2021-11eb-9a85-54c25791c785.png)

## 2D 直方图
- RGB -> HSV
  - H - [0, 180]
  - S - [0, 256]

**计算方法**
- cv.calcHist([hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
- np.histogram2d(h.ravel(),s.ravel(),[180,256],[[0,180],[0,256]])


![image](https://user-images.githubusercontent.com/2216970/98323179-311fa100-2024-11eb-839f-6b65c8d127c5.png)

## 直方图反投影

- 应用 - 分割部分同色物体

![image](https://user-images.githubusercontent.com/2216970/98323092-ff0e3f00-2023-11eb-82bf-9fa64903851b.png)


