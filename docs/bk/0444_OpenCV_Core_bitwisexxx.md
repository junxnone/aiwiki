-----

| Title     | OpenCV Core bitwisexxx                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-09-20T15:27:25Z`                                |
| Updated @ | `2023-09-20T15:51:12Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/444) |

-----

# bitwise\_xxx

## 按位与 bitwise\_and

``` 
void cv::bitwise_and(InputArray     src1,
                InputArray  src2,
                OutputArray     dst,
                InputArray  mask = noArray() 
)   
```

  - **mask**:
  - 可以是图像和图像，也可以是图像和标量
  - 如果是多通道，每个通道单独处理

| 图像与图像     | $\\texttt{dst} (I) = \\texttt{src1} (I) \\wedge \\texttt{src2} (I) \\quad \\texttt{if mask} (I) \\ne0$ |
| --------- | ------------------------------------------------------------------------------------------------------ |
| **图像与标量** | $\\texttt{dst} (I) = \\texttt{src1} (I) \\wedge \\texttt{src2} \\quad \\texttt{if mask} (I) \\ne0$     |

## Reference

  - [API](https://docs.opencv.org/4.x/d2/de8/group__core__array.html#ga60b4d04b251ba5eb1392c34425497e14)
