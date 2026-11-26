-----

| Title     | ML AutoML NAS SearchSpace                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-07-17T06:25:15Z`                                |
| Updated @ | `2026-11-26T09:28:24Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/392) |

-----

# Search Space

搜索空间定义了 NAS 能搜到哪些网络结构：空间越大，可能找到更好的结构，但搜索也越困难。设计搜索空间时要在表达能力和搜索难度之间折中。

| Search Space     | Description                                          |
| ---------------- | ---------------------------------------------------- |
| Entire Structure | 完整的网络结构，每层的结构从 search space 中选择，`skip-connection` 可选 |
| Cell-Based       | 先搜索表现好的 `Cell`, 再堆叠 `Cell`                           |
| Hierarchical 分层  | 增加 `Cell` 的多样性                                       |
| Morphism Based   | 在深度宽度等可变操作上扩展现有模型                                    |

表中：

  - **Cell**：网络中可重复的小结构单元；**skip-connection**：跳连
  - 对比结论：从 Entire Structure 到 Cell-Based，搜索空间依次缩小，搜索更容易，但结构的多样性也受限

## 空间大小

若一个链式结构有 $L$ 层，每层可选 $|O|$ 种操作，则：

$$ |\\mathcal{S}|=|O|^{L} $$

其中：$|\\mathcal{S}|$ 为搜索空间中候选结构总数；$L$ 为层数；$|O|$ 为每层的候选操作数（如 3×3 卷积、5×5
卷积、池化等）。空间随层数指数增长，所以完整结构搜索代价很大。

Cell-Based 只需搜索一个或少数几个 Cell 的内部连接（设 Cell 内共有 $E$ 个待选连接，则
$|\\mathcal{S}\_{cell}|=|O|^{E}$），再把 Cell 堆叠成整个网络，空间显著缩小。

## Entire & Cell

| Search Space | Entire-Structured                                            | Cell-Based                                                   |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Figure       | ![image](media/7c90a8b972d100a6c3a2cc302487323fc75820d9.png) | ![image](media/abcd5de73a63744d082664d3583a1b55eab7546e.png) |
| 优缺点          | 耗时                                                           | 特征图的大小和通道数变化固定                                               |

表中：

  - **Figure**：两种空间的结构示意图（原文档附带）；**优缺点**：搜索耗时与结构约束
  - Entire-Structured：自由度高，但搜索耗时；Cell-Based：特征图大小和通道数的变化是固定的，搜索快但受限

## Hierarchical & Morphism

| Search Space | Hierarchical (Progressive?)                                                                                                   | Morphism based                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Figure       | ![image](media/5111e4a441b87d2d924505108dd5183914c087ae.png) <br>![image](media/71ca981c274ff700a9ce6cba77411356750e84c4.png) | ![image](media/006d31435d4b1ff2db4c33c89609cb5a7cd8556e.png) |

表中：左列为分层空间的示意图，右列为基于形态变换（Morphism）空间的示意图；它们对应上表中的两种设计：分层空间增加 Cell
的多样性，Morphism 空间在已有模型基础上通过加深、加宽等变换扩展。

## chain & multi-branch

| chain-structured neural networks                             | multi-branch networks                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/b3ac9fa8b8bc0a5b12639c72c6a6a7c787037c40.png) | ![image](media/03b6551e7ed58a833fa12342ae3f415aba5ce165.png) |

表中：

  - 左为链式结构网络（层与层依次串联），右为多分支网络（含跳连、并行分支）
  - 对比结论：多分支结构的表达能力更强，但搜索空间更大

评价搜索方法见 [NAS Metrics](https://github.com/junxnone/aiwiki/issues/394)。
