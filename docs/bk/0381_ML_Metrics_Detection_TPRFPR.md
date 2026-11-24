-----

| Title     | ML Metrics Detection TPRFPR                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-02-16T15:17:13Z`                                |
| Updated @ | `2026-11-24T00:58:30Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/381) |

-----

# TPR & FPR

  - $TPR = \\frac{TP}{TP+FN}$
  - $FPR = \\frac{FP}{FP+TN}$

> @ PASCAL VOC 2005

其中：

  - $TP$：正确检测的目标数；$FN$：漏检的目标数，$TP+FN$ 即 GT 总数
  - $FP$：误检数；$TN$：真阴性数，$FP+TN$ 即负样本总数
  - $TPR$：`True Positive Rate`，真正率，等同于 Recall（也叫 Sensitivity）
  - $FPR$：`False Positive Rate`，假正率，$FPR = 1 - \\text{Specificity}$

## 在检测中的使用

  - 改变 `confidence 阈值` 得到一系列 $(FPR, TPR)$ 点，连接成 `ROC Curve`，曲线下面积为
    `AUC`，早期 PASCAL VOC 2005 以此评估检测器
  - **检测任务中 TN 没有明确定义**：背景区域（可以出现的候选框）数量几乎无穷，$FPR$ 的分母无法确定，所以后来的 VOC
    2007 起改用 `Precision-Recall` 和
    [AP](/0382_ML_Metrics_Detection_APmAPAR)
  - 实际工程中常用替代指标：
      - **FPPI** (False Positives Per Image)：平均每张图片的误检数 $FPPI =
        \\frac{FP}{N\_{images}}$，分母是图片数，因此有明确定义
      - **FROC** (Free-response ROC)：横轴 FPPI，纵轴
        TPR(Recall)，医学影像检测（病灶）常用，如「在每张图 1
        个误检时，Recall 为多少」
      - 其中 $N\_{images}$ 是测试图片总数

## ROC vs PR

| Name     | ROC (TPR vs FPR) | PR (Precision vs Recall) |
| -------- | ---------------- | ------------------------ |
| 是否依赖负样本数 | 依赖（FPR 分母）       | 不依赖，只看预测为正的样本            |
| 正负样本极不均衡 | 曲线容易偏乐观          | 更能反映真实表现                 |
| 适用       | 分类任务；正负比例大致均衡    | 检测、异常检测等负样本极多的任务         |

表中比较了两条曲线的特点：检测任务的负样本（背景）远多于正样本，所以检测评估以 PR/AP 为主，ROC 更适合分类任务，见 [Metrics
for Classification](/0137_ML_Metrics_Classification)。
