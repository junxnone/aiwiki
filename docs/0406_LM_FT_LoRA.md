---
Title | LM FT LoRA
-- | --
Created @ | `2023-06-02T07:07:34Z`
Updated @| `2026-10-20T07:13:07Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/406)

---
# LoRA

- LoRA - `Low-Rank Adaptation` 是微软研究员引入的一项新技术，主要用于处理大模型微调的问题。
- 在神经网络中，权重矩阵通常是高维的。LoRa 假设这些权重矩阵可以分解为低秩的形式。
- 已有研究表明了过度参数化的模型其实是位于一个低的内在维度上，所以作者假设在模型适应过程中的权重变化也具有较低的“内在等级”


## Arch
- 冻结预训练模型的权重
- 将 `rank-decompostion matrices` 添加到 Transformer 的每一层来训练


![image](https://github.com/junxnone/aiwiki/assets/2216970/5aecb88f-b112-4026-abb0-45cdb1d001a2)

## 模型合并
- LoRA + BigMdel 
- $W = W_0+\Delta W = W_0 + BA$ 
  - $W_0$ 是预训练模型的原始权重矩阵
  - $\Delta W =BA$ : $\Delta W$ 被分解为两个低秩矩阵 $B$ $A$ 的乘积
  -  $B$ $A$ 是对原始权重矩阵进行微小的调整，以适应特定的下游任务。
- 微调后由 $h=W_0x$  变为 $h=Wx$

![image](https://github.com/user-attachments/assets/d609de69-e5d5-44cb-920e-6649ce066577)


### Example Fc1

![image](https://github.com/user-attachments/assets/2215d72b-6717-4efd-b12f-d346ada4236e)



### 比较

![image](https://github.com/junxnone/aiwiki/assets/2216970/1e810c91-87c1-4b5e-86c3-de7a08b22405)


## LoRA 变种
### LoRA+
- LoRA+的作者可以证明，只有单一的学习率是次优的。将矩阵B的学习率设置为远高于矩阵A的学习率，可以使得训练更加高效。
- 矩阵B的初始化为0，所以需要比随机初始化的矩阵a需要更大的更新步骤。通过将矩阵B的学习率设置为矩阵A的16倍，作者已经能够在模型精度上获得小幅提高(约2%)，同时将RoBERTa或lama-7b等模型的训练时间加快2倍。

### VeRA
- `Vector-based Random Matrix Adaptation`
- 没有训练矩阵A和B而是用共享的随机权值初始化这些矩阵(即所有层中所有矩阵A和B都具有相同的权值)，并添加两个新的向量d和B，微调的时候只训练向量d和B。
- 基于一个有趣的研究领域，即所谓的随机预测。
- 通过引入向量d和b只训练这些相关的子网络，与原始的LoRa方法相反矩阵A和b是冻结的，并且矩阵B不再被设置为零，而是像矩阵A一样随机初始化
- 产生比完整矩阵a和b小得多的参数。


### LoRA-FA
- `LoRA - Frozen-A`
- 矩阵A在初始化后被冻结，因此作为随机投影。矩阵B不是添加新的向量，而是在用零初始化之后进行训练
- 参数数量减半，同时具有与普通LoRA相当的性能。

### LoRA-Drop
- 引入了一种算法来决定哪些层由LoRA微调，哪些层不需要。
- 对数据的一个子集进行采样，训练LoRA进行几次迭代。然后将每个LoRA适配器的重要性计算为BAx，其中A和B是LoRA矩阵，x是输入。这是添加到冻结层输出中的LoRA的输出。如果这个输出很大，说明它会更剧烈地改变行为。如果它很小，这表明LoRA对冻结层的影响很小可以忽略。
- 与训练所有的LoRA层相比，准确度只有微小的变化，但由于必须训练的参数数量较少，因此减少了计算时间。

### AdaLoRA

把 LoRA 矩阵的奇异值当作重要性指标，动态给不同层/适配器分配不同的秩，比标准 LoRA 效果更好，详见独立的 [AdaLoRA](0491_LM_FT_AdaLoRA) 一文。

## LoRA 初始化变体

标准 LoRA 默认把矩阵 A 用 Kaiming 均匀分布随机初始化、矩阵 B 初始化为全零，这样 $BA=0$，训练刚开始时 LoRA 相当于一个恒等变换（no-op），不会打乱预训练模型原有的行为。下面几种变体都是在"怎么给 A、B 选一个更好的起点"这件事上做文章：

- **PiSSA**（Principal Singular values and Singular vectors Adaptation）：不用随机噪声初始化，而是用预训练权重矩阵做 SVD 分解，取主奇异值和奇异向量来初始化 A、B——相当于让 adapter 从一开始就编码了原始权重里最重要的结构，收敛更快，最终效果也更好，量化场景下还能减少 QLoRA 的量化误差；
- **OLoRA**：用 QR 分解来初始化，相当于在训练开始前先对基座权重做一次正交变换，显著提升训练稳定性、加快收敛，初始化本身的额外耗时极小（基准测试中约占总训练时间的 0.59%）；
- **EVA**（Explained Variance Adaptation）：数据驱动的初始化——对每一层的输入激活做 SVD，用右奇异向量初始化 LoRA 权重，并根据每层的"解释方差比"自适应分配各层的秩，兼顾了初始化质量和秩分配两个维度；
- **LoftQ**：专门为量化场景设计——联合优化量化误差和 LoRA 的初始值，让 A、B 的初始化本身就去补偿权重量化带来的精度损失，是 QLoRA 场景下提升效果的常见技巧；
- **rsLoRA**（Rank-Stabilized LoRA）：标准 LoRA 用 `alpha/r` 做缩放，秩 r 调高时容易梯度不稳定；rsLoRA 改成 `alpha/sqrt(r)`，让使用更高的秩来换取更好效果这件事在训练上更稳定；
- **DoRA**（Weight-Decomposed Low-Rank Adaptation）：把权重更新分解成"大小（magnitude）"和"方向（direction）"两部分——方向部分依然用标准 LoRA 更新，大小部分单独用一个可学习参数控制，效果上更接近全参数微调，且不引入任何额外推理开销（大小向量和低秩方向更新最终还是能合并回原始权重）。

这几种初始化方式在 Hugging Face PEFT 库里都可以直接通过参数开启（如 `init_lora_weights="pissa"`、`use_dora=True` 等），并且大多可以互相组合使用（如 DoRA + rsLoRA）。

## QLoRA：和权重量化结合

QLoRA（Dettmers et al. 2023）把预训练权重量化到 4bit（NF4 格式）冻结，只训练 BF16 精度的 LoRA adapter，配合双重量化、分页优化器两个工程技巧，能把 65B 模型的微调显存从约 130GB 压到单张 48GB 显存的 GPU 就能跑，且效果和 16bit 全参数/LoRA 微调基本持平。详细原理见 [QLoRA](0567_LM_FT_QLoRA)。

## 怎么用：rank/alpha 怎么选、该加在哪些层

- **rank（r）**：秩越大，LoRA 能拟合的变化越丰富，但可训练参数和显存占用也线性增长；经验上 r=8~16 对大多数下游任务已经够用，r=64 以上的收益通常很有限，更值得先尝试其他变种（如 DoRA）而不是一味加大 r；
- **alpha（α）**：控制 LoRA 分支输出的缩放强度（`ΔW` 乘以 `alpha/r`），常见做法是把 `alpha` 设成 `r` 的 2 倍（如 r=8 配 alpha=16），r 变大时记得同步调整 alpha，否则等效学习率会随 r 变化而漂移；
- **加在哪些层**：最早的 LoRA 论文只对 Attention 里的 `Q`、`V` 投影加 LoRA；后续实践发现把 LoRA 加到**所有线性层**（包括 `K`、`O` 投影和 MLP 的上/下投影层）通常效果更好，尤其是 MLP 层——现代开源微调脚本（如 `peft`/`axolotl`）大多默认把 `target_modules` 设成全部线性层而不是只设 `q_proj`/`v_proj`。

## 生产部署：多 LoRA 服务与热切换

LoRA 推理时既可以把 `BA` **合并**回 `W_0`（等效于原模型，零额外推理开销，但切换任务要重新合并），也可以**不合并**、让多个任务的 LoRA adapter 和同一个冻结底座共存，推理请求按需挂载对应的 adapter——这是目前大模型服务落地的常见形态：一个底座模型常驻显存，不同用户/任务各自的 LoRA 权重很小，可以按请求动态加载/切换，不需要为每个任务都单独部署一份完整模型。S-LoRA、vLLM 的 multi-LoRA 等服务框架都是基于这个思路，把"many tasks share one base model"做成了工程上可扩展的方案。

## 代码示例（Hugging Face PEFT）

```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    task_type="CAUSAL_LM",
)
model = get_peft_model(base_model, config)
model.print_trainable_parameters()   # 查看可训练参数占比，通常在 0.1%~1% 之间

# 训练完成后，可选择合并回底座权重（零推理开销，但失去动态切换能力）
merged_model = model.merge_and_unload()
```

## Reference

- paper 2021 [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) [[Code - Microsoft](https://github.com/microsoft/LoRA)]
- [lora - Huggingface PEFT](https://github.com/huggingface/peft/blob/main/src/peft/tuners/lora.py)
- [使用 LoRA 进行 Stable Diffusion 的高效参数微调](https://huggingface.co/blog/zh/lora)
- Dettmers, T. et al. (2023). QLoRA: Efficient Finetuning of Quantized LLMs. [arXiv:2305.14314](https://arxiv.org/abs/2305.14314)
- [PEFT LoRA 开发者文档（PiSSA/OLoRA/EVA/LoftQ/rsLoRA/DoRA 参数说明）](https://huggingface.co/docs/peft/en/developer_guides/lora)
- [AdaLoRA](0491_LM_FT_AdaLoRA)
- [QLoRA](0567_LM_FT_QLoRA)

