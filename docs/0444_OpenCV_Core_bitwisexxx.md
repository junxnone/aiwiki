---
Title | OpenCV Core bitwisexxx
-- | --
Created @ | `2023-09-20T15:27:25Z`
Updated @| `2026-11-26T10:07:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/444)

---
# bitwise_xxx

逐位的逻辑运算：对两幅图像（或图像与标量）的每个像素值按二进制位做与、或、异或、取反。常用于**掩码**操作：保留或去掉图像的某个区域。

## 按位与 bitwise_and

```
void cv::bitwise_and(InputArray 	src1,
                InputArray 	src2,
                OutputArray 	dst,
                InputArray 	mask = noArray() 
)	
```

- **mask**: 
- 可以是图像和图像，也可以是图像和标量
- 如果是多通道，每个通道单独处理

图像与图像 | $\texttt{dst} (I) = \texttt{src1} (I) \wedge \texttt{src2} (I) \quad \texttt{if mask} (I) \ne0$
-- | --
**图像与标量** | $\texttt{dst} (I) = \texttt{src1} (I) \wedge \texttt{src2} \quad \texttt{if mask} (I) \ne0$

其中：

- $I$：像素位置；$\texttt{src1},\texttt{src2}$：两个输入；$\wedge$：按位与
- $\texttt{mask}(I)\ne0$：只有掩码对应位置非零的像素才被计算，其余位置保持 `dst` 原值
- `mask` 为可选参数，必须是 8 位单通道

## 常见运算

| 函数 | 运算 | 典型用途 |
| --- | --- | --- |
| `bitwise_and` | 按位与 | 用掩码提取感兴趣区域（ROI） |
| `bitwise_or` | 按位或 | 合并两幅图的内容 |
| `bitwise_xor` | 按位异或 | 找出两幅图不同的部分 |
| `bitwise_not` | 按位取反 | 反色，掩码反转 |

表中：对比结论：与（保留）、或（合并）、异或（差异）、非（反转）。

```python
import cv2
mask = cv2.inRange(hsv, lower, upper)            # 得到 0/255 的掩码
result = cv2.bitwise_and(img, img, mask=mask)    # 只保留掩码为 255 的区域
```

其中：把图像与自己做按位与并给出 `mask`，效果等同于「用掩码把图像抠出来」，因为 $x\wedge x=x$，被 mask 屏蔽处为 0。

## Reference
- [API](https://docs.opencv.org/4.x/d2/de8/group__core__array.html#ga60b4d04b251ba5eb1392c34425497e14)

