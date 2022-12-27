---
Title | OpenCV IP Filter boxFilter
-- | --
Created @ | `2022-11-29T03:17:35Z`
Last Modify @| `2022-12-27T09:05:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/319)

---

## 原理

- 类似卷积过程

![原理](https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/same_padding_no_strides.gif)

## Kernel

$\texttt{K} = \alpha \begin{bmatrix} 1 & 1 & 1 & \cdots & 1 & 1 \\ 1 & 1 & 1 & \cdots & 1 & 1 \\ \vdots \\ 1 & 1 & 1 & \cdots & 1 & 1 \end{bmatrix}$

$\alpha = \begin{cases} \frac{1}{\texttt{ksize.width*ksize.height}} & \texttt{when } \texttt{normalize=true} \\1 & \texttt{otherwise}\end{cases}$
 
 
3x3 Kernel  | 5x5 Kernel | 7x7 Kernel
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/204438619-ca2cc5ad-838a-4c42-b1de-c2906a20d522.png) | ![image](https://user-images.githubusercontent.com/2216970/204438776-0460e846-f79e-4778-8b30-a0d2763e11bc.png) | ![image](https://user-images.githubusercontent.com/2216970/204438854-4168b0a0-4668-4a53-aabc-faf42a78170c.png)

org image | 3x3 boxFilter |  5x5 boxFilter | 7x7 boxFilter
-- | -- | -- | --
![download](https://user-images.githubusercontent.com/2216970/204441680-af4e4cc4-36d4-4cd4-be87-1eeee32cae99.png) | ![image](https://user-images.githubusercontent.com/2216970/204446076-12449942-9fca-4eb5-b754-de486a637e1c.png) | ![image](https://user-images.githubusercontent.com/2216970/204446302-3f27549b-598b-4d9d-8c90-a9382747884f.png) | ![image](https://user-images.githubusercontent.com/2216970/204446469-5ca50469-3b1d-4629-960e-8eb63301a671.png)


## OpenCV API


```COOL
void cv::boxFilter(InputArray 	src,
                OutputArray 	dst,
                int 	ddepth,
                Size 	ksize,
                Point 	anchor = Point(-1,-1),
                bool 	normalize = true,
                int 	borderType = BORDER_DEFAULT 
                )		
```
- normalize: 是否归一化 - 把要处理的值缩放到某个尺度, 例如(0,1) - 均值滤波





