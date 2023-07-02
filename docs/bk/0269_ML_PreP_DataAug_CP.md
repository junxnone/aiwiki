-----

| Title     | ML PreP DataAug CP                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-12-09T10:17:07Z`                                |
| Updated @ | `2023-02-02T09:14:56Z`                                |
| Labels    | `index`                                               |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/269) |

-----

# Copy-Pasting

## Reference

  - [paper - Augmentation for small object
    detection](https://arxiv.org/pdf/1902.07296.pdf)
  - [增强小目标检测（Augmentation for small object
    detection）](https://blog.csdn.net/u011344545/article/details/91355839)

## Brief

  - 小物体平均精度差
      - 训练数据中缺少小物体的表示

## 方法

  - Oversampling（过采样）- 直接复制图片？
  - Augmentation（增强）
      - Copy-pasting - 从其原始位置复制对象, 然后将副本粘贴到不同的位置

-----

![image](media/7b1f3800f6a6325af6d7353962ff611614581787.png)

## Test Results

### Oversampling

![image](media/819e3963a680bc695c7782f5892572704e861369.png)
![image](media/554c1c75e0af85a2085a4b7c2138e633db7682ea.png)

### Copy-pasting of Single Object

![image](media/45d5247b254c0411a1874fbc5925fc4c97876803.png)

### Copy-pasting of Multiple Objects

![image](media/5bd1c1396bdee739e45a4f7bf677a32e2860d0df.png)
