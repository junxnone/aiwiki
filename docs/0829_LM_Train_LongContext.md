---
Title | LM Train LongContext
-- | --
Created @ | `2026-11-26T15:35:31Z`
Updated @| `2026-11-26T15:42:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/829)

---
# LongContext

长上下文：为什么把上下文从 4K 扩到 128K 甚至更长很难，RoPE 外推方法 (PI、NTK、YaRN)，长上下文继续训练的流程，以及怎样评测长上下文能力。

## 难点

难点 | 原因 | 对应方法
-- | -- | --
位置外推 | 训练时没见过的位置，RoPE 的旋转角超出训练范围，注意力分布异常 | 位置插值 / 调整 RoPE 频率
计算量 | 注意力随长度 $S$ 平方增长 | FlashAttention、上下文并行
显存 | 激活与 KV Cache 随 $S$ 线性增长 | 重计算、上下文并行、KV 压缩
数据 | 真正需要长距离依赖的高质量长文本稀少 | 拼接长文档、合成长依赖任务
有效利用 | 模型能「装下」不等于能「用好」，中间部分的信息常被忽略 | 长上下文训练数据配比、评测

表中：前三项是工程问题，后两项是能力问题；计算量估算见 [Architecture](/0823_LM_Train_Architecture) 的每 token 计算量一节，$S=128$K 时注意力的计算约是参数部分的 $2.6$ 倍 (8B 模型)。

## RoPE 外推

RoPE 第 $i$ 组维度的旋转角为 $\theta_{m,i}=m\,\omega_i$，$\omega_i=b^{-2i/d_h}$ ($b$ 为基频，通常 $10000$)，定义见 [Architecture](/0823_LM_Train_Architecture)。设训练长度为 $L_{train}$，目标长度为 $L'=sL_{train}$ ($s$ 为扩展倍数)：

方法 | 做法 | 公式
-- | -- | --
位置插值 PI | 把位置按比例压缩回训练范围 | $\theta'_{m,i}=\frac{m}{s}\,\omega_i$
NTK-aware | 增大基频，使高频维度几乎不变、低频维度被插值 | $b'=b\cdot s^{\frac{d_h}{d_h-2}}$
YaRN | 按维度的波长分段：高频不插值、低频完全插值、中间平滑过渡；并对注意力加温度修正 | 见下

表中：PI 对所有维度一视同仁，会损害高频维度 (负责编码相邻 token 的细粒度位置) 的分辨率；NTK 和 YaRN 只对低频维度插值，所以对短文本的效果影响更小。

YaRN 的分段插值：

$$
\theta'_{m,i}=m\Bigl[(1-\gamma(r_i))\frac{\omega_i}{s}+\gamma(r_i)\,\omega_i\Bigr],\qquad
r_i=\frac{L_{train}}{\lambda_i},\quad \lambda_i=\frac{2\pi}{\omega_i}
$$

其中：

- $\lambda_i$：第 $i$ 组维度的波长 (转一圈需要的 token 数)；$r_i$：训练长度内转了多少圈
- $\gamma(r)$：斜坡函数，$r>\beta$ 时为 $1$ (转了很多圈的高频维度，不插值)，$r<\alpha$ 时为 $0$ (训练中连一圈都没转完的低频维度，完全插值)，中间线性过渡；论文取 $\alpha=1,\beta=32$
- $s$：扩展倍数；此外 YaRN 把注意力 logits 乘以 $\frac{1}{t}$，$\sqrt{1/t}=0.1\ln s+1$，补偿长序列下注意力熵的变化
- 好处：只需在长文本上训练少量步数 (论文中约 $400$ 步) 即可扩展到 $s$ 倍长度 `[待核实]`

## 长上下文继续训练

```mermaid
flowchart LR
    A[短上下文基础模型<br>如 8K] --> B[修改 RoPE<br>基频/YaRN]
    B --> C[长文本继续预训练<br>逐级 32K → 128K]
    C --> D[长上下文 SFT<br>长文档问答/摘要]
    D --> E[长上下文评测]
```

图中：

- 先改位置编码，再在长文本上继续预训练，通常分几级逐步加长，每级用较少的 token (数十亿到数百亿)
- 继续训练的数据要混入原来的短文本，防止短上下文能力退化；长文本来源有书籍、代码仓库、拼接的相关文档
- 最后做长上下文的指令微调，并用专门的评测检查；Llama 3.1 就是在预训练的最后阶段逐级把上下文扩到 $128$K `[待核实]`

工程上：长序列的激活显存用上下文并行 (把序列切到多卡，ring attention) 和重计算解决，见 [Distributed](/0825_LM_Train_Distributed) 与 [Efficiency](/0826_LM_Train_Efficiency)。

## 评测

评测 | 做法 | 测什么
-- | -- | --
大海捞针 (NIAH) | 在长文本的不同位置插入一句关键信息，再提问 | 能否检索到任意位置的信息
RULER | 多针、多跳追踪、聚合等合成任务 | 比单针更难的长距离推理，给出「有效上下文长度」
LongBench 等 | 真实的长文档问答、摘要、代码任务 | 实际任务效果

表中：只通过单针测试不代表能用好长上下文，许多模型宣称的长度远大于 RULER 测出的有效长度；部署前应该用自己的任务验证，见 [Eval](/0827_LM_Train_Eval)。

## 推理侧

- KV Cache 随长度线性增长，长上下文推理受带宽和显存限制更严重，见 [Infer Basics](/0834_LM_Infer_Basics) 与 [KVCache 管理](/0838_LM_Infer_KVCache)
- 前缀缓存对重复使用同一份长文档 (如同一份合同多次提问) 收益很大，见 [Optimization](/0835_LM_Infer_Optimization)
- 很多场景用 [RAG](/0461_LM_RAG) 只取相关片段，比把整份资料塞进上下文更便宜

## Reference
- [Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595)
- [YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071)
- [RULER: What's the Real Context Size of Your Long-Context Language Models?](https://arxiv.org/abs/2404.06654)
- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)
- [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)

