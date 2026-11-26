---
Title | x DefectGen
-- | --
Created @ | `2023-05-30T14:51:48Z`
Updated @| `2026-11-26T10:11:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/403)

---
# 缺陷图片生成

工业缺陷检测中，缺陷样本稀少且标注昂贵。缺陷图片生成通过算法合成带缺陷的图像（有时同时生成缺陷区域的掩码），扩充训练数据。

- [A Survey on Industrial Anomalies Synthesis](/0511_paper_AnomaliesSynthesisSurvey)

![Image](https://github.com/user-attachments/assets/08a14e4e-5a37-4a3e-b12e-9a7cf60bda3c)

图中：该图为原文档附带的缺陷合成相关示意图。

## 方法分类

| 类别 | 做法 | 例子 |
| --- | --- | --- |
| 手工合成 | 把缺陷纹理（如 Cutout、噪声、Perlin 噪声）叠加到正常图上 | Copy-Paste、CutPaste |
| GAN | 用生成对抗网络学习缺陷外观 | Defect-GAN |
| 扩散模型 | 用少量缺陷样本微调扩散模型生成缺陷 | [AnomalyDiffusion](https://github.com/junxnone/aiwiki/issues/513)、[DualAnoDiff](https://github.com/junxnone/aiwiki/issues/522) |

表中：

- **手工合成**：速度快、不需要缺陷样本，但真实感有限；**GAN / 扩散模型**：需要少量真实缺陷，真实感更高
- 对比结论：从手工合成到扩散模型，真实感逐步提高，训练和生成成本也随之增加

## 评估

生成质量通常用 IS（Inception Score）、IC-LPIPS 等评价生成的真实度与多样性，并最终看合成数据对下游检测 / 分割模型的提升，指标定义见 [AnomalyDiffusion](https://github.com/junxnone/aiwiki/issues/513)。

## Reference
- [Defect-GAN: High-Fidelity Defect Synthesis for Automated Defect Inspection](https://arxiv.org/abs/2103.15158)

