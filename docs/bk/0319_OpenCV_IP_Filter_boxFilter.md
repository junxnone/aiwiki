-----

| Title         | OpenCV IP Filter boxFilter                            |
| ------------- | ----------------------------------------------------- |
| Created @     | `2022-11-29T03:17:35Z`                                |
| Last Modify @ | `2022-12-27T09:05:49Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/319) |

-----

## 原理

  - 类似卷积过程

![原理](media/d372dfbd801c83213bd137655da896e28eb7b5b3.gif)

## Kernel

$\\texttt{K} = \\alpha \\begin{bmatrix} 1 & 1 & 1 & \\cdots & 1 & 1 \\ 1
& 1 & 1 & \\cdots & 1 & 1 \\ \\vdots \\ 1 & 1 & 1 & \\cdots & 1 & 1
\\end{bmatrix}$

$\\alpha = \\begin{cases} \\frac{1}{\\texttt{ksize.width\*ksize.height}}
& \\texttt{when } \\texttt{normalize=true} \\1 &
\\texttt{otherwise}\\end{cases}$

| 3x3 Kernel                                                   | 5x5 Kernel                                                   | 7x7 Kernel                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/d479edd920e6e24f8aa548455e6aa311b22a7abd.png) | ![image](media/2302413676b14734eb6aa71ac06de57831bcfaeb.png) | ![image](media/6e93f9b17f5c1489352227183ae5fff72335d68b.png) |

| org image                                                       | 3x3 boxFilter                                                | 5x5 boxFilter                                                | 7x7 boxFilter                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![download](media/1f156d351cec8e7b780721f4d73d14b5897df087.png) | ![image](media/2a34dad449959d7322a13cd0b955dae612ce3c40.png) | ![image](media/34e28c5ddc1b081865ef9afb32c0531fb48c474b.png) | ![image](media/b45fee745822bed506c445c4b052a06a619a658c.png) |

## OpenCV API

``` COOL
void cv::boxFilter(InputArray   src,
                OutputArray     dst,
                int     ddepth,
                Size    ksize,
                Point   anchor = Point(-1,-1),
                bool    normalize = true,
                int     borderType = BORDER_DEFAULT 
                )       
```

  - normalize: 是否归一化 - 把要处理的值缩放到某个尺度, 例如(0,1) - 均值滤波
