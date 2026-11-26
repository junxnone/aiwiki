-----

| Title     | LM Deploy MultiModal                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:40:43Z`                                |
| Updated @ | `2026-11-26T15:40:43Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/853) |

-----

# MultiModal

多模态大模型 (VLM) 的部署：图像怎样变成 token，图像 token
数与分辨率的关系，视觉编码器带来的额外开销，以及显存和延迟的估算。VLM
的概念见 [VLM](/0506_LM_VLM)。

## 推理流程

下图是一个典型 VLM (视觉编码器 + 投影层 + 语言模型) 处理一张图加一句话的过程：

``` mermaid
flowchart LR
    I[图像] --> P[预处理<br>缩放/切块/归一化]
    P --> V[视觉编码器<br>ViT]
    V --> J[投影层<br>映射到 LLM 的嵌入空间]
    T[文本] --> E[分词 + 嵌入]
    J --> M[拼接成一个序列<br>图像 token + 文本 token]
    E --> M
    M --> L[语言模型<br>prefill + decode]
    L --> O[文本输出]
```

图中：

  - 图像先经过预处理 (CPU 上完成)，再由视觉编码器 (如 ViT) 编码成一串视觉特征，投影层把它们映射成与文本 token
    同维度的向量
  - 图像 token 和文本 token 拼成一个序列送入语言模型，之后的 prefill 和 decode 与纯文本模型相同
  - 额外的开销集中在三处：预处理、视觉编码器的计算、以及图像 token 让 prefill 和 KV Cache 都变大

## 图像 token 数

ViT 把图像切成 $p\\times p$ 的小块 (patch)，每块一个 token，常再合并相邻的块：

$$ n\_{img}=\\frac{H}{p}\\cdot\\frac{W}{p}\\cdot\\frac{1}{m^2} $$

其中：

  - $H,W$：送入编码器的图像高、宽 (像素)；$p$：patch 大小，常见 $14$ 或 $16$
  - $m$：合并系数，把 $m\\times m$ 个相邻 patch 合成一个 token (如 $m=2$)，不合并时 $m=1$
  - 例：$448\\times448$、$p=14$、$m=2$：$\\frac{448}{14}\\times\\frac{448}{14}\\times\\frac14=256$
    个 token；分辨率翻倍到 $896\\times896$ 时变为 $1024$ 个 token，即 token 数与像素数成正比

| 处理方式        | 做法                        | token 数      |
| ----------- | ------------------------- | ------------ |
| 固定分辨率       | 统一缩放到如 $336\\times336$    | 固定，细节丢失      |
| 切块 (tiling) | 高分辨率图切成多个子图，各自编码，再加一张缩略图  | 随子图数量线性增加    |
| 动态分辨率       | 按原始宽高比和分辨率编码 (如 Qwen2-VL) | 随像素数增长，常设上下限 |

表中：高分辨率能看清小字和细节，但 token 数和计算量成倍增加；部署时应根据任务设置分辨率上限 (如最大像素数)，这是控制成本最有效的参数
`[经验]`。视频按帧采样，每帧都产生图像 token，token 数会非常大。

## 资源估算

  - 显存：语言模型权重 + 视觉编码器权重 (通常几百 M 到几 B 参数) + KV Cache；图像 token 与文本 token
    一样占 KV Cache，公式见 [Basics](@@IBAS@@)
  - TTFT：$\\approx
    t\_{preprocess}+t\_{vision}+t\_{prefill}(n\_{img}+n\_{text})$；一张高分辨率图带来上千个
    token，TTFT 会明显高于纯文本请求
  - 并发：每个请求的 token 数变多，同样的 KV 空间能服务的并发变少，估算方法见 [Sizing](@@DSIZ@@)
  - 例：$1024$ 个图像 token 在 Llama 3 8B 规模的语言模型上，KV 约 $1024\\times128$ KB
    $=128$ MB，相当于一段 $1000$ 多 token 的文本

## 部署要点

  - 预处理放在独立的线程或进程池，避免阻塞 GPU；图片下载 (URL 形式) 要设置超时和大小上限
  - 视觉编码的结果可以缓存：同一张图被多次提问时 (多轮对话) 不必重复编码，vLLM 等框架有多模态输入的缓存 `[待核实]`
  - 批处理：视觉编码器和语言模型的最佳 batch 不同，一些框架把视觉编码单独调度
  - 接口：OpenAI 兼容 API 中图像作为 `image_url` 类型的内容部分传入 (URL 或 base64)，见
    [Service](@@DSVC@@)
  - 框架支持：vLLM、SGLang、llama.cpp (mtmd)、OpenVINO GenAI (VLMPipeline) 都支持主流
    VLM，见 [Frameworks](@@DFW@@)

## Reference

  - [Visual Instruction Tuning
    (LLaVA)](https://arxiv.org/abs/2304.08485)
  - [Qwen2-VL: Enhancing Vision-Language Model's Perception of the World
    at Any Resolution](https://arxiv.org/abs/2409.12191)
  - [An Image is Worth 16x16 Words
    (ViT)](https://arxiv.org/abs/2010.11929)
  - [vLLM: Multimodal
    Inputs](https://docs.vllm.ai/en/latest/features/multimodal_inputs.html)
  - [OpenVINO GenAI: VLM
    pipeline](https://github.com/openvinotoolkit/openvino.genai)
