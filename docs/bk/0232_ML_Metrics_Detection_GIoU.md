-----

| Title         | ML Metrics Detection GIoU                             |
| ------------- | ----------------------------------------------------- |
| Created @     | `2019-12-10T07:47:50Z`                                |
| Last Modify @ | `2022-12-24T12:34:15Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/232) |

-----

## Reference

  - [Github repo](https://github.com/generalized-iou)
  - [官网](https://giou.stanford.edu/)
  - [paper - Generalized Intersection over Union: A Metric and A Loss
    for Bounding Box Regression](https://giou.stanford.edu/GIoU.pdf)

## Brief

  - GIoU - `Generalized Intersection over Union`

## IOU - Jaccard Index

  - 目标检测中用来衡量 Predict 结果和 GT 的距离

<img height="40px" src="https://user-images.githubusercontent.com/2216970/70506275-dad08680-1b64-11ea-9575-25c2d9c404e6.png">

-----

问题 - Q?

  - IoU 无法优化无重叠的 BBox

> 如下图中 2 和 1 的 IOU 都是 0， 但是理论认为 2 比 1 应该有更好的值
> 
> > 蓝绿色为 GT, 另一个 BBox 为 Predict

| 1                                                            | 2                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/fc73a9bc7327b191e383395836da2bb43c397c5e.png) | ![image](media/e5d31fc984f3e6433bfb878988036d035fc3002e.png) |

## GIOU

<img height="40px" src="https://user-images.githubusercontent.com/2216970/70506317-f340a100-1b64-11ea-9a27-7d28b411a01a.png">

-----

区域 `C`

  - 包含 A 和 B 的最小 BBox

| 1                                                            | 2                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/2509dfa874eb50023ef276da07b6e3ffa5e2c10d.png) | ![image](media/8361f670a91049fa44a8d37111a092f71ad60ced.png) |

-----

  - GIOU 取值范围 `[-1, 1]`

![image](media/ff213db1be7da68075a4222a04c302087577137d.png)

## GIOU Loss

<img height="20px" src="https://user-images.githubusercontent.com/2216970/70513472-ab257c80-1b6c-11ea-959f-1c614078729e.png">

-----

计算方法

  - GIOU Loss 范围为 \[0, 2\]

![image](media/ef73762e0d7b0de05f9efec4e18ea1435bfb0dc0.png)
