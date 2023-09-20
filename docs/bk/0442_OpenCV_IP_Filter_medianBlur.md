-----

| Title     | OpenCV IP Filter medianBlur                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-09-20T15:22:41Z`                                |
| Updated @ | `2023-09-20T15:22:41Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/442) |

-----

# medianBlur 中值滤波

  - 属于排序滤波，逐个对比窗口中的数字保留中值

<!-- end list -->

``` 
void cv::medianBlur(InputArray  src,
                OutputArray     dst,
                int     ksize 
)   

```

> Ksize 为大于1的奇数: 3/5/7/...

## Reference

  - [opencv源码之中值滤波medianBlur\_SortNet解读](https://blog.csdn.net/u010420283/article/details/128585745)
