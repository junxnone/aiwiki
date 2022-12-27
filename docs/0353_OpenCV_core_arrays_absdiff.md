---
Title | OpenCV core arrays absdiff
-- | --
Created @ | `2022-07-04T01:28:29Z`
Last Modify @| `2022-12-27T09:22:06Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/353)

---
## Reference
- [API absdiff()](https://docs.opencv.org/4.6.0/d2/de8/group__core__array.html#ga6fef31bc8c4071cbc114a758a2b79c14)

## Brief
- 多用于移动检测


输入 | 计算公式
-- | --
矩阵&矩阵 | $\texttt{dst}(I) = \texttt{saturate} (\| \texttt{src1}(I) - \texttt{src2}(I)\|)$
矩阵&常量 | $\texttt{dst}(I) = \texttt{saturate} (\| \texttt{src1}(I) - \texttt{src2}(I)\|)$
常量&矩阵 | $\texttt{dst}(I) = \texttt{saturate} (\| \texttt{src1} - \texttt{src2}(I) \|)$


pre_frame | frame | absdiff
-- | -- | --
![frame_085](https://user-images.githubusercontent.com/2216970/177066971-df958ecf-017f-4aed-9c0f-c6c2af155c58.png) | ![frame_086](https://user-images.githubusercontent.com/2216970/177066994-49d6a634-45ed-4471-827d-841cd06c3df2.png) | ![img_diff85](https://user-images.githubusercontent.com/2216970/177066595-aa981bee-352e-4f51-816d-8ab5a71aacc1.png)
![frame_088](https://user-images.githubusercontent.com/2216970/177067477-30b062c9-00ff-46e5-a149-17117d50d231.png) | ![frame_089](https://user-images.githubusercontent.com/2216970/177067494-e63a6b02-7ed2-4517-a7b7-53c8862b60ad.png) | ![img_diff88](https://user-images.githubusercontent.com/2216970/177067535-b1392828-d48b-419e-9209-0ba06582b84d.png)



## UseCase

