---
Title | LM FT LoKr
-- | --
Created @ | `2025-01-13T09:00:32Z`
Updated @| `2025-01-24T02:53:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/493)

---
# LoKr

- 基于 Kronecker 积分解矩阵，可调整参数数量且灵活性高



## 原理
- 对于Kronecker积，前向传播 $h' = W_0h + b$ 被修改为：
- $$h' = W_0h + b + \gamma\Delta Wh = W_0h + b + \gamma[C \otimes(BA)]h, \quad$$ 
  - $C \in \mathbb{R}^{u_{p}×u_{q}}$
  - $B \in \mathbb{R}^{v_{p}×r}$
  - $A \in \mathbb{R}^{r×v_{q}}$
$$u_{p}=\max\left(u \leq \min(f, \sqrt{p}) \mid p \bmod u = 0\right),\quad v_{p}=\frac{p}{u_{p}} 。$$ 


![image](https://github.com/user-attachments/assets/ebeafc2d-1828-4faa-b041-5f28aa17404c)


