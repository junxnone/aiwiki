---
Title | LM FT LoKr
-- | --
Created @ | `2025-01-13T09:00:32Z`
Updated @| `2026-10-20T07:24:30Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/493)

---
# LoKr

- 基于 Kronecker 积分解矩阵，可调整参数数量且灵活性高
- 主要应用于扩散模型
- 可以通过堆叠矩阵列来向量化。这可以加快过程来避免完全重建 ΔW

## 原理
- 对于Kronecker积，前向传播 $h' = W_0h + b$ 被修改为：
- $$h' = W_0h + b + \gamma\Delta Wh = W_0h + b + \gamma[C \otimes(BA)]h, \quad$$ 
  - $C \in \mathbb{R}^{u_{p}×u_{q}}$
  - $B \in \mathbb{R}^{v_{p}×r}$
  - $A \in \mathbb{R}^{r×v_{q}}$
$$u_{p}=\max\left(u \leq \min(f, \sqrt{p}) \mid p \bmod u = 0\right),\quad v_{p}=\frac{p}{u_{p}} 。$$ 


![image](https://github.com/user-attachments/assets/ebeafc2d-1828-4faa-b041-5f28aa17404c)

## 和 LoHa 的选择

同属 LyCORIS 项目里"用更灵活的矩阵分解替代纯低秩分解"的思路，LoKr 用 Kronecker 积、[LoHa](0492_LM_FT_LoHa) 用哈达玛积；经验上 LoKr 在单一概念、需要更高多样性的任务上表现更好，LoHa 更适合多概念同时微调的场景。

## 代码示例（Hugging Face PEFT）

```python
from peft import LoKrConfig, get_peft_model

config = LoKrConfig(r=16, alpha=16, target_modules=["to_q", "to_v"], module_dropout=0.1)
model = get_peft_model(unet, config)
```

## Reference
- Yeh, S. et al. (2023). Navigating Text-To-Image Customization: From LyCORIS Fine-Tuning to Model Evaluation. [arXiv:2309.14859](https://arxiv.org/abs/2309.14859)
- Edalati, A. et al. (2022). KronA: Parameter Efficient Tuning with Kronecker Adapter. [arXiv:2212.10650](https://arxiv.org/abs/2212.10650)
- [LyCORIS GitHub](https://github.com/KohakuBlueleaf/LyCORIS)
- [LoKr - Hugging Face PEFT](https://huggingface.co/docs/peft/en/package_reference/lokr)
- [大模型微调总览](0410_LM_FT)

