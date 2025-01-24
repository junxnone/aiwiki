---
Title | LM FT LoHa
-- | --
Created @ | `2025-01-13T08:40:09Z`
Updated @| `2025-01-24T02:53:10Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/492)

---
# LoHa

- 利用哈达玛积（逐元素相乘）来构建低秩近似。这种表示方式在某些情况下可以更有效地捕捉数据中的复杂结构。
- 在处理具有高度结构化数据（如图像、音频）的模型中，LoHa 能够利用哈达玛积的特性，更好地表示数据中的局部相关性和模式，相比 LoRA 可能用更少的参数达到相同或更好的性能。
- 通过其独特的参数化结构，在某些任务中可能会加速模型的收敛。
- 对数据的局部结构和细节有更强的捕捉能力。在图像领域，对于图像的纹理、边缘等细节信息的学习和表示可能会更有效；在自然语言处理领域，对于具有特殊语义结构的文本部分，LoHa 也可能通过更好地利用数据元素之间的相关性来提升模型的理解能力，从而在这些对细节和结构敏感的应用场景中有更好的表现。

## 原理
- FedPara（Hyeon - Woo等人，2022）是一种最初为联邦学习开发的技术，旨在在将低秩分解方法应用于联邦学习时减轻低秩约束。FedPara的优点之一是，所得矩阵的最大秩大于传统低秩分解（如LoRA）得到的矩阵的最大秩。
- 对于 $\Delta W=(B_{1} A_{1}) \odot(B_{2} A_{2})$ 
  - 其中 $\odot$ 表示哈达玛积（按元素相乘）
  - $B_{1}$ $B_{2} \in \mathbb{R}^{p ×r}$ 
  - $A_{1}$ $A_{2} \in \mathbb{R}^{r ×q}$ 
  - $r ≤\min (p, q)$ , $\Delta W$ 的秩可以高达 $r^{2}$ 。
- $h'=W_{0}h + b + \gamma\Delta Wh = W_{0}h + b + \gamma\left[\left(B_{1}A_{1}\right) \odot\left(B_{2}A_{2}\right)\right]h$ 


![image](https://github.com/user-attachments/assets/51bc7d11-05a2-46c1-be7e-a121fbcbd69f)


## Reference
- [FedPara: Low-Rank Hadamard Product for Communication-Efficient Federated Learning](https://arxiv.org/pdf/2108.06098)
