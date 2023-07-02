-----

| Title         | OpenCV IP Filter morphology                           |
| ------------- | ----------------------------------------------------- |
| Created @     | `2018-12-20T08:46:04Z`                                |
| Last Modify @ | `2022-12-27T09:16:18Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/344) |

-----

# 膨胀腐蚀

## Reference

  - [Morphology -
    HIPR2](http://homepages.inf.ed.ac.uk/rbf/HIPR2/morops.htm)
  - [Morphological -
    OpenCV](https://opencv.apachecn.org/#/docs/4.0.0/4.5-tutorial_py_morphological_ops)

## Brief

| Name | Description                     | Examples                                                                                                                      |
| ---- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 腐蚀   | 侵蚀前景对象的边界<br>`白色/高值` =\> `黑色/0` | ![image](media/c2059679ab06fad7cb0731ed71c36481fb36d096.png) =\> ![image](media/4c91c3a563a53e4a963850203b5a2199da46dda0.png) |
| 膨胀   | 增加前景对象的边界<br>`黑色/0` =\> `白色/高值` | ![image](media/c2059679ab06fad7cb0731ed71c36481fb36d096.png) =\>![image](media/19a048a081350b15ae39369e693b75840fdae322.png)  |
| 开运算  | 腐蚀后膨胀                           | ![image](media/d4ed045da46e93dee582f9afa72127a9397f35dd.png)                                                                  |
| 闭运算  | 膨胀后腐蚀                           | ![image](media/20aa8e5397859781ceebd849e5d4edd27875f3cc.png)                                                                  |
| 形态梯度 | 膨胀腐蚀差值                          | ![image](media/91d4423ad34fad303da14197653fcbac1292fffd.png)                                                                  |
| 顶帽   | 原图像和开运算的差值                      | ![image](media/ccd42e2eac32e5539cce3fe2360e5ef7b357d51e.png)                                                                  |
| 黑帽   | 原图像和闭运算的差值                      | ![image](media/7e5d4ca8fedd065eeeb702c0398fdfe9e8bc433c.png)                                                                  |

## 腐蚀

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

| 原图                                                           | 5x5 腐蚀                                                       | 10x10 腐蚀                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/334116660509e5e131d0a80385b7878457aad236.png) | ![image](media/2d25863dba2318d8118bdcf07b7afa9af1767593.png) | ![image](media/de9c08cd1bd3492fd56ba57e63ca7dc16067cceb.png) |

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

| 矩形结构腐蚀                                                       | 椭圆结构腐蚀                                                       | 十字结构腐蚀                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/de9c08cd1bd3492fd56ba57e63ca7dc16067cceb.png) | ![image](media/fd7f56f81c9adeda881a9b0012710171e94c37a2.png) | ![image](media/05e20ef0f7ba7ab1060ce89fe3efc1585cb08feb.png) |

## 膨胀

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

| 原图                                                           | 5x5 膨胀                                                       | 10x10 膨胀                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/334116660509e5e131d0a80385b7878457aad236.png) | ![image](media/9e8817d80b978b78d50855f375a3853100536a60.png) | ![image](media/375f3fea93f8c763e5b97426679458b71f0464ef.png) |

## 开运算 & 闭运算

开运算 - 先腐蚀后膨胀（因为先腐蚀会分开物体，这样容易记住），其作用是：分离物体，消除小区域。 闭运算 -
先膨胀后腐蚀（先膨胀会使白色的部分扩张，以至于消除/"闭合"物体里面的小黑洞，所以叫闭运算）
![image](media/ad8248fb70cb3a79aa3f853acb05214abae13d24.png)

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

| 原图                                                           | 开运算                                                          | 闭运算                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/334116660509e5e131d0a80385b7878457aad236.png) | ![image](media/f512fb65e0fb020fe47b7ed25046da7f80416222.png) | ![image](media/6fbbe07cfb332ba2f1cbe43e61225ef0cd684103.png) |

## 形态学梯度/顶帽/黑帽

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

| 原图                                                           | 形态学梯度                                                        | 顶帽                                                           | 黑帽                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/334116660509e5e131d0a80385b7878457aad236.png) | ![image](media/b5b5c1601cc3aa5fc747416ccab96f82930b494e.png) | ![image](media/5e4f647b867279345fac2d821b96538e295d964b.png) | ![image](media/22748e4e9bfbce436a603d83b57a4ca2bbb63d78.png) |
