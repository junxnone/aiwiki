---
Title | Media Image Camera 定拍飞拍
-- | --
Created @ | `2021-04-26T08:23:35Z`
Updated @| `2026-11-26T10:24:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/38)

---
# 定拍 vs 飞拍

视觉检测中，相机拍照时运动轴是**停下**还是**不停**，对应两种模式：定拍和飞拍。两者在节拍和精度之间取舍。


模式 | Description | 优缺点
-- | -- | --
**定拍** | 轴运动到拍照位停下来相机拍照处理，然后把结果反馈给执行机构 | 有延时, 某些环境对延时要求高，不适合该模式<br>精度高
**飞拍** | 轴运动到拍照位时运动不停完成拍照处理以及结果反馈 | 不需要停滞<br>精度比 定拍稍低


![image](https://user-images.githubusercontent.com/2216970/116190767-cbec7300-a75d-11eb-9cc4-808de009dbcc.png) | ![image](https://user-images.githubusercontent.com/2216970/116190743-c3943800-a75d-11eb-99ac-2aec1744275e.png)
-- | --
![2aVVQJ7rAl](https://user-images.githubusercontent.com/2216970/116192822-f7249180-a760-11eb-8233-dd157efff93d.gif) | ![H2SIgUeURP](https://user-images.githubusercontent.com/2216970/116193012-45399500-a761-11eb-8050-0e6a22b37554.gif)



![image](https://user-images.githubusercontent.com/2216970/116192172-0e16b400-a760-11eb-998e-9f81eb8f1b2b.png)


## 应用场景
- 位置校正
- 丝印检测
- 缺陷检测
- 错/漏检测
- 堵孔检测
- 尺寸检测
- 标签检测

### 1 位置校正

![image](https://user-images.githubusercontent.com/2216970/116190918-0524e300-a75e-11eb-858e-a972ee5becd7.png)
![image](https://user-images.githubusercontent.com/2216970/116191034-37364500-a75e-11eb-925e-69fdef3a42c5.png)


## 节拍对比

$$
T_{\text{定拍}}=T_{move}+T_{stop}+T_{capture}+T_{process},\qquad T_{\text{飞拍}}=T_{move}+T_{process}'
$$

其中：

- $T_{move}$：轴运动到拍照位的时间；$T_{stop}$：停稳等待的时间；$T_{capture}$：拍照曝光时间
- $T_{process}$：图像处理和结果反馈的时间；$T_{process}'$：飞拍中与运动重叠的处理时间（部分被运动掩盖）
- 飞拍省去停稳（$T_{stop}$）和部分拍照时间，节拍更短；代价是运动中拍照有拖影风险，需要短曝光和闪光灯，因此精度略低

| 对比项 | 定拍 | 飞拍 |
| --- | --- | --- |
| 是否停止 | 停 | 不停 |
| 节拍 | 较慢 | 较快 |
| 精度 | 高 | 略低 |
| 对光源要求 | 一般 | 高（短曝光、频闪） |

表中：对比结论：精度优先选定拍，效率优先选飞拍；延迟概念见 [低延迟](https://github.com/junxnone/aiwiki/issues/37)。

## Reference
- [CCD视觉飞拍技术](http://www.julivision.com/news/436.html)


