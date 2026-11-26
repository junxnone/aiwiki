-----

| Title     | OpenCV IP Filter medianBlur                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-09-20T15:22:41Z`                                |
| Updated @ | `2026-11-26T09:13:24Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/442) |

-----

# medianBlur 中值滤波

  - 属于排序滤波，逐个对比窗口中的数字保留中值

对窗口内的所有像素值排序，用中间值替换窗口中心像素：

$$ \\hat{I}(x,y)=\\operatorname{median}{,I(x+i,\\ y+j)\\ \\mid\\
(i,j)\\in W,} $$

其中：

  - $I(x,y)$：输入图像在 $(x,y)$ 处的像素值；$\\hat{I}(x,y)$：滤波后的值
  - $W$：以中心为原点的窗口（大小为 $k\\times k$，$k$ 为奇数）；$(i,j)$：窗口内的偏移
  - $\\operatorname{median}$：取排序后的中间值，窗口内共 $k^2$ 个数（奇数个），中值即第
    $(k^2+1)/2$ 个

<!-- end list -->

``` 
void cv::medianBlur(InputArray  src,
                OutputArray     dst,
                int     ksize 
)   

```

> Ksize 为大于1的奇数: 3/5/7/...

| 参数    | 描述                                                        |
| ----- | --------------------------------------------------------- |
| src   | 输入图像                                                      |
| dst   | 输出图像，与输入尺寸和类型相同                                           |
| ksize | 窗口边长，奇数且大于 1；为 3 或 5 时可处理 8 位、16 位和 32 位浮点图像，更大的窗口只支持 8 位 |

## 特点

  - 对**椒盐噪声**（随机的黑白点）效果特别好：孤立的极端值排序后位于两端，不会被选为中值
  - 能保留边缘：中值是图像中真实存在的值，不像均值那样产生新的中间灰度
  - 不是线性滤波，不能用卷积表示；窗口越大越慢

## 与其他滤波对比

| 滤波                                                                | 类型      | 擅长   | 边缘   |
| ----------------------------------------------------------------- | ------- | ---- | ---- |
| 均值（[blur](https://github.com/junxnone/aiwiki/issues/441)）         | 线性      | 快速平滑 | 模糊   |
| 高斯（[GaussianBlur](https://github.com/junxnone/aiwiki/issues/320)） | 线性      | 高斯噪声 | 较模糊  |
| 中值                                                                | 非线性（排序） | 椒盐噪声 | 较好保留 |

表中：对比结论：噪声是孤立的极端点时优先用中值滤波。

## Reference

  - [opencv源码之中值滤波medianBlur\_SortNet解读](https://blog.csdn.net/u010420283/article/details/128585745)
