---
Title | ML Tasks Image Classification Inception V2V3
-- | --
Created @ | `2019-12-04T09:37:22Z`
Last Modify @| `2022-12-24T12:39:17Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/46)

---

# Reference
- 2015 **Inception V2 & V3** Rethinking the Inception Architecture for Computer Vision [[paper](https://arxiv.org/pdf/1512.00567.pdf)]
- [Inception结构](https://baike.baidu.com/item/Inception%E7%BB%93%E6%9E%84/22761220?fr=aladdin)
- [一文概览Inception家族的「奋斗史」](https://www.chainnews.com/articles/727946354364.htm)
- [深入浅出——网络模型中Inception的作用与结构全解析](https://blog.csdn.net/u010402786/article/details/52433324)
- [图像分类丨Inception家族进化史「GoogleNet、Inception、Xception」](https://www.cnblogs.com/vincent1997/p/10920036.html)


# Brief
- Inception V2 和 V3 是同一篇 paper 提出，各种 Improve 最终版的 V2 即 V3
- Inception Module 设计准则
  - 避免大kernel 导致的表达瓶颈
  - 高维特征更易处理
  - 低维空间聚合无需担心丢失信息
  - 平衡网络宽度和深度
- **使用了Batch Normalization**
- **分解卷积 - Factorizing Convolutions**
  - 使用包括 2 个 3x3 的 卷积 Mini-network 替换 5x5 的卷积
  - 任意nxn的卷积都可以通过1xn卷积后接nx1 非对称卷积来替代
- RMSProp优化器
- 使用了Label Smoothing



## Factorizing Convolutions - Mini-network
- 2个 3x3 的 卷积替换 5x5 的卷积

![image](https://user-images.githubusercontent.com/2216970/70124424-be89a100-16af-11ea-8b2a-8c2204870e13.png)

- 任意nxn的卷积都可以通过1xn卷积后接nx1 非对称卷积来替代

![image](https://user-images.githubusercontent.com/2216970/70124469-d06b4400-16af-11ea-9279-209907d7c7ad.png)

Original<br>Inception<br>module | ![image](https://user-images.githubusercontent.com/2216970/70124542-fbee2e80-16af-11ea-9985-60d0457157c8.png)
-- | --
 Mini-network  | ![image](https://user-images.githubusercontent.com/2216970/70124560-07415a00-16b0-11ea-9c12-443d51975765.png)
Mini-network<br>1xn/nx1 | ![image](https://user-images.githubusercontent.com/2216970/70125459-c34f5480-16b1-11ea-8db8-80145a899531.png)
-- | ![image](https://user-images.githubusercontent.com/2216970/70127053-3f976700-16b5-11ea-9971-c60a20e0d0dc.png)


## 减小特征图大小的方法
- 先 Pooling 会导致特征表示遇到瓶颈（特征缺失）
- 后 Pooling 会导致计算量很大
--- 
![image](https://user-images.githubusercontent.com/2216970/70126330-c64b4480-16b3-11ea-9216-d0e5953bfdd9.png)

---
**解决方案**
- 使用并行化的 module 来降低减小特征图大小，并降低计算量

![image](https://user-images.githubusercontent.com/2216970/70126353-cf3c1600-16b3-11ea-9213-584d40899ea3.png)

## Label smoothing

- softmax loss过于注重使模型学习分类出正确的类别, 当在新数据集扩展时, 容易过拟合, 可以使用label的先验分布信息对其loss进行校正

## 网络结构图

![image](https://user-images.githubusercontent.com/2216970/70126736-951f4400-16b4-11ea-9cc9-ade1b253830e.png)

## 测试结果

![image](https://user-images.githubusercontent.com/2216970/70128624-293eda80-16b8-11ea-955f-09e9f4413115.png)
> BN-auxiliary:在辅助层的全连接层后面也进行BN操作, 此model被命名为 `Inception V3`

