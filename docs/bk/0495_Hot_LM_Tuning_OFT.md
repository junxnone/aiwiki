-----

| Title     | Hot LM Tuning OFT                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-01-16T03:14:25Z`                                |
| Updated @ | `2025-01-16T03:14:25Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/495) |

-----

# OFT/BOFT

  - OFT
    利用正交矩阵对预训练权重矩阵进行乘法变换以实现高效微调，新矩阵在保持预训练权重矩阵不变的情况下适应新数据，最后将两者相乘得到结果。
  - BOFT 是 OFT 的推广，使用蝶形分解进一步提高参数效率和微调灵活性，OFT 可视为 BOFT 的特殊情况。

## Arch

![image](media/830973dc7554b9cca229c9e0e45fa5bda27155af.png)

## 权重合并

![image](media/5f3c99ab1145126dea6f21816c9095b794996116.png)

## Reference

  - [Controlling Text-to-Image Diffusion by Orthogonal
    Finetuning](https://arxiv.org/abs/2306.07280)
  - [Parameter-Efficient Orthogonal Finetuning via Butterfly
    Factorization](https://arxiv.org/abs/2311.06243)
