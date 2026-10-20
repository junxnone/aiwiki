---
Title | LM FT ModelMerging
-- | --
Created @ | `2026-10-20T08:06:55Z`
Updated @| `2026-10-20T08:21:08Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/573)

---
# 模型合并（Model Merging）

> 本文是 [大模型微调总览](0410_LM_FT) 的深入篇。模型合并不是一种微调方法，而是"不用再训练、直接把多个已经微调好的模型/adapter 的权重合并成一个"的技术，但因为经常和 [LoRA](0406_LM_FT_LoRA)（多个任务各自的 adapter 怎么合并复用）放在一起讨论，本页单独展开。

## 为什么需要模型合并

如果已经基于同一个底座模型，分别微调出了"擅长数学"、"擅长代码"、"擅长对话礼貌度"的多个独立模型（或多个 LoRA adapter），模型合并能在**不需要任何额外训练**的前提下，把这些能力直接"揉"进一个模型里——相比重新做多任务联合训练，省去了重新收集数据、重新训练的成本，是目前社区做"缝合怪"模型（把多个开源微调模型合并成一个更强模型）最常用的手段，对应的开源工具是 [mergekit](https://github.com/arcee-ai/mergekit)。

## 核心方法

### SLERP（球面线性插值）

最朴素的合并方式是直接对两个模型的权重做线性插值（LERP）：`W = (1-t)·W_1 + t·W_2`。SLERP（Shoemake 1985，原本是计算机图形学里插值旋转/姿态的经典方法）发现：在高维权重空间里，沿着球面的路径插值，往往比直接走直线路径的损失更低——两个模型的权重向量被看作球面上的两个点，SLERP 沿着连接它们的大圆弧插值，而不是直接连一条直线。缺点是 SLERP 每次只能合并两个模型。

### TIES-Merging：消解参数冲突

直接平均多个模型的权重，容易出现**参数冲突**——不同模型针对同一个参数学到的更新方向可能相反，直接平均会互相抵消掉有用的信号。TIES（**T**r**I**m, **E**lect **S**ign, Merge，Yadav et al. 2023）分三步解决这个问题：

1. **Trim（裁剪）**：只保留每个模型里变化幅度最大（最重要）的一部分参数更新，裁掉变化很小、可能只是噪声的部分；
2. **Elect Sign（选举符号）**：对每个参数，统计所有待合并模型里这个参数更新的正负号，用多数表决定最终应该是正还是负；
3. **Merge（合并）**：只对符号和"选举结果"一致的那些模型的更新做平均，符号相反的模型在这个参数上被直接排除，不参与平均。

这套流程专门针对"参数冲突导致合并效果不如预期"这个问题设计。

### DARE：合并前先做随机剪枝+缩放

DARE（Drop And REscale，Yu et al. 2023，论文标题"Language Models are Super Mario"）的思路是：绝大多数微调带来的参数变化其实是冗余的，合并前先随机丢弃 90%~99% 的参数变化量（Drop），对剩下保留的部分按 `1/(1-p)` 缩放（Rescale，`p` 是丢弃比例）补偿丢弃造成的期望值损失——丢掉这么多居然对效果影响很小，说明这些参数变化里有大量冗余。DARE 常和 TIES 组合使用（配置文件里写作 `dare_ties`）：先用 DARE 对每个模型的参数变化做随机稀疏化，再用 TIES 的符号选举逻辑合并，实践中效果通常优于单独使用 SLERP 或 TIES。

## 怎么选

| 场景 | 推荐 |
|---|---|
| 只想合并两个模型，追求简单直接 | SLERP |
| 合并 3 个及以上模型，担心参数冲突互相抵消 | TIES-Merging |
| 要合并多个能力差异较大的模型，追求目前综合效果最好的方案 | DARE-TIES（先 DARE 稀疏化，再 TIES 合并） |
| 想快速试验、对比多种合并策略 | 直接用 [mergekit](https://github.com/arcee-ai/mergekit)，内置了 LERP/SLERP/TIES/DARE-TIES 等全部主流方法 |

## 和 LoRA/PEFT 的关系

模型合并既可以合并全参数微调出的完整模型，也可以合并多个 [LoRA](0406_LM_FT_LoRA) adapter（先把每个 LoRA 的 `ΔW=BA` 当作一个独立的"任务向量"，再用上述方法合并这些 `ΔW`，合并完再统一加回底座权重）——这和 [多 LoRA 生产部署](0572_LM_FT_MultiLoRAServing) 里"运行时动态挂载多个独立 adapter"是两种不同的思路：模型合并是离线把多个能力"焊死"进一份权重里，多 LoRA 服务是运行时保持多个 adapter 独立、按需切换，各有适用场景。

## Reference
- Yadav, P. et al. (2023). TIES-Merging: Resolving Interference When Merging Models. [arXiv:2306.01708](https://arxiv.org/abs/2306.01708)
- Yu, L. et al. (2023). Language Models are Super Mario: Absorbing Abilities from Homologous Models as a Free Lunch (DARE). [arXiv:2311.03099](https://arxiv.org/abs/2311.03099)
- [Arcee's MergeKit: A Toolkit for Merging Large Language Models](https://arxiv.org/abs/2403.13257)
- [mergekit GitHub](https://github.com/arcee-ai/mergekit)
- [LoRA](0406_LM_FT_LoRA)
- [大模型微调总览](0410_LM_FT)

