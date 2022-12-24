---
Title | ML Transformer Linformer
-- | --
Created @ | `2021-02-20T03:04:14Z`
Last Modify @| `2022-12-24T15:48:12Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/224)

---
## Reference
- 2020-08 **[Linformer]** Linformer: Self-Attention with Linear Complexity [[Paper](https://arxiv.org/abs/2006.04768)] [[Code](https://github.com/pytorch/fairseq/tree/master/examples/linformer)] 
- [Code - lucidrains](https://github.com/lucidrains/linformer)
- [Linformer:具有线性复杂性的自注意力机制](https://zhuanlan.zhihu.com/p/147225773)
- [How Facebook uses super-efficient AI models to detect hate speech](https://ai.facebook.com/blog/how-facebook-uses-super-efficient-ai-models-to-detect-hate-speech/)

## Brief
- 减少 Transformer 复杂度 O(n^2) 到 O(n)
- linear self-attention(time & space)
- 论证 `注意力矩阵是低秩矩阵` -- `Self-Attention is Low Rank`, 使用 `低秩近似取代全注意力机制`
  -  `distributional Johnson–Lindenstrauss lemma`
- `K` & `V`  维度: `nxd` ==> `kxd`
  - k 为超参

**局限**
- only works with non-autoregressive models of a fixed sequence length
- 
## Motivation
- 目前大家优化 transformer 的技术:
  - Mixed Precision
  - Knowledge Distillation
  - Sparse Attention
  - LSH Attention
  - Improving Optimizer Efficiency
- 背景/存在的问题 [Transformer 训练时间长/收敛慢]
- 做了什么尝试/分别有什么效果
- 应用领域

## Arch
![image](https://user-images.githubusercontent.com/2216970/108582072-e6742b80-736b-11eb-9034-74d1686f37fa.png)

## Linear self-attention

![YJQM4CKElQ](https://user-images.githubusercontent.com/2216970/108582278-21c32a00-736d-11eb-80bf-02b7fc60264a.gif) 
-- | 
Linformer self-attention 与 标准 self-attention 的比较

![aSNGvHVUM3](https://user-images.githubusercontent.com/2216970/108582480-b1b5a380-736e-11eb-8224-5bf95c517ad6.gif)
-- |
FAIR detect hate speech 使用的 **linformer**

### Projections Parameter Sharing 

Level | Description | Matrices Number (example: `layer=12/head=12`)
-- | -- | --
Headwise | 同一 Layer 中 所有 Head 中 Projection matrices `Ei = E /Fi=F` | 24
Key-Value | `Headwise Sharing`+ `Ei=Fi=E` |  12
Layerwise | 所有 Layer/Head/Key-Value - `Ei = Fi=F` |  1

### 相关优化比较

Model | Transformer(2017) | Sparse Transformer(2019) | Reformer(2020) | Linformer(2020)
-- | -- | -- | -- | --
Complexity/Layer | O(n^2) | O(n^1.5) | O(n*log(n)) | **O(n)** 
Sequential Operation | O(1) | O(1) | O(log(n)) | **O(1)**

## Evaluation
-  Layerwise Sharing 取得了最好的实验结果
- Linformer 模型的 Performance 取决于 `k` 而非 `n/k`
- time/memory save 在 `n` 值 比较大时才比较明显

Linformer vs Transformer | ![image](https://user-images.githubusercontent.com/2216970/109374737-56e1f600-78f2-11eb-9ccf-740563270046.png)
-- | --
NLP Tasks 结果对比 | ![image](https://user-images.githubusercontent.com/2216970/109374766-ade7cb00-78f2-11eb-9dab-e4fa4a79c7c2.png)
Linformer/Transformer time saved | ![image](https://user-images.githubusercontent.com/2216970/109374804-fe5f2880-78f2-11eb-9015-06e4da57b176.png)
Linformer/Transformer memory saved | ![image](https://user-images.githubusercontent.com/2216970/109374813-09b25400-78f3-11eb-84ca-dcc3083e7316.png)

## Tricks

