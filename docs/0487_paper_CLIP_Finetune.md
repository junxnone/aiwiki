---
Title | paper CLIP Finetune
-- | --
Created @ | `2024-10-16T09:23:21Z`
Updated @| `2026-11-26T08:43:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/487)

---
# CLIP Finetune 

CLIP（见 [CLIP](https://github.com/junxnone/aiwiki/issues/448)）零样本能力强，但在下游任务（尤其小样本）上还可以进一步适配。下面按「改动哪里」归类：

- [CoOP](/0474_paper_CoOP) - 自动优化提示词
- [CoCoOP](/0474_paper_CoOP?id=cocoop) - 条件提示学习
- [Tip-Adapter](/0475_paper_TipAdapter) - 缓存模型
- [CaFo](/0476_paper_CaFo) - 利用其他大模型
- [VPT](/0477_paper_VPT) - 在 Transformer 层中插入输入可学习参数
- [BitFit](/0478_paper_BitFit) - 只训练 bias-terms & task-specific final linear classifier layer
- [MTA](/0479_paper_MTA) - 测试时增强，基于均值漂移
- [LFA](/0480_paper_LFA) - 重新对齐视觉语言特征

## 方法对比

| 方法 | 改动位置 | 是否训练 | 特点 |
| --- | --- | --- | --- |
| CoOP / CoCoOP | 文本端提示词 | 训练提示词向量 | 少量参数，减少手工 prompt 工程 |
| Tip-Adapter | 缓存模型（键值） | 无需训练（可选微调 Tip-Adapter-F） | 非参数，速度快 |
| CaFo | 提示、生成数据、缓存 | 无需训练 | 融合多个基础模型的知识 |
| VPT | 视觉端输入 token | 训练插入的 token | 冻结主干，只学少量 token |
| BitFit | 偏置项和分类层 | 训练偏置项 | 参数极少 |
| MTA | 测试阶段的增强视图 | 无需训练 | 在推理时用均值漂移鲁棒聚合 |
| LFA | 视觉-语言特征对齐 | 训练对齐变换 | 重新对齐两个模态的特征 |

表中：

- **提示词（prompt）**：给文本编码器的文字模板；**缓存模型**：把少量训练样本的特征当作键值存储，用于推理时查询
- **测试时增强（TTA）**：对同一张测试图生成多个增强视图再综合预测
- 对比结论：可训练参数从多到少依次大致为 LFA / VPT / CoOP > BitFit；Tip-Adapter、CaFo、MTA 属于无训练或少训练的方案

## 选择建议

- 只想快速提升小样本分类：先试 Tip-Adapter（无需训练）
- 允许少量训练：CoOP 类提示学习
- 没有训练数据、只能在推理阶段改进：MTA 这类测试时方法
- 多个方法通常可以叠加，例如提示学习加缓存模型

