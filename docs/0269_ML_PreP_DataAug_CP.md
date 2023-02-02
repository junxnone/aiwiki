---
Title | ML PreP DataAug CP
-- | --
Created @ | `2019-12-09T10:17:07Z`
Updated @| `2023-02-02T09:14:56Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/269)

---
# Copy-Pasting
## Reference
- [paper - Augmentation for small object detection](https://arxiv.org/pdf/1902.07296.pdf)
- [增强小目标检测（Augmentation for small object detection）](https://blog.csdn.net/u011344545/article/details/91355839)

## Brief
- 小物体平均精度差
  - 训练数据中缺少小物体的表示

## 方法
- Oversampling（过采样）- 直接复制图片？
- Augmentation（增强）
  - Copy-pasting - 从其原始位置复制对象, 然后将副本粘贴到不同的位置

---

![image](https://user-images.githubusercontent.com/2216970/70428354-67217180-1ab1-11ea-8e7d-3783db3eaf7d.png)

## Test Results

### Oversampling
![image](https://user-images.githubusercontent.com/2216970/70428705-10686780-1ab2-11ea-8df1-312d386c2d9a.png)
![image](https://user-images.githubusercontent.com/2216970/70428733-2413ce00-1ab2-11ea-881e-16b65ccc9909.png)

### Copy-pasting of Single Object
![image](https://user-images.githubusercontent.com/2216970/70429064-d21f7800-1ab2-11ea-9f1b-0c95cfb9ad2b.png)

### Copy-pasting of Multiple Objects
![image](https://user-images.githubusercontent.com/2216970/70429303-435f2b00-1ab3-11ea-9a0f-54717e6af387.png)

