-----

| Title         | OpenCV IP Filter bilateralFilter                      |
| ------------- | ----------------------------------------------------- |
| Created @     | `2022-11-28T06:40:30Z`                                |
| Last Modify @ | `2022-12-27T09:07:10Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/317) |

-----

## Reference

  - [Bilateral Filtering for Gray and Color
    Images](https://homepages.inf.ed.ac.uk/rbf/CVonline/LOCAL_COPIES/MANDUCHI1/Bilateral_Filtering.html)
    \[[paper](https://users.soe.ucsc.edu/~manduchi/Papers/ICCV98.pdf)\]
  - [Bilateral Filtering: Theory and
    Applications](https://people.csail.mit.edu/sparis/publi/2009/fntcgv/Paris_09_Bilateral_filtering.pdf)

## Brief

  - 普通滤波器导致图像边缘处也被模糊, 因此诞生了 双边滤波

![image](media/8de212fcd43f13c2184c939d0ea6cb1ab6e65afd.png)

### OpenCV API

``` 
void cv::bilateralFilter(InputArray     src,
                        OutputArray     dst,
                        int     d,
                        double  sigmaColor,
                        double  sigmaSpace,
                        int     borderType = BORDER_DEFAULT 
                        )   
```

  - **d**: 过滤直径, 比较大时(\>5) 会处理比较慢
  - **sigma** 比较小时(\<10), 影响较小, 比较大时(\>150), 卡通化
      - **sigmaColor**: 颜色空间过滤参数
      - **sigmaSpace** 坐标空间过滤参数, 值越大, 影响像素越远