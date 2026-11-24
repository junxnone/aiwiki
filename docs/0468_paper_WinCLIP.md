---
Title | paper WinCLIP
-- | --
Created @ | `2024-06-13T01:21:32Z`
Updated @| `2026-11-24T08:15:33Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/468)

---
# WinCLIP 零样本异常检测

*   通过使用手动设计的状态词和提示词模板关联异常/正常样本
*   **Compositional Prompt Ensemble** -> `Anomaly Classification`
*   **window-based CLIP** -> `Anomaly Segmentation`
*   **WinCLIP+** -> Few shot

## Arch

*   **CLIP-AC**
    *   基于 OpenCLIP 实现的的二分类异常检测框架
    *   prompts: `normal [o]` / `anomalous [o]`
*   **CPE** - `Compositional prompt ensemble`
    *   **state words**;
        *   `perfect/flawless/unblemished/without faw/without defect/without damage`
        *   `damaged/with flaw/with defect/with damage/...`
    *   **Text Template**
        *   `a cropped photo of the {}`
        *   `a close-up photo of a {}`
        *   `a photo of the {}`
        *   ...
*   CPE 生成的一些列 prompt 的 `text embedding`  进行  `Group Average` 和 `image embedding` 计算相似度生成 AC Score
*   **Window-based**
    *   通过 `sliding window` 生成 mid-scale/small-scale patch
    *   各 patch 分别通过 image encode 生成 window embedding ，组合成 mid/small embedding map
    *   mid/small embedding map 分别和 text embedding&#x20;
*   **Harmonic aggregation**
    *   每个窗口获取一个异常分数，将这个分数分散到所有window 中的 像素
    *   聚合 `overlapping` 处的多个分数, 通过 `armonic averaging` /`加权` 提升分割性能
*   **Multi-scale Aggeration**
    *   为了提升检测的多尺度能力，聚合多尺度的检测结果

![image](https://github.com/junxnone/aiwiki/assets/2216970/9656a871-da52-4cdc-9980-7cb3593a6161)

![image](https://github.com/junxnone/aiwiki/assets/2216970/67a84c22-2995-41b6-8c53-4e8240d762c5)


## anomalib Impl

### Zero-Shot

- 计算  image score, 即 `image_embeddings` 和 `text_embeddings` 的余弦距离，再进行 softmax

<iframe frameborder="0" scrolling="no" style="width:100%; height:142px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fopenvinotoolkit%2Fanomalib%2Fblob%2F56843d2671977d07ad228e6e5d870bf7f240cf59%2Fsrc%2Fanomalib%2Fmodels%2Fimage%2Fwinclip%2Futils.py%23L95-L97&style=agate&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>

- 计算 Pixel Anomaly Map, 即 每个 `window_embeddings` 和 `text_embeddings` 计算余弦距离，并聚合

<iframe frameborder="0" scrolling="no" style="width:100%; height:226px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fopenvinotoolkit%2Fanomalib%2Fblob%2F22caf3badf610641c6b0d4f7ba5d6e1b1e419ce8%2Fsrc%2Fanomalib%2Fmodels%2Fimage%2Fwinclip%2Ftorch_model.py%23L275-L281&style=agate&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>


### Few-Shot

- pixel/image level score 分别 计算 few-shot branch 和 zero-shot 的均值 作为最终值

<iframe frameborder="0" scrolling="no" style="width:100%; height:142px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fopenvinotoolkit%2Fanomalib%2Fblob%2F22caf3badf610641c6b0d4f7ba5d6e1b1e419ce8%2Fsrc%2Fanomalib%2Fmodels%2Fimage%2Fwinclip%2Ftorch_model.py%23L243-L245&style=agate&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>

- Pixel Anomaly Map, 聚合 `patch_embedings`, `window_embeddings` 的余弦相似度

<iframe frameborder="0" scrolling="no" style="width:100%; height:352px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fopenvinotoolkit%2Fanomalib%2Fblob%2F22caf3badf610641c6b0d4f7ba5d6e1b1e419ce8%2Fsrc%2Fanomalib%2Fmodels%2Fimage%2Fwinclip%2Ftorch_model.py%23L304-L316&style=agate&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>




## 流程图

下图是 WinCLIP 的整体流程，零样本和少样本共用大部分模块：

```mermaid
graph TD
    P["文本提示<br/>状态词 x 模板"] --> TE["文本编码器<br/>normal 与 anomalous 文本嵌入"]
    I["输入图像"] --> IE["图像编码器<br/>整图嵌入"]
    I --> W["多尺度滑动窗口<br/>窗口嵌入"]
    TE --> S1["余弦相似度 + softmax<br/>图像级异常分"]
    IE --> S1
    TE --> S2["窗口与文本相似度<br/>谐波平均聚合 得到像素级异常图"]
    W --> S2
    R["k 张正常参考图<br/>窗口嵌入库"] --> S3["少样本关联分数<br/>最近邻余弦距离"]
    W --> S3
    S1 --> F["最终分数<br/>零样本与少样本取平均"]
    S2 --> F
    S3 --> F
```

图中：

- 左上是**文本分支**：用「状态词 × 模板」组合出大量描述正常和异常的句子，通过文本编码器得到文本嵌入，再按「正常」「异常」两组各自取平均
- **图像级分数**：整图的图像嵌入与两组文本嵌入计算余弦相似度，经 softmax 得到异常概率
- **像素级异常图**：用多尺度滑动窗口截取局部区域，每个窗口得到一个异常分数并分散到窗口内的像素，用谐波平均聚合重叠区域和不同尺度
- **少样本分支**：保存 $k$ 张正常参考图的窗口嵌入，测试窗口与它们做最近邻余弦距离，再与零样本分数取平均

## 公式

$$
s_{img} = \frac{\exp\big(\cos(f_I,\, t_{a}) / \tau\big)}{\exp\big(\cos(f_I,\, t_{n}) / \tau\big) + \exp\big(\cos(f_I,\, t_{a}) / \tau\big)}
$$

$$
S(p) = \Big(\sum_{m \in M(p)}\frac{1}{s_m}\Big)^{-1} \cdot \lvert M(p) \rvert \quad \text{（谐波平均）}
$$

其中：

- $f_I$：图像（或窗口）嵌入；$t_n$：「正常」文本嵌入（由所有正常提示的嵌入取平均并归一化得到）；$t_a$：「异常」文本嵌入
- $\cos(\cdot,\cdot)$：余弦相似度；$\tau$：温度系数（CLIP 的 logit scale 的倒数）；$s_{img} \in (0, 1)$：图像为异常的概率，$t_a$ 越相似分数越高
- $p$：像素位置；$M(p)$：覆盖像素 $p$ 的所有窗口（包括各个尺度）的集合；$s_m$：窗口 $m$ 的异常分数；$\lvert M(p) \rvert$：窗口个数
- 谐波平均：对分数的倒数取平均再取倒数，只要有一个窗口分数很低，结果就会被明显拉低，用于**抑制偶然的高分误报**，只有多个窗口都认为异常的像素才会得到高分

## 使用与评估

WinCLIP 是零样本方法，不需要训练：

```bash
# 零样本
anomalib test --model WinClip --data MVTecAD
# 1 张正常参考图的少样本
anomalib test --model WinClip --model.k_shot 1 --data MVTecAD
```

Parameter | 类型 | 含义 | 默认值
-- | -- | -- | --
`class_name` | str | 提示词里使用的类别名；不填则用数据集的类别名，没有则用 `object` | `null`
`k_shot` | int | 少样本模式下用的正常参考图数量，0 表示零样本 | `0`
`scales` | tuple | 多尺度窗口的尺度，每个整数为窗口大小（以 patch 个数计） | `[2, 3]`

表中是 anomalib 里 WinCLIP 的三个参数：`class_name` 会直接写进提示词，物体名称与实际对象越贴切，零样本效果越好；`scales` 决定能检测的缺陷尺寸范围。anomalib 的 README 里 WinCLIP 的 benchmark 一栏写的是「Coming soon」，暂时没有官方数值，可参考论文报告的结果。

## 优缺点

- **优点**
  - 零样本：不需要任何训练数据，只给出物体名称即可检测，适合新产品冷启动
  - 少样本时只需几张正常图像，效果显著提升
  - 同时输出图像级分类和像素级分割
- **缺点**
  - 依赖 CLIP 对该类别和缺陷语义的理解，对 CLIP 没见过的工业物体或细微缺陷效果有限
  - 提示词的设计对结果影响大，需要手工选择状态词和模板
  - 滑动窗口多尺度推理，计算量比单次前向大；定位精度受窗口粒度限制

## Reference
- [深度学习论文: WinCLIP: Zero-/Few-Shot Anomaly Classification and Segmentation](https://blog.csdn.net/shanglianlm/article/details/132432407)

