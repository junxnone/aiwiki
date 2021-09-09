---
Title | Bayesian Optimization
-- | --
Create Date | `2021-09-09T02:22:17Z`
Update Date | `2021-09-09T02:38:16Z`
---

# Brief
- Bayesian Optimization - 贝叶斯优化
- 用于非凸函数(不可求导)优化
- 不适用于高维空间
- 基于随机性和概率分布


![image](https://user-images.githubusercontent.com/2216970/111953074-16f0e600-8b21-11eb-80e5-412e41960269.png) | 
-- | 
**X = x1, x2, x3...xn** - 超参数
**f(x)**  - 黑盒函数
**Acquisition Function**: 查询函数 选择 超参数
`argmin` - loss / `argmax` accuracy...

