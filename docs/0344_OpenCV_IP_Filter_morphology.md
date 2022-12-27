---
Title | OpenCV IP Filter morphology
-- | --
Created @ | `2018-12-20T08:46:04Z`
Last Modify @| `2022-12-27T09:16:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/344)

---
# 膨胀腐蚀

## Reference
- [Morphology - HIPR2](http://homepages.inf.ed.ac.uk/rbf/HIPR2/morops.htm)
- [Morphological - OpenCV](https://opencv.apachecn.org/#/docs/4.0.0/4.5-tutorial_py_morphological_ops)


## Brief

Name | Description | Examples 
-- | -- | --
腐蚀 | 侵蚀前景对象的边界<br>`白色/高值` => `黑色/0` | ![image](https://user-images.githubusercontent.com/2216970/98208551-6cfd2c80-1f78-11eb-9e45-1ce1503ca62b.png) => ![image](https://user-images.githubusercontent.com/2216970/98208556-6ff81d00-1f78-11eb-8e73-9ad571b8d6a2.png)
膨胀 | 增加前景对象的边界<br>`黑色/0`  => `白色/高值`  | ![image](https://user-images.githubusercontent.com/2216970/98208551-6cfd2c80-1f78-11eb-9e45-1ce1503ca62b.png) =>![image](https://user-images.githubusercontent.com/2216970/98208797-e137d000-1f78-11eb-854b-c0de9ba2d1ae.png)
开运算 | 腐蚀后膨胀 | ![image](https://user-images.githubusercontent.com/2216970/98208944-1c3a0380-1f79-11eb-9973-740a98a4450d.png)
闭运算 | 膨胀后腐蚀 | ![image](https://user-images.githubusercontent.com/2216970/98208953-1fcd8a80-1f79-11eb-9314-300c8c10d555.png)
形态梯度 |膨胀腐蚀差值 | ![image](https://user-images.githubusercontent.com/2216970/98209002-3247c400-1f79-11eb-8ed5-309aa609013e.png)
顶帽 | 原图像和开运算的差值 | ![image](https://user-images.githubusercontent.com/2216970/98209018-3a076880-1f79-11eb-9dbe-e1602208afda.png)
黑帽 | 原图像和闭运算的差值| ![image](https://user-images.githubusercontent.com/2216970/98209036-3d9aef80-1f79-11eb-8021-9ce72791abf9.png)





## 腐蚀

```
#coding=utf-8
import cv2
import numpy as np
import matplotlib.pyplot as plt

img = cv2.imread('t.png', 0)
#img = cv2.cvtColor(oimg, cv2.COLOR_BGR2RGB)

m1 = plt.imshow(img)
m1.set_cmap('gray')
plt.show()

kernel = np.ones((5, 5), np.uint8)
erosion = cv2.erode(img, kernel)  # 腐蚀
fig = plt.figure()
m1 = plt.imshow(erosion)
m1.set_cmap('gray')
plt.show()

kernel = np.ones((10, 10), np.uint8)
erosion = cv2.erode(img, kernel)  # 腐蚀
fig = plt.figure()
m1 = plt.imshow(erosion)
m1.set_cmap('gray')
plt.show()
```
原图 | 5x5 腐蚀 | 10x10 腐蚀
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/50381148-2ff85b80-06ba-11e9-84a7-9b2b13841edb.png) | ![image](https://user-images.githubusercontent.com/2216970/50381149-31c21f00-06ba-11e9-93d0-5d01d9608603.png) | ![image](https://user-images.githubusercontent.com/2216970/50381151-34247900-06ba-11e9-9692-474e2a4d4d6c.png)

```
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (10, 10))  # 矩形结构
erosion = cv2.erode(img, kernel)  # 腐蚀
fig = plt.figure()
m1 = plt.imshow(erosion)
m1.set_cmap('gray')
plt.show()

kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (10, 10))  # 椭圆结构
erosion = cv2.erode(img, kernel)  # 腐蚀
fig = plt.figure()
m1 = plt.imshow(erosion)
m1.set_cmap('gray')
plt.show()

kernel = cv2.getStructuringElement(cv2.MORPH_CROSS, (10, 10))  # 十字形结构
erosion = cv2.erode(img, kernel)  # 腐蚀
fig = plt.figure()
m1 = plt.imshow(erosion)
m1.set_cmap('gray')
plt.show()
```
矩形结构腐蚀 | 椭圆结构腐蚀 | 十字结构腐蚀
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/50381158-4dc5c080-06ba-11e9-8ca7-4723ac372034.png) | ![image](https://user-images.githubusercontent.com/2216970/50381159-4f8f8400-06ba-11e9-843c-1cc57c32d517.png) | ![image](https://user-images.githubusercontent.com/2216970/50381160-51594780-06ba-11e9-995b-afb51561f168.png)



## 膨胀

```
kernel = np.ones((5, 5), np.uint8)
dilation = cv2.dilate(img, kernel)  # 膨胀
fig = plt.figure()
m1 = plt.imshow(dilation)
m1.set_cmap('gray')
plt.show()

kernel = np.ones((10, 10), np.uint8)
dilation = cv2.dilate(img, kernel)  # 膨胀
fig = plt.figure()
m1 = plt.imshow(dilation)
m1.set_cmap('gray')
plt.show()
```
原图 | 5x5 膨胀| 10x10 膨胀
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/50381148-2ff85b80-06ba-11e9-84a7-9b2b13841edb.png) | ![image](https://user-images.githubusercontent.com/2216970/50381161-5cac7300-06ba-11e9-91d6-ff597e71a2dd.png) | ![image](https://user-images.githubusercontent.com/2216970/50381162-5f0ecd00-06ba-11e9-81bf-f7a520703b2d.png)


## 开运算 & 闭运算
开运算 - 先腐蚀后膨胀（因为先腐蚀会分开物体，这样容易记住），其作用是：分离物体，消除小区域。
闭运算 - 先膨胀后腐蚀（先膨胀会使白色的部分扩张，以至于消除/"闭合"物体里面的小黑洞，所以叫闭运算）
![image](https://user-images.githubusercontent.com/2216970/50381209-f294cd80-06bb-11e9-9513-dde626d07125.png)
```
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))  # 定义结构元素

img = cv2.imread('t.png', 0)
plt.imshow(img, cmap='gray')
plt.show()

opening = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)  # 开运算
fig = plt.figure()
plt.imshow(opening, cmap='gray')
plt.show()


closing = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)  # 闭运算
fig = plt.figure()
plt.imshow(closing, cmap='gray')
plt.show()

```
原图 | 开运算 | 闭运算
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/50381222-89fa2080-06bc-11e9-8fc7-6c65dae993b5.png) | ![image](https://user-images.githubusercontent.com/2216970/50381223-8bc3e400-06bc-11e9-8b8e-625065d4218a.png) | ![image](https://user-images.githubusercontent.com/2216970/50381224-8f576b00-06bc-11e9-9d44-e0d99f53172f.png)

## 形态学梯度/顶帽/黑帽

```
img = cv2.imread('t.png', 0)
plt.imshow(img, cmap='gray')
plt.show()

gradient = cv2.morphologyEx(img, cv2.MORPH_GRADIENT, kernel)
plt.imshow(gradient, cmap='gray')
plt.show()

tophat = cv2.morphologyEx(img, cv2.MORPH_TOPHAT, kernel)
plt.imshow(tophat, cmap='gray')
plt.show()

blackhat = cv2.morphologyEx(img, cv2.MORPH_BLACKHAT, kernel)
plt.imshow(blackhat, cmap='gray')
plt.show()
```

原图 | 形态学梯度 | 顶帽 | 黑帽
-- | -- | -- | --
![image](https://user-images.githubusercontent.com/2216970/50381396-f70fb500-06c0-11e9-86d1-02c7b1ad0292.png) | ![image](https://user-images.githubusercontent.com/2216970/50381397-f840e200-06c0-11e9-8778-2119e09af8f2.png) | ![image](https://user-images.githubusercontent.com/2216970/50381401-1870a100-06c1-11e9-878c-aff085e8af2f.png) | ![image](https://user-images.githubusercontent.com/2216970/50381402-1a3a6480-06c1-11e9-9c23-7084ae6c9f5b.png)


