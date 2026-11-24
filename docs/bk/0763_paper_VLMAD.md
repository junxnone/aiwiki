-----

| Title     | paper VLMAD                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:15:08Z`                                |
| Updated @ | `2026-11-24T09:20:57Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/763) |

-----

# VLMAD 视觉语言模型异常检测

  - **VLM-AD**：用**视觉语言模型 (VLM)**
    通过**自然语言提示**检测异常，提示里可以放入**正常参考图像**作比较。这是
    anomalib 自己的实现，**不对应某一篇特定论文**，所以下面的内容依据 anomalib
    的源码和文档字符串（`models/image/vlm_ad`，目录没有
    README），而不是论文
  - 类型：图像级判定 + 文字解释，没有像素级异常图
  - 支持两种方式：**零样本**（`k_shot=0`，不需要参考图）和**少样本**（用 $k$ 张从训练集收集的正常参考图提供上下文）
  - 与依赖 CLIP 文本提示的 [WinCLIP](/0468_paper_WinCLIP) 不同：VLM-AD
    不是算相似度，而是**直接让多模态大模型用文字回答**「这张图是否异常」

## 原理

``` mermaid
graph LR
    I["待检测图像"] --> Q["构造对话<br/>少样本时先发 k 张正常参考图 和 few_shot 提示"]
    R["k 张正常参考图<br/>从训练集收集"] --> Q
    Q --> B["VLM 后端<br/>Ollama LLaVA 或 ChatGPT 或 HuggingFace LLaVA"]
    B --> T["模型回答<br/>以 YES 或 NO 开头 后接原因"]
    T --> L["以 Y 开头判为异常<br/>其余判为正常 完整回答作为解释"]
```

图中：

  - **构造对话**：anomalib 里有两种提示。**预测提示 (predict)** 是：「You are given an
    image. It is either normal or anomalous. First say 'YES' if the
    image is anomalous, or 'NO' if it is normal. Then give the reason
    for your decision. For example, 'YES: The image has a crack on the
    wall.'」，即要求模型先回答 YES/NO，再给理由。**少样本提示 (few\_shot)** 是：「These are a
    few examples of normal picture without any anomalies. You have to
    use these to determine if the image I provide in the next chat is
    normal or anomalous.」，用来告诉模型这些参考图是正常样本
  - **少样本参考图的收集**：当 `k_shot > 0` 时，`_setup` 阶段从训练集的 dataloader 里按顺序取前
    $k$ 张正常图像的路径，作为后端的参考图像
  - **判定规则**：对每张图调用后端得到文字回答；**回答以字母 `Y` 开头就判为异常（标签 1），否则为正常（标签
    0）**；完整的回答文字保存在 `explanation` 里，作为**可读的解释**
  - `validation_step`、`test_step`、`predict_step`
    都是同一个逻辑，所以验证、测试、预测使用同样的流程；模型的学习类型：`k_shot=0`
    为 `ZERO_SHOT`，否则为 `FEW_SHOT`

## 支持的 VLM

`ModelName` 枚举里列出了可用的 VLM，它们都是 **LLaVA** 系列或 OpenAI 的小模型：

| Backend     | 枚举值                | 实际模型                                                          |
| ----------- | ------------------ | ------------------------------------------------------------- |
| Ollama      | `LLAMA_OLLAMA`（默认） | `llava`（在本地用 Ollama 运行的 LLaVA）                                |
| ChatGPT     | `GPT_4O_MINI`      | `gpt-4o-mini`，需要 `api_key`                                    |
| HuggingFace | `VICUNA_7B_HF`     | `llava-hf/llava-v1.6-vicuna-7b-hf`（LLaVA v1.6，Vicuna 7B 基座）   |
| HuggingFace | `VICUNA_13B_HF`    | `llava-hf/llava-v1.6-vicuna-13b-hf`（LLaVA v1.6，Vicuna 13B 基座） |
| HuggingFace | `MISTRAL_7B_HF`    | `llava-hf/llava-v1.6-mistral-7b-hf`（LLaVA v1.6，Mistral 7B 基座） |

表中是 `VlmAd(model=...)` 的可选值：本地部署可用 Ollama 或 HuggingFace；云端使用 ChatGPT（需
API key）。HuggingFace 模型可以通过 `hf_model_revision` 指定 commit
哈希或标签来保证**可复现**，不指定时使用 `main` 并给出警告；这个参数只对
HuggingFace 模型生效，对其他模型会被忽略并给出警告。若传入不支持的模型会抛出 `ValueError`。源码文档字符串的示例里出现过
`gpt-4-vision-preview`，但真正可用的是上表的枚举，以实际代码为准。

此外，源码里把 `ModelName` 加进了 checkpoint
的安全全局名单（`checkpoint_safe_globals`），这样在使用
`weights_only` 方式加载 checkpoint 时枚举能被识别。

## 评估方式

  - 因为输出是离散的文字回答（YES/NO），模型没有连续的异常分数，所以**无法计算 AUROC 这类阈值扫描指标**；anomalib
    的 VLM-AD 默认使用 F1 作为评估指标（见 [Anomaly Detection
    Metrics](/0711_ML_Metrics_Anomaly)）
  - 只能给出图像级判定和文字解释，没有像素级的异常图；README 没有提供 benchmark 数值

## 特点与局限

  - **优点**：无需训练；零样本可用，少样本时放参考图可提升上下文；回答带有文字**解释**，可读、可解释；能描述语义或逻辑层面的异常（如缺少零件）；换模型简单
  - **局限**：推理慢、成本高（调用 API 或运行大模型）；输出不稳定，依赖提示设计和模型本身；没有像素级定位；没有连续分数，评估只能用
    F1 等阈值型指标；用 YES/NO 做二分类，容易对「看起来合理」的缺陷给出错误回答；依赖外部服务时有隐私和成本问题

## Reference

  - [anomalib -
    vlm\_ad](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/vlm_ad)
  - [LLaVA: Large Language and Vision
    Assistant](https://llava-vl.github.io/)
