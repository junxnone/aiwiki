-----

| Title     | KnowledgeGraph                                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2022-12-16T14:07:10Z`                                |
| Updated @ | `2026-11-26T10:18:16Z`                                |
| Labels    | `index`                                               |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/329) |

-----

# Knowledge Graph

知识图谱（Knowledge Graph）用「实体 + 关系」的图结构表示知识，基本单位是三元组 $(h,r,t)$：头实体 $h$、关系
$r$、尾实体 $t$，例如（北京，是首都，中国）。

``` mermaid
flowchart LR
    A[原始文本和数据] --> B[知识抽取 实体 关系]
    B --> C[知识融合 消歧 对齐]
    C --> D[知识存储 图数据库]
    D --> E[知识推理和应用 问答 推荐]
```

图中：从左到右是构建知识图谱的典型流程：先从文本中抽取实体与关系，再合并重复和歧义的实体，存入图数据库，最后用于推理与应用。

## 知识图谱嵌入

把实体和关系映射成向量，便于推理和补全缺失的三元组。TransE 的思想是：头实体向量加关系向量应该接近尾实体向量：

$$ f\_r(h,t)=\\lVert\\mathbf{h}+\\mathbf{r}-\\mathbf{t}\\rVert $$

其中：

  - $\\mathbf{h},\\mathbf{r},\\mathbf{t}$：头实体、关系、尾实体的向量
  - $f\_r(h,t)$：三元组的「不合理程度」，越小说明三元组越可能成立
  - 训练时让真实三元组的 $f$ 小，随机替换实体得到的负例的 $f$ 大

## 常用技术

| 环节 | 技术                                                                  |
| -- | ------------------------------------------------------------------- |
| 存储 | 图数据库（如 Neo4j）、三元组库                                                  |
| 抽取 | 命名实体识别、关系抽取，现在多用大模型                                                 |
| 推理 | 图嵌入、规则推理、图神经网络                                                      |
| 问答 | 基于知识图谱的问答，与 [RAG](https://github.com/junxnone/aiwiki/issues/461) 结合 |

表中：对比结论：知识图谱适合关系明确、需要可解释推理的场景；与大模型结合可以降低幻觉。

## Reference

  - [awesome-knowledge-graph](https://github.com/husthuke/awesome-knowledge-graph)
  - [Knowledge Graphs](https://github.com/shaoxiongji/knowledge-graphs)
  - [Deep learning for
    Knowledge-Graph](https://github.com/lihanghang/NLP-Knowledge-Graph)
  - [3D Force-Directed
    Graph](https://github.com/vasturiano/3d-force-graph)
