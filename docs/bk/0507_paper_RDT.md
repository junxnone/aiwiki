-----

| Title     | paper RDT                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-02-17T02:10:50Z`                                |
| Updated @ | `2025-04-09T05:35:00Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/507) |

-----

# RDT-1B 一种用于双手操作的扩散基础模型

  - 以扩散模型(DiTs)为基础，能够有效表征多模态，
  - 通过可扩展的 Transformer
    的创新设计，来应对多模态输入的**异质性问题(不同机器人之间的物理结构和动作空间可能差异巨大)**，并捕捉机器人数据的非线性和高频特性。
  - 引入了物理可解释统一动作空间, 可以统一不同机器人的动作表示形式，同时保留原始动作的物理意义，有助于学习可迁移的物理知识。
  - 在应用于双手操作时，现有模型面临量化误差和行为不协调的问题，这在很大程度上是由于其对动作空间进行了离散化处理。
  - **Task**: 给定语言指令 $\\ell$ ，在 $t \\in \\mathbb{N}^{+}$ 时刻，策略接收观测值
    $o\_{t}$ ；然后生成动作 $a\_{t}$ ，以控制两个机器人手臂实现由 $\\ell$ 指定的目标。观测值表示为一个三元组
    $o\_{t}:=(X\_{t - T\_{max} + 1 : t + 1}, z\_{t}, c)$，
      - 其中 $X\_{t - T\_{img} + 1 : t + 1}:=(X\_{t - T\_{img} + 1},
        \\ldots, X\_{t})$是RGB,观测历史数据，长度为 $T\_{img}$，
      - $z\_t$ 是机器人的低维本体感知信息，
      - $c$ 是控制频率。
      - 动作 $a\_t$ 通常是期望的本体感知 $z\_{t + 1}^1$ 的一个子集 。
  - Pretrain + Finetune

## Arch

  - T5-XXL(frozen), 将语言命令编码
  - SigLIP(frozen) 图像编码，图像文本对齐
  - RDT-1B 基于 DiTs 实现，扩展其 `DiT Blocks` 到总参数 1B+
  - MLPs 编码机器人物理量

![Image](media/e6d59ae6716bc1c3ab9bffb068824402ce876bd8.png)

### DiTs 架构

![Image](media/ff2d26e7239f499b105ac219c05f001f3a13fd7c.png)

## Reference

  - [RDT-1B: a Diffusion Foundation Model for Bimanual
    Manipulation](https://arxiv.org/pdf/2410.07864)
  - [Code](https://github.com/thu-ml/RoboticsDiffusionTransformer)
  - [Dataset](https://huggingface.co/datasets/robotics-diffusion-transformer/rdt-ft-data)
  - [Google T5
    Model](https://huggingface.co/google/t5-v1_1-xxl/tree/main)
  - [Google SigLIP
    Model](https://huggingface.co/google/siglip-so400m-patch14-384/tree/main)
