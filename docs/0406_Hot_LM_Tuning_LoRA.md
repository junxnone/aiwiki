---
Title | Hot LM Tuning LoRA
-- | --
Created @ | `2023-06-02T07:07:34Z`
Updated @| `2025-01-02T06:25:01Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/406)

---
# LoRA

- LoRA - `Low-Rank Adaptation` 是微软研究员引入的一项新技术，主要用于处理大模型微调的问题。
- 在神经网络中，权重矩阵通常是高维的。LoRa 假设这些权重矩阵可以分解为低秩的形式。
- 已有研究表明了过度参数化的模型其实是位于一个低的内在维度上，所以作者假设在模型适应过程中的权重变化也具有较低的“内在等级”


## Arch
- 冻结预训练模型的权重
- 将 `rank-decompostion matrices` 添加到 Transformer 的每一层来训练


![image](https://github.com/junxnone/aiwiki/assets/2216970/5aecb88f-b112-4026-abb0-45cdb1d001a2)

## 模型合并
- LoRA + BigMdel 
- $W = W_0+\Delta W = W_0 + BA$ 
  - $W_0$ 是预训练模型的原始权重矩阵
  - $\Delta W =BA$ : $\Delta W$ 被分解为两个低秩矩阵 $B$ $A$ 的乘积
  -  $B$ $A$ 是对原始权重矩阵进行微小的调整，以适应特定的下游任务。
- 微调后由 $h=W_0x$  变为 $h=Wx$

### 比较

![image](https://github.com/junxnone/aiwiki/assets/2216970/1e810c91-87c1-4b5e-86c3-de7a08b22405)


## Reference

- paper 2021 [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) [[Code - Microsoft](https://github.com/microsoft/LoRA)]
- [lora - Huggingface PEFT](https://github.com/huggingface/peft/blob/main/src/peft/tuners/lora.py)
- [使用 LoRA 进行 Stable Diffusion 的高效参数微调](https://huggingface.co/blog/zh/lora)
- 
