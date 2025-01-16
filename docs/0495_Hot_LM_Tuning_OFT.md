---
Title | Hot LM Tuning OFT
-- | --
Created @ | `2025-01-16T03:14:25Z`
Updated @| `2025-01-16T03:14:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/495)

---
# OFT/BOFT
- OFT 利用正交矩阵对预训练权重矩阵进行乘法变换以实现高效微调，新矩阵在保持预训练权重矩阵不变的情况下适应新数据，最后将两者相乘得到结果。
- BOFT 是 OFT 的推广，使用蝶形分解进一步提高参数效率和微调灵活性，OFT 可视为 BOFT 的特殊情况。


## Arch

![image](https://github.com/user-attachments/assets/d4563f7e-51fb-4593-8967-9694e327a24c)



## 权重合并

![image](https://github.com/user-attachments/assets/a3e0b188-02cc-46d6-920a-29a622fe224e)


## Reference
- [Controlling Text-to-Image Diffusion by Orthogonal Finetuning](https://arxiv.org/abs/2306.07280)
- [Parameter-Efficient Orthogonal Finetuning via Butterfly Factorization](https://arxiv.org/abs/2311.06243)
