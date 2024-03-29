---
Title | ML Arch LR
-- | --
Created @ | `2019-12-05T09:03:55Z`
Updated @| `2023-02-02T08:54:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/265)

---

# Learning Rate 学习率
## Reference

- [网络学习率变化策略](https://www.jianshu.com/p/67232264ffbd)
- [如何选择最适合你的学习率变更策略](https://www.jianshu.com/p/1f943de39582)

## Brief

- [Cyclical Learning Rate](/Cyclical_Learning_Rate)
- [One Cycle Policy](/One_Cycle_Policy)
- [LRFinder](/LRFinder)

## Learning Rate Policy

LR Policy Name | Formula | Figure | Description
-- | -- | -- | -- 
step | `new_lr = base_lr * gamma ^ iter` | ![image](https://user-images.githubusercontent.com/2216970/70220441-90749180-1781-11ea-9a1a-2f58120dd4d5.png)
multistep | `` | ![image](https://user-images.githubusercontent.com/2216970/70220602-cf0a4c00-1781-11ea-85f4-b9a8f1699f33.png) | 采用非均匀降低策略，指定降低的step间隔，每次降低为原来的一定倍数
fixed | `new_lr = base_lr` | ![image](https://user-images.githubusercontent.com/2216970/70220427-8b174700-1781-11ea-8f06-5b441b0c9e52.png)
exp | `` | ![image](https://user-images.githubusercontent.com/2216970/70220808-25778a80-1782-11ea-8b57-9acb198223bc.png) | 
inv | `new_lr = base_lr * ( 1 +gamma * iter ) ^ (-power)` |  ![image](https://user-images.githubusercontent.com/2216970/70220960-61aaeb00-1782-11ea-8a17-8d592dfe95e8.png)
poly | `new_lr = base_lr * ( 1 - iter / max_iter ) ^ power` | ![image](https://user-images.githubusercontent.com/2216970/70220822-2c060200-1782-11ea-98c3-3c1a48b5be75.png)
signoid | `new_lr = base_lr * ( 1 / ( 1 +exp(-gamma * ( iter - stepsize))))` | ![image](https://user-images.githubusercontent.com/2216970/70220829-2f00f280-1782-11ea-9ab0-25ec90677046.png)


