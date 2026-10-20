-----

| Title     | LM FT QLoRA                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-20T07:00:19Z`                                |
| Updated @ | `2026-10-20T07:00:19Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/567) |

-----

# QLoRA

> 本文是 [大模型微调总览](0410_LM_FT) 的深入篇，专门展开 QLoRA——把权重量化和 LoRA
> 结合起来的微调技术，是目前在显存受限场景下微调大模型最常用的方案之一。

## 解决什么问题

全参数微调和普通 [LoRA](0406_LM_FT_LoRA) 微调都有一个共同前提：得先把整份模型权重以 16bit 精度加载进显存。一个
65B 模型用 16bit 存储权重本身就需要约 130GB 显存，这还没算梯度、优化器状态、激活值——远超绝大多数单卡 GPU
的显存容量。QLoRA（Dettmers et al. 2023）的思路是：既然 LoRA
训练时并不更新基座权重，那基座权重完全可以用更低精度存储，只要推理计算时能准确地"解压"回来参与计算即可。QLoRA
用三个技巧的组合实现了这一点。

## 三个核心技巧

### 1\. 4-bit NormalFloat（NF4）量化

预训练权重的数值分布近似正态分布，NF4 是专门针对这个统计特性设计的 4bit 数据类型：用标准正态分布的分位数（而不是均匀间隔）来划分 16
个量化区间，让量化后的数值能更精确地覆盖权重实际的分布密度——密集的区域分得细、稀疏的区域分得粗。相比把浮点数均匀切成 16 份的普通 4bit
浮点，NF4 对正态分布权重的量化误差更小，这是三个技巧里对最终效果影响最大的一项。

### 2\. 双重量化（Double Quantization）

量化本身需要额外存储一组"量化常数"（每个 block 的 scale/zero-point），如果这组常数用 32bit
浮点存储，会带来不小的额外开销。双重量化把这些量化常数本身也再做一次量化（压缩到
8bit），平均下来每个参数能再省约 0.4 bit，且这一步的精度损失小到可以忽略，不影响最终训练效果。

### 3\. 分页优化器（Paged Optimizer）

训练过程中偶尔会出现显存使用的瞬时尖峰（比如长序列 batch 触发的激活值暴涨），容易导致单机训练因为这类瞬时峰值 OOM。分页优化器借助
NVIDIA 统一内存的自动分页机制，把优化器状态（如 AdamW 的一阶/二阶动量）在显存紧张时自动换出到 CPU
内存，需要时再换回来，专门用来压低这类瞬时峰值造成的 OOM 风险。

## 实际运行机制

基座模型权重用 NF4 格式量化后冻结存储；LoRA adapter（矩阵 A、B）依然用 BF16
精度训练；每次前向传播时，参与矩阵乘法的那部分量化权重会被临时反量化成
BF16，算完之后仍然以 NF4 格式留在显存里——也就是说显存里始终只保留一份压缩态的基座权重，没有一个完整的 16bit
副本。三个技巧叠加后，原本需要约 130GB 显存的 65B 模型，用 QLoRA 可以在单张 48GB
显存的 GPU 上完成微调，并且作者在论文中报告：在学术基准上，4bit QLoRA 的效果能和 16bit 全参数微调、16bit LoRA
微调基本持平。

## 和 LoRA 初始化变体的配合

[LoRA 初始化变体](0406_LM_FT_LoRA) 里的 **PiSSA**、**LoftQ**
都是专门为量化场景优化的初始化方式：PiSSA 用预训练权重的 SVD
主成分初始化 adapter，能降低 QLoRA 的量化误差；LoftQ 更进一步，联合优化量化本身的误差和 LoRA 的初始值，让
adapter 从训练一开始就去补偿量化带来的精度损失——在显存紧张、必须用 QLoRA 的场景下，这两种初始化通常比标准的随机初始化效果更好。

## 代码示例

``` python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",            # NF4 量化
    bnb_4bit_use_double_quant=True,       # 双重量化
    bnb_4bit_compute_dtype=torch.bfloat16,
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-65b-hf",
    quantization_config=bnb_config,
    device_map="auto",
)

lora_config = LoraConfig(
    r=16, lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)   # 分页优化器通常由训练框架（如 TRL/transformers Trainer）的 optim="paged_adamw_8bit" 开启
```

## Reference

  - Dettmers, T. et al. (2023). QLoRA: Efficient Finetuning of Quantized
    LLMs. [arXiv:2305.14314](https://arxiv.org/abs/2305.14314)
  - [bitsandbytes
    GitHub](https://github.com/bitsandbytes-foundation/bitsandbytes)
  - [大模型微调总览](0410_LM_FT)
  - [LoRA](0406_LM_FT_LoRA)
