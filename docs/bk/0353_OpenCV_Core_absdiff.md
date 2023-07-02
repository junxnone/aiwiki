-----

| Title     | OpenCV Core absdiff                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2022-07-04T01:28:29Z`                                |
| Updated @ | `2023-06-17T15:42:32Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/353) |

-----

# absdiff 检测物体运动

  - 多用于移动检测

| 输入    | 计算公式                                                                               |
| ----- | ---------------------------------------------------------------------------------- |
| 矩阵&矩阵 | $\\texttt{dst}(I) = \\texttt{saturate} (| \\texttt{src1}(I) - \\texttt{src2}(I)|)$ |
| 矩阵&常量 | $\\texttt{dst}(I) = \\texttt{saturate} (| \\texttt{src1}(I) - \\texttt{src2}(I)|)$ |
| 常量&矩阵 | $\\texttt{dst}(I) = \\texttt{saturate} (| \\texttt{src1} - \\texttt{src2}(I) |)$   |

| pre\_frame                                                        | frame                                                             | absdiff                                                            |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| ![frame\_085](media/970a7d9f4847f14ff4332d9faee764b9d8159a5d.png) | ![frame\_086](media/e9078bb6d0b5b8f10a50c0eaa142d3cca53c991d.png) | ![img\_diff85](media/c2650cf47c0e918137755e0db6a2f814e1d994cb.png) |
| ![frame\_088](media/973e5899bfe73be834f5967c3377eadceb0ce076.png) | ![frame\_089](media/fec05447347a7f56da60f7aaee7388344f4dcb12.png) | ![img\_diff88](media/1dfa0e67c9a054c455221496bdc02a970abe0207.png) |

## UseCase

## Reference

  - [API
    absdiff()](https://docs.opencv.org/4.6.0/d2/de8/group__core__array.html#ga6fef31bc8c4071cbc114a758a2b79c14)
