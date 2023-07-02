-----

| Title         | CV StructureTensor                                   |
| ------------- | ---------------------------------------------------- |
| Created @     | `2020-11-08T06:53:20Z`                               |
| Last Modify @ | `2022-12-23T14:45:43Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/70) |

-----

# Structure Tensor 结构张量

## Reference

  - [Structure tensor -
    wikipedia](https://en.wikipedia.org/wiki/Structure_tensor)
  - [结构张量structure
    tensor](https://blog.csdn.net/u011596455/article/details/71809311)

## Brief

  - 区分图像的`平坦区域/边缘区域/角点区域`
  - 矩阵

| ![image](media/5e8858cc40f645d95ad2684abe9f7731b3cac995.png) | Ix - x 方向的梯度<br>Iy - y 方向的梯度              |
| ------------------------------------------------------------ | ----------------------------------------- |
| 矩阵 E 的 迹<br>H = trace(E)                                     | `H =0` 为平坦区域                              |
| 矩阵 E 的 行列式<br>K = det(E)                                     | `K=0 & H > 0` 为边缘区域<br> `H>0 & K>0` 为角点区域 |

| 原图                                                           | 平坦区域                                                         | 边缘区域                                                         | 角点                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/8944bce7f3f9161ad9cc0fefe62d3c7497789b77.png) | ![image](media/97c9a09266294ae2620307d1590e78fb5af8b86c.png) | ![image](media/8403dbede99704297afbe426c8eacbc7f76db113.png) | ![image](media/6e7c170acecc5541202cfc17b1ef5ff27e4e52e6.png) |

## Others

| 矩阵的行列式          | ![image](media/dcf232ea2906c51f1111f359249fb56a62fae9f3.png)              |
| --------------- | ------------------------------------------------------------------------- |
| **矩阵的迹(trace)** | 对角线元素的总和 <br>![image](media/e7b145b61c6427cb74c12bb4135673388f635176.png) |
