-----

| Title     | LM Train MoE                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:35:18Z`                                |
| Updated @ | `2026-11-26T15:35:18Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/828) |

-----

# MoE

混合专家模型 (Mixture of Experts)：用多个前馈「专家」替代一个大 FFN，每个 token 只激活少数专家，让模型的总参数量
(知识容量) 远大于每 token 的计算量。本文讲路由、负载均衡、细粒度与共享专家，以及训练与推理的代价。

## 结构

下图是一个 MoE 层：路由器为每个 token 选出 top-$k$ 个专家，只计算这几个，再按权重加权求和：

``` mermaid
flowchart LR
    X[token 隐藏状态 x] --> R[路由器 Router<br>线性层 + softmax/sigmoid]
    R -->|选 top-k| E1[专家 1 FFN]
    R -->|选 top-k| E3[专家 3 FFN]
    X --> E1
    X --> E3
    X --> S[共享专家<br>所有 token 都经过]
    E1 -->|权重 g1| SUM((+))
    E3 -->|权重 g3| SUM
    S --> SUM
    SUM --> Y[输出 y]
```

图中：

  - 路由器是一个小的线性层，为每个 token 给出对所有 $E$ 个专家的打分，只保留得分最高的 $k$ 个 (图中选了专家 1 和 3)
  - 被选中的专家各自对 $x$ 做一次 FFN 运算，输出按路由权重 $g$ 加权求和；未被选中的专家不计算
  - 共享专家 (DeepSeek 风格) 对所有 token 都计算，负责通用知识，使路由专家可以更专精
  - MoE 层只替换 Transformer block 里的 FFN，注意力部分不变，见
    [Architecture](@@TARCH@@)

$$ \\mathbf y=\\sum\_{i\\in\\mathcal T\_k(\\mathbf x)}g\_i(\\mathbf
x),\\mathrm{FFN}\_i(\\mathbf x),\\qquad g(\\mathbf
x)=\\mathrm{softmax}\\bigl(\\mathrm{TopK}(W\_r\\mathbf x)\\bigr) $$

其中：

  - $\\mathbf x\\in\\mathbb R^d$：token 的隐藏状态；$W\_r\\in\\mathbb
    R^{E\\times d}$：路由器权重，$E$ 为专家数
  - $\\mathcal T\_k(\\mathbf x)$：得分最高的 $k$ 个专家的编号集合；$\\mathrm{TopK}$
    把其余专家的得分置为 $-\\infty$，使 softmax 后它们的权重为 $0$
  - $g\_i(\\mathbf x)$：第 $i$ 个专家的权重，被选中专家的权重之和为 $1$；$\\mathrm{FFN}\_i$：第
    $i$ 个专家 (结构与普通 FFN 相同，见 [Architecture](@@TARCH@@) 中的 SwiGLU)
  - 不同实现的细节不同：有的先 softmax 再取 top-$k$ 并重新归一化，DeepSeek-V3 用 sigmoid 打分
    `[待核实]`

## 参数量与计算量

$$ N\_{total}=N\_{dense}+E\\cdot N\_{expert}\\cdot L\_{moe},\\qquad
N\_{active}=N\_{dense}+k\\cdot N\_{expert}\\cdot L\_{moe} $$

其中：

  - $N\_{dense}$：非专家部分 (注意力、嵌入、共享专家等)
    的参数；$N\_{expert}$：单个专家的参数；$L\_{moe}$：MoE
    层数
  - $N\_{total}$：总参数，决定显存占用；$N\_{active}$：每 token 激活的参数，决定计算量 (每 token 约
    $2N\_{active}$ FLOPs)

| 模型              | 专家数 $E$       | 激活 $k$ | 总参数    | 激活参数   | 比例             |
| --------------- | ------------- | ------ | ------ | ------ | -------------- |
| Mixtral 8x7B    | 8             | 2      | 46.7 B | 12.9 B | $\\approx28%$  |
| DeepSeek-V3     | 256 路由 + 1 共享 | 8      | 671 B  | 37 B   | $\\approx5.5%$ |
| Qwen3-235B-A22B | 128           | 8      | 235 B  | 22 B   | $\\approx9%$   |

表中：数字来自各模型的技术报告 `[待核实]`；`比例`
为激活参数占总参数的比例。趋势是专家越来越多、越来越细，激活比例越来越低：同样的计算量下能装下更多知识。

## 负载均衡

路由器如果总把 token 送给少数几个专家，这些专家过载，其余专家学不到东西 (路由坍缩)，并行计算时还会因为最忙的卡拖慢全局，见
[Parallel](@@IPAR@@)。常用的辅助损失 (Switch Transformer)：

$$ \\mathcal L\_{aux}=\\alpha,E\\sum\_{i=1}^{E}f\_i,P\_i,\\qquad
f\_i=\\frac1T\\sum\_{t=1}^{T}\\mathbb 1\[i\\in\\mathcal T\_k(\\mathbf
x\_t)\],\\quad P\_i=\\frac1T\\sum\_{t=1}^{T}p\_i(\\mathbf x\_t) $$

其中：

  - $T$：一个 batch 中的 token 数；$f\_i$：实际分配给专家 $i$ 的 token 比例；$P\_i$：路由器给专家
    $i$ 的平均概率
  - $\\alpha$：辅助损失的系数 (如 $10^{-2}$ 量级)；乘以 $E$ 使均匀分配时 $\\mathcal
    L\_{aux}=\\alpha$，与专家数无关
  - 当某个专家既被分到很多 token、又得到很高的平均概率时，乘积 $f\_iP\_i$
    大，损失就大，于是梯度会压低它的概率；$f\_i$
    本身不可导，梯度通过 $P\_i$ 回传
  - 其他做法：容量因子 (每个专家最多处理 $C\\cdot T k/E$ 个 token，超出的丢弃或走残差)；DeepSeek-V3
    的无辅助损失方案——给每个专家的得分加一个只用于选择、不参与加权的偏置，根据负载动态调整 `[待核实]`

## 细粒度专家与共享专家

  - 细粒度：把一个大专家拆成 $m$ 个小专家 (参数总量不变)，同时把 $k$ 也乘以
    $m$，组合数大幅增加，专家可以更专精；DeepSeekMoE
    的实验显示同等计算量下效果更好
  - 共享专家：固定让所有 token 都经过一到两个专家，承担通用能力，减少各路由专家之间的知识冗余

## 训练与推理的代价

| 阶段   | 代价                                  | 应对                                                        |
| ---- | ----------------------------------- | --------------------------------------------------------- |
| 训练   | 专家并行需要 all-to-all 通信；负载不均造成等待；路由不稳定 | 专家并行 + 计算通信重叠；负载均衡；路由器用 FP32 计算                           |
| 推理显存 | 必须放下全部专家，显存按总参数算                    | 专家并行、多卡、量化、专家 offload 到 CPU                               |
| 推理速度 | 每 token 计算量小，但 batch 小时每步仍要读很多专家的权重 | 增大 batch 使每个专家处理的 token 变多；小 batch 时 MoE 的带宽优势不如参数量看起来那么大 |

表中：MoE 用显存换计算——训练和大 batch 推理时很划算，但单用户、小 batch 的本地推理中，读取的专家权重随 batch 中
token 的路由分散而增多，优势会打折扣。并行与通信量的估算见 [Parallel](@@IPAR@@) 和
[Distributed](@@TDIST@@)。

## Reference

  - [Outrageously Large Neural Networks: The Sparsely-Gated
    Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538)
  - [Switch Transformers: Scaling to Trillion Parameter
    Models](https://arxiv.org/abs/2101.03961)
  - [Mixtral of Experts](https://arxiv.org/abs/2401.04088)
  - [DeepSeekMoE: Towards Ultimate Expert Specialization in
    Mixture-of-Experts Language
    Models](https://arxiv.org/abs/2401.06066)
  - [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437)
