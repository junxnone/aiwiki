---
Title | paper TipAdapter
-- | --
Created @ | `2024-10-09T01:53:49Z`
Updated @| `2024-10-16T09:11:20Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/475)

---
# Tip-Adapter

- 利用 CLIP，从少量样本训练集中构建`键值缓存模型`来作为适配器，结合 CLIP 的输出综合生成结果
- 无需训练 - 非参数方式，训练的话更优
- **推理:** 测试图像特征与缓存键计算相似度，聚合缓存值形成预测，再与 CLIP 原始预测通过残差连接结合
  - 其中涉及计算查询 - 键亲和力及线性组合缓存值等操作，通过调整残差比率平衡两项预测。
- **Tip-Adapter-F**: 当few-shot 数量增加时，性能不如CoOP & CLIP-Adapter,所以提出了 `Tip-Adapter-F`
  - 将缓存模型的键作为可学习参数并微调，冻结缓存值和 CLIP 的两个编码器


![image](https://github.com/user-attachments/assets/f55862d4-2ca6-4b8e-9b09-57cd8b634f3d)


## Reference

- [Tip-Adapter: Training-free Adaption of CLIP for Few-shot Classification](https://arxiv.org/pdf/2207.09519)


