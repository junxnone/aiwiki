---
Title | OpenCV IO Mat
-- | --
Created @ | `2024-08-27T08:01:25Z`
Updated @| `2024-08-27T08:01:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/473)

---
# OpenCV Mat

## elemSize
- 元素大小
- 元素指 CV_8UC1/CV_8UC3/CV_32FC1/...
- `elemSize1` : elemSize 一个通道 size

TYPE | elemSize | elemSize1
-- | -- | --
CV_8UC1 | 1 | 1
CV_8UC3 | 3 | 1
CV_16UC1 | 2 | 2
CV_16UC3 | 6 | 2
CV_32FC1 | 4 | 4
CV_32FC4 | 16 | 4
`...` | `...` | `...`


## step(stride)
- 存储着各个维度占用的内存块的大小
- step[0] = cols * elemSize
- step[1] = elemSize
- **step1**: 以 elemSize1 为单位



## `.at`

- 访问元素
- `img.at(y, x)`

## `.ptr`

- 访问矩阵某行, 返回指向矩阵某行开始的地址
- `img->ptr(n)`


## Reference
- [OpenCV:Mat中的step、elemSize和任意内存访问](https://zhuanlan.zhihu.com/p/507103729)
