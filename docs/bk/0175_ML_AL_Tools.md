-----

| Title     | ML AL Tools                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-01-28T05:58:27Z`                                |
| Updated @ | `2026-11-26T10:09:32Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/175) |

-----

# Tools

主动学习（Active Learning）相关的开源和商业工具：把「模型选择最有价值的样本」与「人工标注」结合，降低标注成本。

| Name                                                                                    | From         | UI               | Open Source |
| --------------------------------------------------------------------------------------- | ------------ | ---------------- | ----------- |
| [AIDE](/AL_AIDE)                                                                        | Microsoft    | √                | √           |
| [VOTT](https://github.com/microsoft/VoTT)                                               | Microsoft    | √                | √           |
| [label-studio](https://github.com/heartexlabs/label-studio)                             | Heartex      | √                | √           |
| [modAL](https://github.com/modAL-python/modAL/)                                         | modAL        | Jupyter notebook | √           |
| [ALiPy](https://github.com/NUAA-AL/alipy)                                               | NUAA-AL      | ×                | √           |
| [PyTorch Active Learning](https://github.com/rmunro/pytorch_active_learning)            | Robert Munro | ×                | √           |
| [active-learning ](https://github.com/google/active-learning)                           | Google       | ×                | √           |
| [EasyDL](https://ai.baidu.com/ai-doc/EASYDL/5k38n3pgw)                                  | Baidu        | √                | ×           |
| [ModelArts](https://support.huaweicloud.com/engineers-modelarts/modelarts_23_0212.html) | HuaWei       | √                | ×           |

表中：

  - **From**：提供方；**UI**：是否带图形界面（√ 有，× 无，或 Jupyter notebook 方式）；**Open
    Source**：是否开源
  - 对比结论：需要图形化标注协作选带 UI 的（AIDE、label-studio、VoTT）；做算法研究或定制采样策略选 Python
    库（modAL、ALiPy）

## 选择建议

| 需求                | 推荐                                                    |
| ----------------- | ----------------------------------------------------- |
| 图像标注加主动学习的完整工具    | [AIDE](https://github.com/junxnone/aiwiki/issues/270) |
| 通用标注平台，可对接自己的模型   | label-studio                                          |
| 研究采样策略（不确定性、委员会等） | modAL、ALiPy                                           |
| 无需自建的云服务          | EasyDL、ModelArts                                      |

表中：采样策略的原理见
[QBC](https://github.com/junxnone/aiwiki/issues/272)、[Stream-based
Selective Sampling](https://github.com/junxnone/aiwiki/issues/273)。
