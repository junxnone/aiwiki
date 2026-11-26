-----

| Title     | ML Tasks Image Retrieval ArcFace                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T01:29:44Z`                                |
| Updated @ | `2026-11-26T01:29:44Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/807) |

-----

# ArcFace

ArcFace (Additive Angular Margin Loss，CVPR
2019)：在归一化后的特征与权重的角度上加一个固定的间隔，使类内更紧凑、类间更分开，是人脸识别和很多检索任务的主流损失。

## 从 Softmax 到角度间隔

普通 softmax 分类的 logit 为 $\\mathbf W\_j^\\top\\mathbf x+b\_j=|\\mathbf
W\_j||\\mathbf x|\\cos\\theta\_j+b\_j$。对于检索，只关心特征方向，所以做归一化后只保留角度：

$$ |\\mathbf W\_j|=1,\\quad |\\mathbf x|=s,\\quad b\_j=0\\
\\Longrightarrow\\ \\text{logit}\_j=s\\cos\\theta\_j $$

其中：

  - $\\mathbf x$：样本的嵌入特征，$\\mathbf W\_j$：第 $j$ 类的权重向量
    (可以看作该类的中心方向)；$\\theta\_j$：二者之间的夹角
  - $s$：缩放因子 (超球面半径)，归一化后 $\\cos\\theta\\in\[-1,1\]$ 太小，乘 $s$ 使 softmax
    有足够大的梯度；论文取 $s=64$

在此基础上，对真实类别的角度加间隔 $m$：

$$
L=-\\frac1N\\sum\_{i=1}^{N}\\log\\frac{e^{s\\cos(\\theta\_{y\_i}+m)}}{e^{s\\cos(\\theta\_{y\_i}+m)}+\\sum\_{j\\ne
y\_i}e^{s\\cos\\theta\_j}} $$

其中：

  - $N$：batch 大小；$y\_i$：样本 $i$ 的真实类别；$\\theta\_{y\_i}$：特征与真实类别权重之间的夹角
  - $m$：加性角度间隔，论文取 $0.5$ 弧度 (约 $28.6^\\circ$)；$\\cos(\\theta+m)$ 比
    $\\cos\\theta$ 更小，所以真实类别的得分被「压低」，网络必须把 $\\theta\_{y\_i}$
    做得更小才能保持分类正确，从而使类内更紧、类间的间隔至少为 $m$
  - 间隔加在角度上，在超球面上有清晰的几何意义：对应测地线距离的间隔，而在余弦上加间隔 (CosFace) 的几何意义不均匀

## 几何直观

``` mermaid
flowchart LR
    A[Softmax<br>决策边界不留间隔] --> B[SphereFace<br>乘性角度间隔 mθ]
    A --> C[CosFace<br>余弦间隔 cosθ − m]
    A --> D[ArcFace<br>加性角度间隔 cos θ+m]
```

图中：三种方法都是在 softmax 的基础上加间隔，加的位置不同：SphereFace 把角度乘以 $m$，决策边界随 $\\theta$
变化不稳定且难以训练；CosFace 在余弦值上减 $m$；ArcFace 在角度上加 $m$，边界在角度上是均匀的，训练更稳定。

| 方法         | 目标 logit (真实类)      | 取值       |
| ---------- | ------------------- | -------- |
| Softmax    | $s\\cos\\theta$     | \-       |
| SphereFace | $s\\cos(m\\theta)$  | $m=4$ 左右 |
| CosFace    | $s(\\cos\\theta-m)$ | $m=0.35$ |
| ArcFace    | $s\\cos(\\theta+m)$ | $m=0.5$  |

表中：三种间隔损失都需要先对特征和权重做 $L\_2$ 归一化；ArcFace 的 $\\theta+m$ 要保证不超过 $\\pi$，实现时当
$\\theta+m\>\\pi$ 时改用 $\\cos\\theta-m\\sin m$ 的线性近似，避免余弦不单调。

## 实现要点

``` python
import torch, torch.nn.functional as F, math
def arcface_logits(x, W, y, s=64.0, m=0.5):
    cos = F.linear(F.normalize(x), F.normalize(W))               # (N, C), cos θ_j
    theta = torch.acos(cos.clamp(-1 + 1e-7, 1 - 1e-7))
    target = torch.cos(theta.gather(1, y[:, None]) + m)          # cos(θ_y + m)
    logits = cos.scatter(1, y[:, None], target)                   # 只替换真实类别
    return s * logits                                             # 之后接 cross_entropy
```

  - 只替换真实类别的 logit，其余类别仍是 $s\\cos\\theta\_j$，然后用普通的交叉熵训练
  - 训练好之后只保留嵌入网络，权重 $\\mathbf W$ 只用于训练；检索或验证时用 $\\cos$ 相似度比较两个特征，见
    [Retrieval](/0278_ML_Tasks_Image_Retrieval)

## 与 Triplet 的对比

| 维度     | [Triplet](/0156_ML_Tasks_Image_Retrieval_CBIR_TripletNetwork) | ArcFace                                              |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------- |
| 输入     | 三元组                                                           | 单个样本 + 类别标签                                          |
| 是否需要挖掘 | 需要难例挖掘                                                        | 不需要，每个样本都与所有类别中心比较                                   |
| 训练稳定性  | 较差，收敛慢                                                        | 较好                                                   |
| 类别数很大时 | 无影响                                                           | 最后的分类层 ($d\\times C$) 变得很大，显存占用大 (可用 Partial FC 等缓解) |
| 适用     | 无类别标签、只有相似关系                                                  | 有类别标签                                                |

表中：ArcFace 需要类别标签，且类别数不能太大；没有类别标签时用对比学习或三元组损失。

## Reference

  - [ArcFace: Additive Angular Margin Loss for Deep Face
    Recognition](https://arxiv.org/abs/1801.07698)
  - [CosFace: Large Margin Cosine Loss for Deep Face
    Recognition](https://arxiv.org/abs/1801.09414)
  - [SphereFace: Deep Hypersphere Embedding for Face
    Recognition](https://arxiv.org/abs/1704.08063)
