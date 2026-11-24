-----

| Title     | ML Metrics Retrieval                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T01:03:50Z`                                |
| Updated @ | `2026-11-24T01:03:50Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/712) |

-----

# Retrieval

  - 检索（Retrieval）给定一个 Query，从 Gallery 中按相似度返回一个**排序列表**，Metrics
    评估这个排序列表的质量
  - 用于图像检索、以图搜图、行人/车辆重识别（ReID）、人脸识别（1:N）、推荐系统、RAG 的召回
  - 相似度/距离的计算见 [Pairwise](/0139_ML_Metrics_Pairwise)，训练方法见
    [MetricLearning](/0157_ML_Tasks_MetricLearning)，总览见
    [Metrics](/0138_ML_Metrics)

## Metrics

| Name                  | Formula                                                                  | Description                       |
| --------------------- | ------------------------------------------------------------------------ | --------------------------------- |
| Recall@K / Hit Rate@K | $\\frac{1}{Q}\\sum\_{q}1\\big(\\text{前 } K \\text{ 个结果中至少有 1 个相关}\\big)$ | 前 K 个里有没有命中，Rank-1/Rank-5 即 K=1/5 |
| Precision@K           | $\\frac{\\lvert \\text{前 } K \\text{ 个中相关的} \\rvert}{K}$                 | 前 K 个结果里相关的比例                     |
| mAP                   | $\\frac{1}{Q}\\sum\_{q=1}^{Q}AP\_q$                                      | 每个 Query 的 AP 平均，考虑所有相关结果的排名      |
| MRR                   | $\\frac{1}{Q}\\sum\_{q=1}^{Q}\\frac{1}{rank\_q}$                         | 第一个相关结果的排名倒数的平均                   |
| NDCG@K                | $\\frac{DCG@K}{IDCG@K}$                                                  | 支持多级相关度，越靠前的结果权重越大                |

其中：

  - $Q$：Query 总数；$q$：第 $q$ 个 Query；$K$：只看排名前 $K$ 的结果
  - $1(\\cdot)$：指示函数，条件成立为 1，否则为 0
  - $rank\_q$：Query $q$ 的第一个相关结果在排序列表中的位置（从 1 开始）
  - $AP\_q$：Query $q$ 的 Average Precision，$AP\_q =
    \\frac{1}{R\_q}\\sum\_{k=1}^{N} P\_q(k)\\cdot rel\_q(k)$；$R\_q$
    为相关结果总数，$N$ 为列表长度，$rel\_q(k)\\in{0,1}$ 表示第 $k$
    个结果是否相关，$P\_q(k)$ 为前 $k$ 个结果的 Precision

## NDCG

$$ DCG@K = \\sum\_{i=1}^{K}\\frac{2^{rel\_i} - 1}{\\log\_2(i+1)},
\\qquad NDCG@K = \\frac{DCG@K}{IDCG@K} $$

其中：

  - $rel\_i$：排在第 $i$ 位的结果的相关度（可以是 0/1，也可以是多级评分，如 0\~3）
  - $\\log\_2(i+1)$：位置折扣，排名越靠后贡献越小
  - $IDCG@K$：理想排序（所有结果按相关度降序）下的 $DCG@K$，用来归一化，因此 $NDCG@K \\in \[0,
    1\]$，1 表示排序完美

## CMC 与 ReID

  - **CMC** - `Cumulative Matching Characteristic`，Rank-$k$ 命中率随 $k$
    变化的曲线，Rank-1 就是 Top-1 准确率
  - ReID 常同时报告 `Rank-1` 和 `mAP`：Rank-1 只看第一个命中，mAP 要求所有同 ID 的图都排得靠前
  - ReID 评估时要排除与 Query 同摄像头的同 ID 样本，避免信息泄漏

## 人脸识别（Verification / Identification）

  - **1:1 Verification**：判断两张脸是否同一人，用
    $\\text{TAR}@\\text{FAR}$（FAR=1e-3/1e-4 时的通过率）和 ROC，见 [TPR &
    FPR](/0381_ML_Metrics_Detection_TPRFPR)
  - **1:N Identification**：在库中找人，用 Rank-1 / Rank-K，开集场景还要看误识别率

## 选择建议

| Scenario         | 推荐                  |
| ---------------- | ------------------- |
| 只关心「有没有找到」       | Recall@K / Hit Rate |
| 只有一个正确答案         | Rank-1、MRR          |
| 每个 Query 有多个相关结果 | mAP、Recall@K        |
| 相关度分多级           | NDCG@K              |
| 列表长度有限，用户只看前 K 个 | Precision@K、NDCG@K  |

表中按场景给出指标：K 的取值要与实际展示/召回数量一致；RAG 召回关注 Recall@K（不能漏掉相关文档），重排之后关注
NDCG/MRR。

## Code

``` python
import numpy as np

def retrieval_metrics(sim, q_ids, g_ids, ks=(1, 5, 10)):
    # sim: (Q, G) 相似度, q_ids: (Q,), g_ids: (G,)
    order = np.argsort(-sim, axis=1)                      # 每个 Query 的排序
    matches = (g_ids[order] == q_ids[:, None])            # (Q, G) 是否相关
    res = {f"R@{k}": matches[:, :k].any(1).mean() for k in ks}
    first = matches.argmax(1) + 1                         # 第一个相关结果的排名
    res["MRR"] = (1.0 / first).mean()
    cum = matches.cumsum(1)
    prec = cum / np.arange(1, matches.shape[1] + 1)
    ap = (prec * matches).sum(1) / np.maximum(matches.sum(1), 1)
    res["mAP"] = ap.mean()
    return res
```

## Reference

  - \[Evaluation measures (information retrieval) -
    Wikipedia\](<https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval%29)>
  - [Deep Learning for Person Re-identification: A Survey and
    Outlook](https://arxiv.org/abs/2001.04193)
