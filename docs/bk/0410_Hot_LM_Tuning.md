-----

| Title     | Hot LM Tuning                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-06-05T03:10:12Z`                                |
| Updated @ | `2025-01-16T02:22:49Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/410) |

-----

# 大模型微调

  - Full Fine-Tuning
  - Adapter-Tuning
      - LoRAs
  - Prompting
      - 提示调整（prompt tuning）
      - 前缀调整（prefix tuning）
      - P 调整（P-tuning）
      - 多任务提示调整（multitask prompt tuning）
  - Dreambooth

## Adapter-Tuning

在预训练模型的特定层或位置插入一些小型的适配器模块（Adapter）。在微调过程中，主要对这些适配器模块的参数进行调整，而保持预训练模型的大部分参数不变。通过这种方式，可以利用预训练模型的强大表示能力，同时以较小的计算成本和数据量实现对特定任务的适配和优化，使得模型在新任务上的性能得到提升，并且在一定程度上缓解过拟合现象，提高模型的泛化能力。

## Prompting

  - 硬提示（hard prompts）是带有离散输入标记的手工制作的文本提示；缺点是创建一个好的提示需要很多努力。
  - 软提示（soft prompts）是与输入嵌入连接的可学习张量，可以针对数据集进行优化；缺点是它们不是人类可读的，因为没有将这些
    “虚拟标记” 与真实单词的嵌入相匹配。

## Reference

  - [LoRA: Low-Rank Adaptation of Large Language Models
    简读](https://zhuanlan.zhihu.com/p/514033873)
  - [Adapter/Prompt文献整理](https://zhuanlan.zhihu.com/p/554959952)
  - [PEFT - huggingface](https://github.com/huggingface/peft)
