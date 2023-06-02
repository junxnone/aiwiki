---
Title | paper LoRA
-- | --
Created @ | `2023-06-02T07:07:34Z`
Updated @| `2023-06-02T07:07:34Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/406)

---
# LoRA

- 已有研究表明了过度参数化的模型其实是位于一个低的内在维度上，所以作者假设在模型适应过程中的权重变化也具有较低的“内在等级”
- 冻结一个预训练模型的矩阵参数，并选择用A和B矩阵来替代，在下游任务时只更新A和B。

## Reference

- paper 2021 [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [Code - Microsoft](https://github.com/microsoft/LoRA)
