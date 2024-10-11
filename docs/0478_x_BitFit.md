---
Title | x BitFit
-- | --
Created @ | `2024-10-11T02:53:15Z`
Updated @| `2024-10-11T02:53:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/478)

---
# BitFit
- 冻结大部分 Transformer 编码器参数，只训练 `bias-terms` & `task-specific final linear classifier layer`



## Arch
- 编码器由L层组成，其中每一层 ℓ 都以M个自注意力头开始
- 一个自注意力头 $(m, \ell)$ 具有键、查询和值编码器，每个都采用线性层的形式：
  - $Q^{m, \ell}(x)=W_{q}^{m, \ell} x + b_{q}^{m, \ell}$
  - $K^{m, \ell}(x)=W_{k}^{m, \ell} x + b_{k}^{m, \ell}$
  - $V^{m, \ell}(x)=W_{v}^{m, \ell} x + b_{v}^{m, \ell}$
- x 是前一个编码器层的输出（对于第一个编码器层，x是嵌入层的输出）
- 然后使用不涉及新参数的注意力机制将它们组合起来：
  - $h_{1}^{\ell}=att\left(Q^{1, \ell}, K^{1, \ell}, V^{1, \ell},.., Q^{m, \ell}, K^{m, \ell}, V^{m, l}\right)$
- 将其输入到带有层归一化（LN）的多层感知机（MLP）中：
  - $h_{2}^{\ell}=Dropout\left(W_{m_{1}}^{\ell} \cdot h_{1}^{\ell}+b_{m_{1}}^{\ell}\right) (1)$
  - $h_{3}^{\ell}=g_{L N_{1}}^{\ell} \odot \frac{\left(h_{2}^{\ell}+x\right)-\mu}{\sigma}+b_{L N_{1}}^{\ell} (2)$
  - $h_{4}^{\ell}=GelU\left(W_{m_{2}}^{\ell} \cdot h_{3}^{\ell}+b_{m_{2}}^{\ell}\right) (3)$
  - $h_{5}^{\ell}=Dropout\left(W_{m_{3}}^{\ell} \cdot h_{4}^{\ell}+b_{m_{3}}^{\ell}\right) (4)$
  - $out ^{\ell}=g_{L N_{2}}^{\ell} \odot \frac{\left(h_{5}^{\ell}+h_{3}^{\ell}\right)-\mu}{\sigma}+b_{L N_{2}}^{\ell} (5)$
- $b_{(\cdot)}^{\ell,(\cdot)}$ 是偏差项
- 通过冻结所有参数 $w^{(\cdot)}$ 和 $g^{(\cdot)}$ ，仅对可加偏差项 $b^{(\cdot)}$ 进行微调


## Reference

- [BitFit: Simple Parameter-efficient Fine-tuning for Transformer-based Masked Language-models](https://arxiv.org/abs/2106.10199)
