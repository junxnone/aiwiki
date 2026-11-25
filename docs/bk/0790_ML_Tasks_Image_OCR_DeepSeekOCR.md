-----

| Title     | ML Tasks Image OCR DeepSeekOCR                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:29:24Z`                                |
| Updated @ | `2026-11-25T16:29:24Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/790) |

-----

# DeepSeek-OCR

DeepSeek-OCR（DeepSeek-AI，2025-10，论文 *DeepSeek-OCR: Contexts Optical
Compression*）把 OCR 当作一次"**上下文光学压缩**"的实验：一页文字用文本 token
表示可能要上千个，但把它渲染成图片、用视觉编码器压成几百个甚至几十个视觉
token，解码器仍然能把原文还原出来。这既是一个可用的文档解析模型，也在回答一个更大的问题——能不能用视觉 token 当作 LLM
长上下文的压缩介质。它属于 [OCR](0200_ML_Tasks_Image_OCR) 里"OCR-free /
视觉语言模型"路线，思路上承接
[Donut](0781_ML_Tasks_Image_OCR_Donut)、[TrOCR](0780_ML_Tasks_Image_OCR_TrOCR)
这类"图像直接生成文本"的工作。

## 结构

下图展示整体由 DeepEncoder 与 MoE 解码器两部分组成，以及视觉 token 数量在其中的变化（以 $1024 \\times
1024$ 输入为例）：

``` mermaid
flowchart LR
    I["文档图像<br/>1024 × 1024"] --> SAM["SAM-base (~80M)<br/>窗口注意力, patch 16<br/>→ 4096 个 token"]
    SAM --> CONV["16× 卷积压缩器<br/>2 层 conv, k=3, s=2<br/>→ 256 个 token"]
    CONV --> CLIP["CLIP-large (~300M)<br/>全局注意力"]
    CLIP --> V["视觉 token (256)"]
    V --> DEC["DeepSeek-3B-MoE 解码器<br/>激活参数约 570M"]
    PR["文本提示<br/>如 转 Markdown"] --> DEC
    DEC --> OUT["Markdown / 文本 / 图表 HTML 表格 ..."]
```

图中：

  - **DeepEncoder**（合计约 380M 参数）由三部分串联：前端 SAM-base 做以窗口注意力为主的感知，处理大量
    patch token 时显存开销低；中间是 $16\\times$ 卷积压缩器；后端 CLIP-large 去掉了原来的 patch
    embedding 层，改为在压缩后的少量 token 上做全局注意力、承载"知识"。
  - **压缩器**：两层卷积（卷积核 3、步长 2、通道数由 256 增到 1024），把 token 数压缩 16 倍；例如 $1024
    \\times 1024$ 图像先被切成 $64 \\times 64 = 4096$ 个 patch，压缩后只剩 256 个视觉
    token 进入全局注意力，所以"高分辨率输入"和"低激活、少 token"可以同时满足。
  - **解码器**：DeepSeek-3B-MoE，每次推理从 64 个路由专家里激活 6 个、再加 2 个共享专家，激活参数约
    570M——拥有 3B 模型的表达力，推理成本接近 500M 的小模型。
  - **文本提示**：通过不同 prompt 控制输出形式（纯文本、带版面的 Markdown、是否输出检测框、解析图表等）。
  - 关键结论：先用窗口注意力处理高分辨率细节，再压缩，最后才做代价昂贵的全局注意力，是它做到"又清楚、又省 token"的原因。

## 压缩比与精度

定义压缩比为"真值文本 token 数 ÷ 模型使用的视觉 token 数"：

$$ r = \\frac{N\_{\\text{text}}}{N\_{\\text{vision}}} $$

其中：

  - $r$：压缩比，$r=10$ 表示 1 个视觉 token 平均承载 10 个文本 token
  - $N\_{\\text{text}}$：把真值文本用 DeepSeek-OCR 自己的分词器切分后的 token 数
  - $N\_{\\text{vision}}$：DeepEncoder 输出的视觉 token 数，由输入分辨率模式决定

论文在 Fox 基准（选取 600–1300 文本 token 的英文文档）上测得：

| 压缩比 $r$   | OCR 解码精度                  |
| --------- | ------------------------- |
| 约 9–10 倍  | 96% 以上（摘要：$r\<10$ 时约 97%） |
| 约 10–12 倍 | 约 90%                     |
| 约 20 倍    | 约 60%                     |

表中第一列是文本 token 与视觉 token 的数量比，第二列是还原文本的精度。结论：压缩到 10 倍以内几乎无损，超过 10
倍后精度快速下降，到 20 倍时仍有约 60%。作者据此设想：对 LLM
的历史上下文可以"越旧越模糊"，用越低分辨率（越少
token）保存，类似人类遗忘机制。这是论文的展望，不是已经验证的结论。

## 分辨率模式

为了测试不同压缩比并适配实际使用，模型在训练时同时支持多种输入模式：

| 模式            | 输入分辨率                                                    | 视觉 token 数            |
| ------------- | -------------------------------------------------------- | --------------------- |
| Tiny          | $512 \\times 512$                                        | 64                    |
| Small         | $640 \\times 640$                                        | 100                   |
| Base          | $1024 \\times 1024$                                      | 256                   |
| Large         | $1280 \\times 1280$                                      | 400                   |
| Gundam        | $n$ 个 $640 \\times 640$ 局部块 + 一个 $1024 \\times 1024$ 全局图 | $n \\times 100 + 256$ |
| Gundam-Master | $1024 \\times 1024$ 局部块 + $1280 \\times 1280$ 全局图        | 更多                    |

表中前四行是"原生分辨率"模式，图像直接缩放到固定尺寸；Tiny、Small 直接缩放不保持宽高比，避免浪费
token。后两行是"动态分辨率"，把超大图（如报纸）切成若干局部块并配一张全局缩略图，适合超高分辨率输入；Gundam-Master
是在训练好的模型上继续训练得到的，主要出于负载均衡。平均每页使用的视觉 token 越少，成本越低，这也是它在 OmniDocBench
上与其他端到端模型对比时的主要卖点。

## 训练数据

  - 文档（OCR 1.0）：约 3000 万页 PDF，覆盖约 100 种语言，其中中英文约 2500 万页，其余约 500
    万页；分粗标注和细标注两类。
  - 自然场景 OCR：中英文各约 1000 万样本，来自 LAION 和悟空数据集，用 PaddleOCR 标注。
  - OCR 2.0：图表（渲染 1000 万张，解析为 HTML 表格）、化学式（转 SMILES）、平面几何，沿用 GOT-OCR2.0
    的叫法。
  - 通用视觉与纯文本：用于保留一定的通用能力和语言能力。总体比例大致为 OCR 70%、通用视觉 20%、纯文本 10%，序列长度
    8192。
  - 训练分两阶段：先单独训练 DeepEncoder（用小语言模型做下一 token 预测），再训练完整模型。

## 特点与局限

  - 优点：高分辨率下 token 很少，吞吐高——论文称生产环境用 20 个节点（每节点 8 张 A100-40G）每天可生成约 3300
    万页训练数据（折算每张 GPU 每天约 20 万页）；输出为 Markdown 等结构化文本，可解析图表、化学式。
  - 局限：
      - 论文自己定位为"初步探索"，不是通用 VLM；
      - 压缩比超过 10 倍后精度明显下降，OCR 精度不等于真正的"上下文记忆"能力，用作 LLM 长上下文压缩仍需更多验证；
      - 自回归生成仍有幻觉和漏字风险。
  - 与 PaddleOCR 系列的取舍：PP-OCRv5 这类轻量模型参数量不足 1 亿，适合边缘和高吞吐；DeepSeek-OCR 这类
    VLM 在复杂版面、公式、图表上更强，但资源开销更大。

## Reference

  - [paper - 2025 - DeepSeek-OCR: Contexts Optical
    Compression](https://arxiv.org/abs/2510.18234)
  - [DeepSeek-OCR - Hugging
    Face](https://huggingface.co/collections/deepseek-ai/deepseek-ocr)
  - [deepseek-ai/DeepSeek-OCR -
    Github](https://github.com/deepseek-ai/DeepSeek-OCR)
  - [Fox benchmark](https://github.com/ucaslcl/Fox)
  - [OmniDocBench](https://github.com/opendatalab/OmniDocBench)
