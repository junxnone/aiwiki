-----

| Title     | LM LLMs LLaMA                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-02-08T08:02:01Z`                                |
| Updated @ | `2026-11-26T08:28:49Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/504) |

-----

# LLaMA

  - LLaMA - `Large Language Model Meta AI`
  - 基于 Transformer
  - Meta 发布的开放权重基础语言模型，用较小的参数量 + 更多训练数据，在多数基准上追平更大的模型

## 版本

| 版本      | 发布     | 参数规模                 | 训练 token     | 上下文长度 |
| ------- | ------ | -------------------- | ------------ | ----- |
| LLaMA   | 2023.2 | 7B / 13B / 33B / 65B | 1.0T \~ 1.4T | 2048  |
| Llama 2 | 2023.7 | 7B / 13B / 70B       | 2T           | 4096  |

表中：

  - **B**：十亿（Billion）参数；**T**：万亿（Trillion）token
  - Llama 2 同时发布对话微调版（Llama 2-Chat），采用 SFT + RLHF（见
    [大模型对齐训练](https://github.com/junxnone/aiwiki/issues/568)）
  - 对比结论：LLaMA 的思路是「在给定推理预算下，多训练数据比加大模型更划算」

## 结构相对标准 Transformer 的改动

``` mermaid
flowchart LR
    X[输入 token] --> E[Embedding]
    E --> B1[Block x N]
    B1 --> N[RMSNorm]
    N --> H[输出 Logits]
    subgraph Block
        direction TB
        R1[RMSNorm] --> A[Attention + RoPE]
        A --> R2[RMSNorm]
        R2 --> F[SwiGLU FFN]
    end
```

图中：

  - 每个 Block 先对输入做 RMSNorm（预归一化 pre-norm），再进入带 RoPE 的 Attention；再一次
    RMSNorm 后进入 SwiGLU 前馈网络；两处都带残差连接
  - 关键结论：三个改动——RMSNorm、SwiGLU、RoPE——都是为训练稳定和效果服务的小改动

### RMSNorm

$$
\\mathrm{RMSNorm}(x)=\\frac{x}{\\sqrt{\\frac{1}{d}\\sum\_{i=1}^{d}x\_i^{2}+\\epsilon}}\\odot
g $$

其中：

  - $x\\in\\mathbb{R}^{d}$：输入向量，$d$ 为隐层维度；$x\_i$ 为第 $i$ 个分量
  - $\\epsilon$：防止除零的小常数；$g$：可学习的缩放参数；$\\odot$：逐元素相乘
  - 与 LayerNorm 相比，不减均值、没有偏置，计算更省

### SwiGLU

$$ \\mathrm{SwiGLU}(x)=\\big(\\mathrm{SiLU}(xW\_1)\\odot
xW\_3\\big)W\_2,\\qquad \\mathrm{SiLU}(z)=z,\\sigma(z) $$

其中：

  - $W\_1,W\_3$：把 $x$ 投影到中间维度的两个权重；$W\_2$：投影回隐层维度
  - $\\sigma$：sigmoid；$\\mathrm{SiLU}$：Sigmoid Linear Unit 激活
  - $\\odot$：逐元素相乘，一路作为「门」控制另一路；比普通 ReLU FFN 效果更好

### RoPE（旋转位置编码）

$$ f(x\_m, m) = R\_{\\Theta,m},x\_m,\\qquad \\langle
f(q,m),,f(k,n)\\rangle = g(q,k,m-n) $$

其中：

  - $x\_m$：位置 $m$ 处的 query 或 key 向量；$R\_{\\Theta,m}$：按位置 $m$
    对向量成对分量做旋转的矩阵
  - $\\Theta$：各分量对的旋转频率
  - 内积只依赖相对位置 $m-n$，所以 Attention 自然感知相对距离，且便于外推

## 后续模型

  - \[Alpaca\] - 斯坦福 指令跟随微调模型
  - \[Vicuna\] - 对用户分享的对话进行了精细调优的聊天助手
  - \[Koala\] - 对用户分享的对话和开源数据集进行了精细调优的聊天机器人
  - \[Baize\] - 用 ChatGPT 自我对话生成的数据，结合 LoRA 微调（见
    [LoRA](https://github.com/junxnone/aiwiki/issues/406)）
  - \[Luotuo\] - 骆驼，面向中文的 LLaMA 指令微调模型

## Reference

  - 2023.2 [LLaMA: Open and Efficient Foundation Language
    Models](https://arxiv.org/abs/2302.13971)
  - 2023.7 [Llama 2: Open Foundation and Fine-Tuned Chat
    Models](https://readpaper.com/paper/1877177868599782912)
  - [code](https://github.com/facebookresearch/llama)
