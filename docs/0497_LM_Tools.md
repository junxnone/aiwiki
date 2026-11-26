---
Title | LM Tools
-- | --
Created @ | `2025-02-05T06:58:17Z`
Updated @| `2026-11-26T15:43:38Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/497)

---
# 大模型相关工具

## 大模型试用 Web/App
- ChatGPT系列 OpenAI
- [Gemini](https://gemini.google.com/) - Google
- 豆包 App - 字节跳动
  - web 扩展可以读论文
- DeepSeek - 深度求索
- 文小言 - 百度
- 智普清言
- 通义 - 阿里
- 天工
- ...


## 大模型推理框架
- [sglang](https://github.com/sgl-project/sglang)
- [ollama](https://ollama.com/)
- [vllm](https://github.com/vllm-project/vllm)
- [llama.cpp](https://github.com/ggerganov/llama.cpp)
- [MNN-LLM](https://github.com/alibaba/MNN/blob/master/README_CN.md)

### 对比

| 框架 | 定位 | 特点 |
| --- | --- | --- |
| vllm | 服务端高吞吐推理 | PagedAttention、Continuous Batching，GPU 上吞吐高 |
| sglang | 服务端推理与结构化生成 | RadixAttention 复用前缀，擅长多轮和结构化输出 |
| llama.cpp | 本地 / 端侧轻量推理 | C/C++，支持 CPU 与多种硬件，GGUF 量化格式 |
| ollama | 本地一键运行 | 早期基于 llama.cpp，提供简单的命令行与 API |
| MNN-LLM | 移动端 / 端侧 | 阿里 MNN 框架的 LLM 推理，面向手机等设备 |

表中：

- **PagedAttention / RadixAttention**：分别是分页管理 KV Cache、用基数树复用相同前缀的技术
- **GGUF**：llama.cpp 使用的模型文件与量化格式
- 对比结论：服务端高并发选 vllm / sglang，个人电脑和端侧选 llama.cpp / ollama / MNN-LLM；指标含义见 [LLMs Metrics](/0503_LM_LLMs_Metrics)；功能矩阵、TensorRT-LLM / OpenVINO GenAI 等更多框架的对比与选型见 [Frameworks](/0842_LM_Deploy_Frameworks)，TGI 已进入维护模式

## 相关补充

- 模型仓库与下载：Hugging Face、ModelScope（魔搭）
- 应用开发框架：LangChain、LlamaIndex、Dify，常用于 RAG（见 [RAG](/0461_LM_RAG)）
- Intel 平台推理：OpenVINO GenAI，见 [OpenVINO](/0848_LM_Deploy_OpenVINO)
- 部署全流程 (格式转换、资源估算、服务化、压测) 见 [Deploy](/0820_LM_Deploy)


