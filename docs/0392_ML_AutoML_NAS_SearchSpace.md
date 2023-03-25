---
Title | ML AutoML NAS SearchSpace
-- | --
Created @ | `2020-07-17T06:25:15Z`
Updated @| `2023-03-25T14:50:08Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/392)

---
# Search Space

Search Space  | Description
-- | --
Entire Structure | 完整的网络结构，每层的结构从 search space 中选择，`skip-connection` 可选
Cell-Based  | 先搜索表现好的 `Cell`, 再堆叠 `Cell`
Hierarchical 分层 | 增加 `Cell` 的多样性
Morphism Based | 在深度宽度等可变操作上扩展现有模型

## Entire & Cell

Search Space | Entire-Structured | Cell-Based  
-- | -- | --
Figure | ![image](https://user-images.githubusercontent.com/2216970/87379483-fb613300-c5c2-11ea-9cc5-0b791572b25c.png) | ![image](https://user-images.githubusercontent.com/2216970/87379473-f4d2bb80-c5c2-11ea-83e7-247dab8941af.png)
优缺点 | 耗时 | 特征图的大小和通道数变化固定

## Hierarchical  & Morphism 

Search Space | Hierarchical (Progressive?) | Morphism based 
-- | -- | --
Figure | ![image](https://user-images.githubusercontent.com/2216970/87380169-7d059080-c5c4-11ea-984e-c6d4c0af3b91.png) <br>![image](https://user-images.githubusercontent.com/2216970/87380201-90b0f700-c5c4-11ea-9596-b8d940fec9d9.png) |  ![image](https://user-images.githubusercontent.com/2216970/87380151-74ad5580-c5c4-11ea-9d91-15639df50440.png)

## chain & multi-branch

chain-structured neural networks | multi-branch networks
-- | --
![image](https://user-images.githubusercontent.com/2216970/87760066-cdd5ed00-c841-11ea-8762-fc72fbc23f37.png) | ![image](https://user-images.githubusercontent.com/2216970/87760086-d29aa100-c841-11ea-8563-55b0af272b85.png)

