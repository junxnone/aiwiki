---
Title | CV Feature MoravecCorner
-- | --
Created @ | `2020-11-07T08:12:25Z`
Last Modify @| `2022-12-23T14:40:45Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/66)

---

# Moravec Corner
## Reference
- [手写计算机视觉算法：Moravec角点检测算子](http://zhaoxuhui.top/blog/2019/01/10/MoravecCornerDetection.html)
- 1976 [Automatic Visual Obstacle Avoidance](https://frc.ri.cmu.edu/~hpm/project.archive/robot.papers/1977/aip.txt)
- 1980 [Obstacle Avoidance and Navigation in the Real World by a Seeing Robot Rover](https://www.ri.cmu.edu/pub_files/pub4/moravec_hans_1980_1/moravec_hans_1980_1.pdf)
- [Moravec检测器](https://blog.csdn.net/songzitea/article/details/12846919)
- [Interest Point Detection](http://dept.me.umn.edu/courses/me5286/vision/Notes/2015/ME5286-Lecture8.pdf)
- [Hans Moravec cmu wegpages](https://frc.ri.cmu.edu/~hpm/)
- [图像处理特征不变算子系列之Moravec算子（一）](https://blog.csdn.net/kezunhai/article/details/11176065)


## Brief
- 将角点定义为自相似性较低的点
> defines a corner to be a point with low self-similarity
- 以像素为中心的窗口和八个方向偏移窗口(↑←→↓↖↙↗↘ )的相似度来衡量是否为角点
- **相似度** 
  - 滑窗与原窗口相应 pixel 差的平方和 
  - SSD - the sum of squared differences
  - SSD 越小，相似度越高
- 角点强度
  - Min(SSD1-8)
  - 角点阈值越大，筛选到的角点越少，相似度越小
- 缺点
  - 不具备旋转不变性，对旋转过的图像不鲁棒
  - 噪声敏感
  - 阈值筛选难以选择阈值
  - 不能应用于图像边界区域
  - 窗口像素权重同质


> 有的地方解释为四个方向应该是[某些 examples 举例时只用了4个方向](https://programmer.group/opencv-learning_11-moravec-corner-detection-and-disadvantage.html)



----

## Pipeline
Steps | Description
-- | --
1 | 对图片中每个像素(x, y) 计算相似度-SSD
2 | 取最小 SSD 作为角点强度构建角点映射图
3 | 使用阈值 `T` 筛除强度较小的角点
4 |  NMS 找出局部最大值作为角点

---

八个滑动窗口计算相似度 | 
-- | 
![image](https://user-images.githubusercontent.com/2216970/98492378-9f59a300-2272-11eb-9e51-494bd3864e05.png) |
<img src="https://user-images.githubusercontent.com/2216970/98492385-a2549380-2272-11eb-9e32-12e338b5c1ec.png" alt="alt text" width="60%" height="50%"> |


角点映射图 | 阈值筛选 | NMS
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/99026741-a2240300-25a6-11eb-923c-642fe83d40b2.png) | ![image](https://user-images.githubusercontent.com/2216970/99026745-a7814d80-25a6-11eb-935a-23289a125a93.png) | ![image](https://user-images.githubusercontent.com/2216970/99026773-b962f080-25a6-11eb-932d-4963f1d698f8.png)


> CRF - Corner Response Function




