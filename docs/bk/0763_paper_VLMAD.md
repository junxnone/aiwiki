-----

| Title     | paper VLMAD                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:15:08Z`                                |
| Updated @ | `2026-11-24T08:15:08Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/763) |

-----

# VLMAD 视觉语言模型异常检测

  - **VLM-AD**：用**视觉语言模型 (VLM)**，如 GPT-4V、LLaVA
    等，通过**自然语言提示**检测异常；提示中可以放入**正常参考图像**作比较
  - anomalib 中位于 `models/image/vlm_ad`，目录里没有 README，下面的内容依据源码文档字符串
  - 支持两种方式：**零样本**（不需要参考图）和**少样本**（用 `k` 张正常参考图提供上下文）

## 原理

``` mermaid
graph LR
    I["待检测图像"] --> P["构造提示<br/>任务说明 + k 张正常参考图"]
    R["k 张正常参考图<br/>少样本时使用"] --> P
    P --> B["VLM 后端<br/>ChatGPT Ollama HuggingFace"]
    B --> T["模型回答<br/>是否异常 及 描述"]
    T --> S["解析回答 得到异常判定"]
```

图中：

  - 把待检测图像和（少样本时）正常参考图一起放进提示，用自然语言要求模型判断图像是否异常
  - 通过**后端**调用不同的 VLM：`ChatGPT`、`Ollama`、`Huggingface`
  - 解析模型的文字回答，得到图像级异常判定；评估使用 F1

可用的模型（源码里的枚举）：

| Backend     | 模型                                             |
| ----------- | ---------------------------------------------- |
| Ollama      | `LLAMA_OLLAMA`（默认）                             |
| ChatGPT     | `GPT_4O_MINI`，需要 API key                       |
| Huggingface | `VICUNA_7B_HF`、`VICUNA_13B_HF`、`MISTRAL_7B_HF` |

表中是 `VlmAd` 的 `model` 参数可选值：本地部署可以用 Ollama 或 HuggingFace，云端用 ChatGPT（需要
API key）。

## 使用

``` python
from anomalib.models.image import VlmAd
from anomalib.data import MVTecAD
from anomalib.engine import Engine

model = VlmAd(model="gpt-4-vision-preview", api_key="YOUR_API_KEY", k_shot=3)   # k_shot 为 0 即零样本
datamodule = MVTecAD()
engine = Engine()
predictions = engine.predict(model=model, datamodule=datamodule)
```

源码文档示例中使用了 `gpt-4-vision-preview`，但枚举里列出的可用模型是上表中的几个，请以实际代码为准。

## 特点

| Name      | 说明                   |
| --------- | -------------------- |
| 零样本 / 少样本 | 不需要训练，提示里放参考图即可提升效果  |
| 可解释       | 模型用文字回答，可以附带异常的描述    |
| 通用        | 可以描述各种「逻辑性」异常（如缺少零件） |
| 输出粒度      | 以图像级判定为主，没有像素级异常图    |

表中是 VLM-AD 的特点：它不是传统意义的「检测网络」，而是用大模型做判断，部署灵活，但成本和速度是主要问题。

## 优缺点

  - **优点**：无需训练；零样本可用；回答可解释；可处理语义/逻辑异常
  - **缺点**：推理慢、成本高（调用 API 或运行大模型）；输出不稳定，依赖提示设计；没有像素级定位；评估与传统 AUROC
    不同（输出是离散的文字回答，使用 F1）

## Reference

  - [anomalib -
    vlm\_ad](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/vlm_ad)
