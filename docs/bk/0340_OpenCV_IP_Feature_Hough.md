-----

| Title     | OpenCV IP Feature Hough                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-11-06T06:00:25Z`                                |
| Updated @ | `2023-06-17T16:47:40Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/340) |

-----

# Hough Line Circle 霍夫线圆

## OpenCV Hough Line

| Function         | Description              | 变换方法                                                                                    |
| ---------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| cv.HoughLines()  | O(n*n*m) 耗时长<br>无法检测直线端点 | SHT - Standard Hough Transform - 标准霍夫变换<br>MSHT - Multi-Scale Hough Transform - 多尺度霍夫变换 |
| cv.HoughLinesP() | 效率更高 <br>可以检测端点          | PPHT - Progressive Probabilistic Hough Transform - 累计概率霍夫变换                             |

![image](media/6f5c0ccf52143dda0fcacc460308b356630805c8.png)

## OpenCV Hough Circle

  - cv.HoughCircles()

![image](media/e5ce03f058a461c079a91c81cba60b7047684854.png)

| Modes                | Description |
| -------------------- | ----------- |
| HOUGH\_STANDARD      |             |
| HOUGH\_PROBABILISTIC |             |
| HOUGH\_MULTI\_SCALE  |             |
| HOUGH\_GRADIENT      |             |

## Reference

  - [霍夫变换](https://www.cnblogs.com/php-rearch/p/6760683.html)
  - [Hough Transform](http://homepages.inf.ed.ac.uk/rbf/HIPR2/hough.htm)
  - [【OpenCV入门教程之十四】OpenCV霍夫变换：霍夫线变换，霍夫圆变换合辑](https://blog.csdn.net/poem_qianmo/article/details/26977557/)
  - [使用opencv识别同心圆](https://blog.csdn.net/u011853479/article/details/50405793)
