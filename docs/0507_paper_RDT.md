---
Title | paper RDT
-- | --
Created @ | `2025-02-17T02:10:50Z`
Updated @| `2025-04-09T05:35:00Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/507)

---
# RDT-1B 一种用于双手操作的扩散基础模型


 - 以扩散模型(DiTs)为基础，能够有效表征多模态，
 - 通过可扩展的 Transformer 的创新设计，来应对多模态输入的**异质性问题(不同机器人之间的物理结构和动作空间可能差异巨大)**，并捕捉机器人数据的非线性和高频特性。
- 引入了物理可解释统一动作空间, 可以统一不同机器人的动作表示形式，同时保留原始动作的物理意义，有助于学习可迁移的物理知识。
- 在应用于双手操作时，现有模型面临量化误差和行为不协调的问题，这在很大程度上是由于其对动作空间进行了离散化处理。
- **Task**:  给定语言指令 $\ell$ ，在 $t \in \mathbb{N}^{+}$ 时刻，策略接收观测值 $o_{t}$ ；然后生成动作 $a_{t}$ ，以控制两个机器人手臂实现由 $\ell$ 指定的目标。观测值表示为一个三元组 $o_{t}:=(X_{t - T_{max} + 1 : t + 1}, z_{t}, c)$，
  - 其中 $X_{t - T_{img} + 1 : t + 1}:=(X_{t - T_{img} + 1}, \ldots, X_{t})$是RGB,观测历史数据，长度为 $T_{img}$，
  - $z_t$ 是机器人的低维本体感知信息，
  - $c$ 是控制频率。
  - 动作 $a_t$ 通常是期望的本体感知 $z_{t + 1}^1$ 的一个子集 。
- Pretrain + Finetune  
 
## Arch
- T5-XXL(frozen), 将语言命令编码
- SigLIP(frozen) 图像编码，图像文本对齐
- RDT-1B 基于 DiTs 实现，扩展其 `DiT Blocks` 到总参数 1B+
-  MLPs 编码机器人物理量


![Image](https://github.com/user-attachments/assets/7fd22583-afcf-4e78-a953-cd00cb2b0c6b)


### DiTs 架构

![Image](https://github.com/user-attachments/assets/ee2574f8-ff75-443d-aab4-94b42486536f)


## Reference
- [RDT-1B: a Diffusion Foundation Model for Bimanual Manipulation](https://arxiv.org/pdf/2410.07864)
- [Code](https://github.com/thu-ml/RoboticsDiffusionTransformer)
- [Dataset](https://huggingface.co/datasets/robotics-diffusion-transformer/rdt-ft-data)
- [Google T5 Model](https://huggingface.co/google/t5-v1_1-xxl/tree/main)
- [Google SigLIP Model](https://huggingface.co/google/siglip-so400m-patch14-384/tree/main)
