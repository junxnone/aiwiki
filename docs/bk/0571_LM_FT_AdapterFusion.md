-----

| Title     | LM FT AdapterFusion                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-20T08:03:05Z`                                |
| Updated @ | `2026-10-20T08:03:05Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/571) |

-----

# AdapterFusion

> 本文是 [大模型微调总览](0410_LM_FT) 的深入篇，专门展开 AdapterFusion——从 [经典
> Adapter](0412_LM_FT_Adapter) 拆分出来的后续工作，解决"怎么复用多个已经训好的任务 Adapter"这个问题。

## 要解决的问题

[经典 Adapter](0412_LM_FT_Adapter)
一个任务训一个独立模块，任务之间互不相干——这样做能避免任务间互相干扰，但也意味着没法利用相关任务之间可能存在的共性知识。直接的替代方案（顺序微调、多任务联合训练）又会带来新的问题：顺序微调容易灾难性遗忘前面任务学到的东西；多任务联合训练需要精细平衡各任务的数据量和学习难度，稍有不慎某个任务就会被其他任务"吃掉"。

## 两阶段设计

AdapterFusion（Pfeiffer et al. 2021）用两阶段把"学习"和"组合"彻底分开：

1.  **知识提取（Knowledge Extraction）**：按经典 Adapter 的方式，给每个任务各自独立训练一个
    Adapter——这一步和任务数量无关，每个 Adapter 互不干扰，不会发生灾难性遗忘；
2.  **知识组合（Knowledge Composition）**：冻结所有已经训练好的任务
    Adapter，新增一个小型的、类似注意力机制的 Fusion
    层，学习针对当前新任务，该如何对多个已有 Adapter 的输出做加权组合——Fusion 层会给每个 Adapter
    的输出算一个注意力权重，再加权求和，作为最终输出。

这种"先分别学、再学怎么组合"的设计是**非破坏性**的（Non-Destructive）：融合新任务时，Fusion
层的训练完全不会改变任何一个已有任务 Adapter
的参数，新任务学到的只是"怎么混合利用已有知识"，这比直接多任务联合训练或顺序微调更能缓解灾难性遗忘和任务间数据不均衡的问题。

## 和 AdapterHub 生态

AdapterHub（配套的开源生态系统）提供了大量预训练好的任务 Adapter，可以直接拿来做 AdapterFusion
组合，不需要每个任务都从头训练——这也是 AdapterFusion
这套方法论能真正落地的关键：有了一个共享的
Adapter"仓库"，新任务可以直接复用别人已经练好的知识模块，只训练自己的 Fusion 层。

## 代码示例（Hugging Face `adapters` 库）

``` python
from adapters import AdapterConfig, AutoAdapterModel

model = AutoAdapterModel.from_pretrained("bert-base-uncased")

# 第一阶段：加载/训练多个任务各自的 Adapter（这里假设已经训练好，直接加载）
model.load_adapter("sentiment", config=AdapterConfig.load("pfeiffer"))
model.load_adapter("nli", config=AdapterConfig.load("pfeiffer"))

# 第二阶段：组合多个 Adapter，只训练新增的 Fusion 层
from adapters.composition import Fuse
model.add_adapter_fusion(Fuse("sentiment", "nli"))
model.train_adapter_fusion(Fuse("sentiment", "nli"))
```

## Reference

  - Pfeiffer, J. et al. (2021). AdapterFusion: Non-Destructive Task
    Composition for Transfer Learning.
    [arXiv:2005.00247](https://arxiv.org/abs/2005.00247)
  - [AdapterHub](https://adapterhub.ml/)
  - [Adapter Activation and Composition - AdapterHub
    文档](https://docs.adapterhub.ml/adapter_composition.html)
  - [经典 Adapter](0412_LM_FT_Adapter)
  - [大模型微调总览](0410_LM_FT)
