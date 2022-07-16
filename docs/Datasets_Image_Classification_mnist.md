---
Title | Datasets Image Classification mnist
-- | --
Created @ | `2019-01-18T18:36:57Z`
Last Modify @| `2022-07-16T09:22:24Z`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/30)

---
## Reference
- [mnist dataset](http://yann.lecun.com/exdb/mnist/)

## Brief 

MNIST 数据集来自美国国家标准与技术研究所, National Institute of Standards and Technology (NIST). 训练集 (training set) 由来自 250 个不同人手写的数字构成, 其中 50% 是高中学生, 50% 来自人口普查局 (the Census Bureau) 的工作人员. 测试集(test set) 也是同样比例的手写数字数据.


<img width="300px" src="https://user-images.githubusercontent.com/2216970/51413058-95037c00-1ba8-11e9-9153-c5f0764f8e42.png">
<img width="300px" src="https://user-images.githubusercontent.com/2216970/179348954-f84fb28d-8784-4421-8e3a-f87481fdd1db.png">


## Download

Datasets | Description | Images
-- | -- | --
[train-images-idx3-ubyte.gz](https://github.com/junxnone/junxnone.github.io/files/2774597/train-images-idx3-ubyte.gz) | Training images (9.9 MB, 解压后 47 MB) | 60000
[train-labels-idx1-ubyte.gz](https://github.com/junxnone/junxnone.github.io/files/2774598/train-labels-idx1-ubyte.gz) | Training labels(29 KB, 解压后 60 KB) |  60000
[train-images-idx3-ubyte.gz](https://github.com/junxnone/junxnone.github.io/files/2774599/train-images-idx3-ubyte.gz) | Test images (1.6 MB, 解压后 7.8 MB) | 10000
[t10k-labels-idx1-ubyte.gz](https://github.com/junxnone/junxnone.github.io/files/2774601/t10k-labels-idx1-ubyte.gz) | Test labels(5KB, 解压后 10 KB) | 10000

## Format

- 图像数据保存在二进制文件中
- 图像的宽高为28*28
- MSB First.

TRAINING SET LABEL FILE (train-labels-idx1-ubyte):
```
[offset] [type]          [value]          [description] 
0000     32 bit integer  0x00000801(2049) magic number (MSB first) 
0004     32 bit integer  60000            number of items 
0008     unsigned byte   ??               label 
0009     unsigned byte   ??               label 
........ 
xxxx     unsigned byte   ??               label
The labels values are 0 to 9.
```
TRAINING SET IMAGE FILE (train-images-idx3-ubyte):
```
[offset] [type]          [value]          [description] 
0000     32 bit integer  0x00000803(2051) magic number 
0004     32 bit integer  60000            number of images 
0008     32 bit integer  28               number of rows 
0012     32 bit integer  28               number of columns 
0016     unsigned byte   ??               pixel 
0017     unsigned byte   ??               pixel 
........ 
xxxx     unsigned byte   ??               pixel
```
