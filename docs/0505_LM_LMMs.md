---
Title | LM LMMs
-- | --
Created @ | `2025-02-08T08:03:32Z`
Updated @| `2026-11-26T08:28:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/505)

---
# 多模态大模型
- LLMs + 多种数据类型 => LMMs
- `有些模型，如 Midjourney、Stable Diffusion 和 Dall-E，虽然可以处理多种数据，但并没有集成语言模型。`
- Task
  - 生成
    - 文生图
    - 文字生成(输入为文字/图像)
  - VLU 视觉语言理解
    - 图像分类
    - 基于文本的图像检索
- 训练
  - CLIP
  - Flamingo

## 基本结构

```mermaid
flowchart LR
    I[图像 视频 音频] --> E[模态编码器 如 ViT]
    E --> P[连接模块 投影层或 Q-Former]
    P --> L[大语言模型 LLM]
    T[文本 Prompt] --> L
    L --> O[文本输出 或 生成其他模态]
```

图中：

- **模态编码器**：把图像等非文本输入编码成特征，常用预训练的 ViT / CLIP 图像编码器
- **连接模块**：把视觉特征映射到 LLM 的词嵌入空间，常见为线性层、MLP 或 Q-Former
- **LLM**：把视觉特征当作一串「视觉 token」，和文本 token 一起处理并输出
- 关键结论：多模态大模型的核心是「让 LLM 看懂其他模态」，而不是重新训练整个模型

## 训练：对比学习与指令微调

### CLIP 的对比损失

$$
\mathcal{L}=-\frac{1}{N}\sum_{i=1}^{N}\log\frac{\exp\big(\mathrm{sim}(v_i,t_i)/\tau\big)}{\sum_{j=1}^{N}\exp\big(\mathrm{sim}(v_i,t_j)/\tau\big)}
$$

其中：

- $N$：一个 batch 内的图文对数量；$v_i$：第 $i$ 张图像的特征；$t_i$：与它配对的文本特征
- $\mathrm{sim}(\cdot,\cdot)$：余弦相似度；$\tau$：温度系数，控制分布的尖锐程度
- 分子是配对样本的相似度，分母遍历 batch 里的所有文本，目标是让配对样本相似度最高
- 实际中还有对称的「文本到图像」项；详见 [paper CLIP](https://github.com/junxnone/aiwiki/issues/448)

### 常见训练阶段

| 阶段 | 目的 | 常见做法 |
| --- | --- | --- |
| 预训练 / 对齐 | 让视觉特征对齐到语言空间 | 冻结编码器和 LLM，只训练连接模块，使用图文对 |
| 指令微调 | 学会按指令回答视觉问题 | 解冻 LLM 或加 LoRA，用视觉问答、对话数据 |
| 偏好对齐 | 减少幻觉、提高可靠性 | RLHF / DPO（见 [大模型对齐训练](https://github.com/junxnone/aiwiki/issues/568)） |

表中：

- **冻结**：该部分参数不更新；**指令微调**：用「指令-回答」数据让模型学会遵循指令
- 对比结论：分阶段训练，先低成本对齐模态，再提升对话和指令能力

## 代表模型

| 模型 | 特点 |
| --- | --- |
| CLIP | 图文对比学习，零样本分类和检索 |
| Flamingo | 在冻结的 LLM 中插入跨模态注意力层，支持少样本图文交错输入 |
| BLIP-2 | 用 Q-Former 连接冻结的图像编码器和 LLM |
| LLaVA | 线性/MLP 投影 + 视觉指令微调，结构简单效果好 |
| GPT-4V 等闭源模型 | 具备较强的图像理解与推理能力 |

表中：

- **Q-Former**：一组可学习查询向量，通过注意力从视觉特征中抽取与文本相关的信息
- 对比结论：CLIP 类偏表示学习，Flamingo、BLIP-2、LLaVA 类是在 LLM 之上扩展多模态

## Reference
- [多模态和多模态大模型 (LMM)[译]](https://baoyu.io/blog/translations/multimodality-and-large-multimodal-models)
- [Multimodality and Large Multimodal Models (LMMs)](https://huyenchip.com/2023/10/10/multimodal.html)
- [Awesome-Multimodal-Large-Language-Models](https://github.com/BradyFU/Awesome-Multimodal-Large-Language-Models)

