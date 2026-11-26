---
Title | paper AdaBLDM InferenceCode
-- | --
Created @ | `2025-05-12T03:25:54Z`
Updated @| `2026-11-26T10:11:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/516)

---
# Inference Code 分析

AdaBLDM 推理阶段的关键代码：解码器的在线自适应，以及驱动优化的损失函数。

```mermaid
flowchart LR
    A[扩散模型生成潜变量] --> B[解码得到图像]
    B --> C[计算损失 非异常区域与异常区域]
    C --> D[优化解码器参数]
    D --> B
```

图中：每次解码后用损失评价当前图像，并反向更新解码器，重复多次后得到更自然的结果（即「在线自适应」）。


## Online Decoder Adaption
- 自适应优化解码器优化图像生成

<iframe frameborder="0" scrolling="no" style="width:100%; height:268px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fjunxnone%2FAdaBLDM%2Fblob%2F44a71f07dc62d4477cc6255a96e5defe2c430b3c%2Ftest.py%23L310-L318++&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>


### Loss

- 分别计算当前图像在非异常区域(与无缺陷图像对比)和异常区域(和当前优化后的图像对比)的差异

<iframe frameborder="0" scrolling="no" style="width:100%; height:184px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fjunxnone%2FAdaBLDM%2Fblob%2F44a71f07dc62d4477cc6255a96e5defe2c430b3c%2Ftest.py%23L303-L307&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>

按上面的描述，损失可写成：

$$
\mathcal{L}=\big\lVert(1-M)\odot(\hat{x}-x_{ref})\big\rVert+\big\lVert M\odot(\hat{x}-x_{cur})\big\rVert
$$

其中：

- $\hat{x}$：当前解码得到的图像；$M$：异常区域掩码（异常区域为 1）；$\odot$：逐元素相乘
- $x_{ref}$：无缺陷的参考图像，用于约束非异常区域保持不变
- $x_{cur}$：当前优化过程中的图像，用于约束异常区域与优化后的结果一致
- 说明：公式根据文字描述整理，具体范数与权重请以代码为准

