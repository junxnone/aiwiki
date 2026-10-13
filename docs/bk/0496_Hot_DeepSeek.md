-----

| Title     | Hot DeepSeek                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-02-05T05:20:29Z`                                |
| Updated @ | `2026-10-13T07:41:30Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/496) |

-----

# DeepSeek

  - MOE
  - MLA
  - 冷启动 + 多阶段强化学习
  - 混合推理架构（Thinking / Non-Thinking 模式切换，V3.1 起）
  - DSA（DeepSeek Sparse Attention，稀疏注意力，V3.2 起）

<!-- end list -->

``` markmap

# DeepSeek 发布的系列模型

- [DeepSeek-V4.1-Flash](https://huggingface.co/deepseek-ai/collections)（2026-09，552B MoE，原生图像理解，1M 上下文）
- [DeepSeek-V4 / V4-Pro / V4-Flash](https://huggingface.co/deepseek-ai/collections)（2026-04，通用模型系列，未走 R2 推理路线）
- [DeepSeekMath-V2](https://huggingface.co/deepseek-ai/collections)（2025-11）
- [DeepSeek-V3.2 / V3.2-Speciale](https://huggingface.co/collections/deepseek-ai/deepseek-v32)（2025-12，685B MoE，128K 上下文，$0.14/M token）
- [DeepSeek-OCR](https://huggingface.co/collections/deepseek-ai/deepseek-ocr)（2025-10）
- [DeepSeek-V3.2-Exp](https://huggingface.co/collections/deepseek-ai/deepseek-v32)（2025-09，引入 DSA 稀疏注意力）
- [DeepSeek-V3.1 / V3.1-Terminus](https://huggingface.co/deepseek-ai/DeepSeek-V3.1)（2025-08/09，混合思考模式）
- [DeepSeek-R1-0528](https://huggingface.co/deepseek-ai/DeepSeek-R1-0528)（2025-05，R1 推理能力重大更新）
- [DeepSeek-Prover-V2](https://huggingface.co/deepseek-ai/collections)（2025-04，7B & 671B）
- [DeepSeek-V3-0324](https://huggingface.co/deepseek-ai/DeepSeek-V3-0324)（2025-03，MIT 协议开源）
- [DeepSeek R1](https://huggingface.co/collections/deepseek-ai/deepseek-r1-678e1e131c0169c0bc89728d)
- [DeepSeek V3](https://huggingface.co/collections/deepseek-ai/deepseek-v3-676bc4546fb4876383c4208b)
- [DeepSeek VL2](https://huggingface.co/collections/deepseek-ai/deepseek-vl2-675c22accc456d3beb4613ab)
- [DeepSeek Prover](https://huggingface.co/collections/deepseek-ai/deepseek-prover-66beb212ae70890c90f24176)
- [DeepSeek V2](https://huggingface.co/collections/deepseek-ai/deepseek-v2-669a1c8b8f2dbc203fbd7746)
- [DeepSeekCoder V2](https://huggingface.co/collections/deepseek-ai/deepseekcoder-v2-666bf4b274a5f556827ceeca)
- [DeepSeek Math](https://huggingface.co/collections/deepseek-ai/deepseek-math-65f2962739da11599e441681)
- [ESFT](https://huggingface.co/collections/deepseek-ai/esft-669a1e800bc10b3460569c70)
- [DeepSeek VL](https://huggingface.co/collections/deepseek-ai/deepseek-vl-65f295948133d9cf92b706d3)
- [DeepSeek Coder](https://huggingface.co/collections/deepseek-ai/deepseek-coder-65f295d7d8a0a29fe39b4ec4)
- [DeepSeek LLM](https://huggingface.co/collections/deepseek-ai/deepseek-llm-65f2964ad8a0a29fe39b71d8)
- [DeepSeek MoE](https://huggingface.co/collections/deepseek-ai/deepseek-moe-65f29679f5cf26fe063686bf)
- [DeepSeek V2.5](https://huggingface.co/collections/deepseek-ai/deepseek-v25-66d97550c81167fc5e5e32e6)

```

## DeepSeek-R1 系列模型

``` markmap

# DeepSeek-R1

- R1
- R1-Zero
- R1-0528（2025-05 更新，推理深度/数学代码能力接近 o3、Gemini 2.5 Pro）
- Distill
  - Llama
    - 70B
    - 8B
  - Qwen
    - 32B
    - 14B
    - 7B
    - 1.5B

```

> R1 与 R1-0528 的推理能力已在 V3.1 开始收敛进入 V 系列的混合思考模式（Thinking/Non-Thinking
> 一体化），这也是 R1-0528 之后未再出现独立 R 系列新模型的架构原因。截至 2026-10，DeepSeek
> 官方尚未发布 R2：据报道因 CEO
> 梁文锋对效果不满意、叠加一次基于华为昇腾的训练尝试未达预期（已改回英伟达训练、保留昇腾用于推理），后续转而以
> V4 系列通用模型继续迭代，网传的 R2 参数规格均未获官方确认。

## 运行支持

  - sglang
  - vllm
  - ollama

## Reference

  - [huggingface - deepseek-ai](https://huggingface.co/deepseek-ai)
  - [huggingface - deepseek-ai
    collections](https://huggingface.co/deepseek-ai/collections)
  - [ollama-deepseek](https://ollama.com/library/deepseek-r1)
  - [huggingface 支持 vllm](https://github.com/vllm-project/vllm)
  - [一文读懂DeepSeek-R1本地部署配置要求](https://www.53ai.com/news/finetuning/2025020418637.html)
  - [DeepSeek-V3-0324 Release
    Notes](https://api-docs.deepseek.com/news/news250325/)
